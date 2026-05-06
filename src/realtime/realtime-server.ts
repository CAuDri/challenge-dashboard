import { createServer } from "node:http";
import { monitorEventLoopDelay } from "node:perf_hooks";
import { Server as SocketIOServer } from "socket.io";
import { demoScreens } from "../config/demoScreens";
import type { DisplayState } from "../types/display";

const port = Number(process.env.REALTIME_PORT ?? 3001);

const allowedOrigins = (
  process.env.REALTIME_CORS_ORIGIN ?? "http://localhost:3000"
)
  .split(",")
  .map((origin) => origin.trim());

// function nowMs() {
//   return Number(process.hrtime.bigint()) / 1_000_000;
// }

function nowMs() {
  return Date.now();
}

const eventLoopDelay = monitorEventLoopDelay({
  resolution: 20,
});

eventLoopDelay.enable();

setInterval(() => {
  const meanMs = eventLoopDelay.mean / 1_000_000;
  const p99Ms = eventLoopDelay.percentile(99) / 1_000_000;
  const maxMs = eventLoopDelay.max / 1_000_000;

  console.log(
    `[event-loop] mean=${meanMs.toFixed(2)}ms p99=${p99Ms.toFixed(
      2,
    )}ms max=${maxMs.toFixed(2)}ms`,
  );

  eventLoopDelay.reset();
}, 5_000);

const initialNow = nowMs();

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
    updatedAtServerMs: initialNow,
    targetEndTimeServerMs: undefined,
    startedAtServerMs: undefined,
    pausedAtServerMs: undefined,
    finishedAtServerMs: undefined,
  },
  autoEndRunWhenTimerFinished: false,
};

let timerFinishTimeout: NodeJS.Timeout | null = null;

function clearTimerFinishTimeout() {
  if (timerFinishTimeout !== null) {
    clearTimeout(timerFinishTimeout);
    timerFinishTimeout = null;
  }
}

function applyAutoFinishIfNeeded() {
  if (
    displayState.autoEndRunWhenTimerFinished &&
    displayState.currentRun.phase === "running"
  ) {
    displayState.currentRun = {
      ...displayState.currentRun,
      phase: "finish",
    };
  }
}

function getTimerSnapshotAt(now: number) {
  const timer = displayState.timer;

  if (timer.status !== "running" || timer.targetEndTimeServerMs === undefined) {
    return timer;
  }

  const remainingMs = Math.max(0, timer.targetEndTimeServerMs - now);

  if (remainingMs > 0) {
    return {
      ...timer,
      remainingMs,
    };
  }

  const officialFinishedAtServerMs = timer.targetEndTimeServerMs;

  displayState.timer = {
    ...timer,
    status: "finished",
    remainingMs: 0,
    updatedAtServerMs: now,
    targetEndTimeServerMs: undefined,
    finishedAtServerMs: officialFinishedAtServerMs,
  };

  clearTimerFinishTimeout();
  applyAutoFinishIfNeeded();

  return displayState.timer;
}

