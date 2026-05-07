import { createServer } from "node:http";
import next from "next";
import { Server as SocketIOServer } from "socket.io";
import { demoScreens } from "../config/demoScreens";
import type { DisplayState } from "../types/display";
import { performance } from "node:perf_hooks";

const dev = process.env.NODE_ENV !== "production";
// const hostname = process.env.HOSTNAME ?? "0.0.0.0";
const hostname = "0.0.0.0";
const port = Number(process.env.PORT ?? 3000);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

const now = performance.now();

const displayState: DisplayState = {
  activeScreenId: "fallback",
  screens: demoScreens,
  teams: [],
  currentRun: {
    selectedTeamId: undefined,
    selectedDisciplineId: undefined,
    phase: "standby",
    preparationDurationMs: 30 * 1000,
    runDurationMs: 3 * 60 * 1000,
  },
  timer: {
    status: "stopped",
    durationMs: 3 * 60 * 1000,
    remainingMs: 3 * 60 * 1000,
    updatedAtServerMs: now,
    targetEndTimeServerMs: undefined,
  },
  autoEndRunWhenTimerFinished: false,
  trafficLight: {
    config: {
      transport: "http",
      host: "caudri-traffic-light",
      autoConnect: true,
      syncWithRunControl: true,
      enabled: true,
      pollIntervalMs: 2_000,
    },
    runtime: {
      connectionStatus: "idle",
      reportedColor: "unknown",
      expectedColor: undefined,
      temperatureC: undefined,
      lastSeenAtServerMs: undefined,
      lastError: undefined,
    },
  },
};

function getTimerSnapshot() {
  const now = performance.now();
  const timer = displayState.timer;

  if (timer.status !== "running" || timer.targetEndTimeServerMs === undefined) {
    return timer;
  }

  const remainingMs = Math.max(0, timer.targetEndTimeServerMs - now);

  if (remainingMs <= 0) {
    displayState.timer = {
      ...timer,
      status: "finished",
      remainingMs: 0,
      updatedAtServerMs: now,
      targetEndTimeServerMs: undefined,
    };

    if (
      displayState.autoEndRunWhenTimerFinished &&
      displayState.currentRun.phase === "running"
    ) {
      displayState.currentRun = {
        ...displayState.currentRun,
        phase: "finish",
      };
    }

    return displayState.timer;
  }

  return {
    ...timer,
    remainingMs,
  };
}

function getDisplayStateSnapshot(): DisplayState {
  return {
    ...displayState,
    timer: getTimerSnapshot(),
  };
}

function broadcastDisplayState(io: SocketIOServer) {
  io.emit("display:state", getDisplayStateSnapshot());
}

async function main() {
  await app.prepare();

  const httpServer = createServer((request, response) => {
    handle(request, response);
  });

  const io = new SocketIOServer(httpServer, {
    path: "/socket.io",
  });

  io.on("connection", (socket) => {
    console.log(`[socket] client connected: ${socket.id}`);

    socket.emit("display:state", getDisplayStateSnapshot());

    socket.on("display:request-state", () => {
      socket.emit("display:state", getDisplayStateSnapshot());
    });

    socket.on("display:set-state", (payload: unknown) => {
      if (typeof payload !== "object" || payload === null) {
        return;
      }

      const candidate = payload as Partial<DisplayState>;

      if (
        typeof candidate.activeScreenId !== "string" ||
        !Array.isArray(candidate.screens) ||
        !Array.isArray(candidate.teams) ||
        typeof candidate.currentRun !== "object" ||
        candidate.currentRun === null
      ) {
        return;
      }

      displayState.activeScreenId = candidate.activeScreenId;
      displayState.screens = candidate.screens;
      displayState.teams = candidate.teams;
      displayState.currentRun = candidate.currentRun;

      if (typeof candidate.autoEndRunWhenTimerFinished === "boolean") {
        displayState.autoEndRunWhenTimerFinished =
          candidate.autoEndRunWhenTimerFinished;
      }

      broadcastDisplayState(io);

      console.log(
        `[display] state updated: activeScreenId=${displayState.activeScreenId}, screens=${displayState.screens.length}, teams=${displayState.teams.length}, phase=${displayState.currentRun.phase}`,
      );
    });

    socket.on(
      "display:set-active-screen",
      (payload: { screenId?: unknown }) => {
        if (typeof payload.screenId !== "string") {
          return;
        }

        displayState.activeScreenId = payload.screenId;

        broadcastDisplayState(io);

        console.log(
          `[display] active screen changed: ${displayState.activeScreenId}`,
        );
      },
    );

    socket.on("disconnect", () => {
      console.log(`[socket] client disconnected: ${socket.id}`);
    });

    socket.on("timer:set-duration", (payload: { durationMs?: unknown }) => {
      if (typeof payload.durationMs !== "number") {
        return;
      }

      const durationMs = Math.max(0, Math.round(payload.durationMs));
      const now = performance.now();

      displayState.timer = {
        status: "stopped",
        durationMs,
        remainingMs: durationMs,
        updatedAtServerMs: now,
        targetEndTimeServerMs: undefined,
      };

      broadcastDisplayState(io);
    });

    socket.on("timer:start", () => {
      const now = performance.now();
      const timer = getTimerSnapshot();

      if (timer.status === "running" || timer.remainingMs <= 0) {
        return;
      }

      displayState.timer = {
        ...timer,
        status: "running",
        updatedAtServerMs: now,
        targetEndTimeServerMs: now + timer.remainingMs,
      };

      broadcastDisplayState(io);
    });

    socket.on("timer:pause", () => {
      const now = performance.now();
      const timer = getTimerSnapshot();

      if (timer.status !== "running") {
        return;
      }

      displayState.timer = {
        ...timer,
        status: "paused",
        remainingMs: timer.remainingMs,
        updatedAtServerMs: now,
        targetEndTimeServerMs: undefined,
      };

      broadcastDisplayState(io);
    });

    socket.on("timer:reset", () => {
      const now = performance.now();

      displayState.timer = {
        status: "stopped",
        durationMs: displayState.timer.durationMs,
        remainingMs: displayState.timer.durationMs,
        updatedAtServerMs: now,
        targetEndTimeServerMs: undefined,
      };

      broadcastDisplayState(io);
    });

    socket.on("time:sync-request", (payload: { clientSentAt?: unknown }) => {
      if (typeof payload.clientSentAt !== "number") {
        return;
      }

      socket.emit("time:sync-response", {
        clientSentAt: payload.clientSentAt,
      });
    });
  });

  setInterval(() => {
    const previousStatus = displayState.timer.status;
    const snapshot = getTimerSnapshot();

    if (previousStatus === "running" && snapshot.status === "finished") {
      broadcastDisplayState(io);
    }
  }, 100);

  httpServer.listen(port, hostname, () => {
    console.log("> CAuDri-Challenge dashboard ready");
    console.log(`> http://${hostname}:${port}`);
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