function getTimerSnapshot() {
  return getTimerSnapshotAt(nowMs());
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

function finishTimerIfExpired(io: SocketIOServer) {
  const previousStatus = displayState.timer.status;
  const snapshot = getTimerSnapshot();

  if (previousStatus === "running" && snapshot.status === "finished") {
    broadcastDisplayState(io);
    return true;
  }

  return false;
}

function scheduleTimerFinish(io: SocketIOServer) {
  clearTimerFinishTimeout();

  const timer = displayState.timer;

  if (timer.status !== "running" || timer.targetEndTimeServerMs === undefined) {
    return;
  }

  const delayMs = Math.max(0, timer.targetEndTimeServerMs - nowMs());

  timerFinishTimeout = setTimeout(() => {
    finishTimerIfExpired(io);
  }, delayMs + 1);
}

const httpServer = createServer((request, response) => {
  if (request.url === "/health") {
    const snapshot = getDisplayStateSnapshot();

    response.writeHead(200, { "Content-Type": "application/json" });
    response.end(
      JSON.stringify({
        ok: true,
        service: "caudri-dashboard-realtime",
        timerStatus: snapshot.timer.status,
        durationMs: snapshot.timer.durationMs,
        remainingMs: snapshot.timer.remainingMs,
        targetEndTimeServerMs: snapshot.timer.targetEndTimeServerMs,
        updatedAtServerMs: snapshot.timer.updatedAtServerMs,
        startedAtServerMs: snapshot.timer.startedAtServerMs,
        pausedAtServerMs: snapshot.timer.pausedAtServerMs,
        finishedAtServerMs: snapshot.timer.finishedAtServerMs,
        phase: snapshot.currentRun.phase,
      }),
    );
    return;
  }

  if (request.url === "/timer-debug") {
    const now = nowMs();
    const snapshot = getDisplayStateSnapshot();

    response.writeHead(200, { "Content-Type": "application/json" });
    response.end(
      JSON.stringify(
        {
          nowMs: now,
          timer: snapshot.timer,
          targetDeltaMs:
            snapshot.timer.targetEndTimeServerMs !== undefined
              ? snapshot.timer.targetEndTimeServerMs - now
              : null,
          rawStoredTimer: displayState.timer,
        },
        null,
        2,
      ),
    );
    return;
  }

  response.writeHead(404);
  response.end();
});

const io = new SocketIOServer(httpServer, {
  path: "/socket.io",
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log(`[socket] client connected: ${socket.id}`);

  socket.emit("display:state", getDisplayStateSnapshot());

  socket.on("display:request-state", () => {
    socket.emit("display:state", getDisplayStateSnapshot());
  });

  socket.on("time:sync-request", (payload: { clientSentAt?: unknown }) => {
    if (typeof payload.clientSentAt !== "number") {
      return;
    }

    socket.emit("time:sync-response", {
      clientSentAt: payload.clientSentAt,
    });
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

  socket.on("display:set-active-screen", (payload: { screenId?: unknown }) => {
    if (typeof payload.screenId !== "string") {
      return;
    }

    displayState.activeScreenId = payload.screenId;

    broadcastDisplayState(io);

    console.log(
      `[display] active screen changed: ${displayState.activeScreenId}`,
    );
  });

  socket.on("timer:set-duration", (payload: { durationMs?: unknown }) => {
    if (typeof payload.durationMs !== "number") {
      return;
    }

    const durationMs = Math.max(0, Math.round(payload.durationMs));
    const now = nowMs();

    clearTimerFinishTimeout();

    displayState.timer = {
      status: "stopped",
      durationMs,
      remainingMs: durationMs,
      updatedAtServerMs: now,
      targetEndTimeServerMs: undefined,
      startedAtServerMs: undefined,
      pausedAtServerMs: undefined,
      finishedAtServerMs: undefined,
    };

    broadcastDisplayState(io);

    console.log(`[timer] duration set: ${durationMs} ms`);
  });

  socket.on("timer:start", () => {
    const now = nowMs();
    const timer = getTimerSnapshotAt(now);

    if (timer.status === "running" || timer.remainingMs <= 0) {
      return;
    }

    displayState.timer = {
      ...timer,
      status: "running",
      updatedAtServerMs: now,
      startedAtServerMs: now,
      pausedAtServerMs: undefined,
      finishedAtServerMs: undefined,
      targetEndTimeServerMs: now + timer.remainingMs,
    };

    scheduleTimerFinish(io);
    broadcastDisplayState(io);

    console.log(
      `[timer] started: remaining=${displayState.timer.remainingMs} ms`,
    );
  });

  socket.on("timer:pause", () => {
    const now = nowMs();
    const timer = getTimerSnapshotAt(now);

    if (timer.status !== "running") {
      return;
    }

    clearTimerFinishTimeout();

    displayState.timer = {
      ...timer,
      status: "paused",
      remainingMs: timer.remainingMs,
      updatedAtServerMs: now,
      pausedAtServerMs: now,
      targetEndTimeServerMs: undefined,
    };

    broadcastDisplayState(io);

    console.log(`[timer] paused: remaining=${timer.remainingMs} ms`);
  });

  socket.on("timer:reset", () => {
    const now = nowMs();

    clearTimerFinishTimeout();

    displayState.timer = {
      status: "stopped",
      durationMs: displayState.timer.durationMs,
      remainingMs: displayState.timer.durationMs,
      updatedAtServerMs: now,
      targetEndTimeServerMs: undefined,
      startedAtServerMs: undefined,
      pausedAtServerMs: undefined,
      finishedAtServerMs: undefined,
    };

    broadcastDisplayState(io);

    console.log("[timer] reset");
  });

  socket.on("timer:finish-now", () => {
    const now = nowMs();
    const timer = getTimerSnapshotAt(now);

    clearTimerFinishTimeout();

    const remainingMs =
      timer.status === "running" && timer.targetEndTimeServerMs !== undefined
        ? Math.max(0, timer.targetEndTimeServerMs - now)
        : timer.remainingMs;

    displayState.timer = {
      ...timer,
      status: "finished",
      remainingMs,
      updatedAtServerMs: now,
      targetEndTimeServerMs: undefined,
      finishedAtServerMs: now,
    };

    applyAutoFinishIfNeeded();
    broadcastDisplayState(io);

    console.log(`[timer] finished manually: remaining=${remainingMs} ms`);
  });

  socket.on("disconnect", () => {
    console.log(`[socket] client disconnected: ${socket.id}`);
  });
});

setInterval(() => {
  finishTimerIfExpired(io);
}, 50);

httpServer.listen(port, "0.0.0.0", () => {
  console.log("> CAuDri-Challenge realtime server ready");
  console.log(`> http://0.0.0.0:${port}`);
  console.log(`> allowed origins: ${allowedOrigins.join(", ")}`);
});
