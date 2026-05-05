import { createServer } from "node:http";
import { performance } from "node:perf_hooks";
import { Server as SocketIOServer } from "socket.io";
import { demoScreens } from "../config/demoScreens";
import type { DisplayState } from "../types/display";

const port = Number(process.env.REALTIME_PORT ?? 3001);

const allowedOrigins = (
  process.env.REALTIME_CORS_ORIGIN ?? "http://localhost:3000"
)
  .split(",")
  .map((origin) => origin.trim());

const initialNow = performance.now();

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

function getTimerSnapshot() {
  const timer = displayState.timer;

  if (timer.status !== "running" || timer.targetEndTimeServerMs === undefined) {
    return timer;
  }

  const now = performance.now();
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

  const delayMs = Math.max(0, timer.targetEndTimeServerMs - performance.now());

  timerFinishTimeout = setTimeout(() => {
    finishTimerIfExpired(io);
  }, delayMs + 1);
}

const httpServer = createServer((request, response) => {
  if (request.url === "/health") {
    response.writeHead(200, { "Content-Type": "application/json" });
    response.end(
      JSON.stringify({
        ok: true,
        service: "caudri-dashboard-realtime",
        timerStatus: displayState.timer.status,
      }),
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
    const now = performance.now();

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
    const now = performance.now();
    const timer = getTimerSnapshot();

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
    const now = performance.now();
    const timer = getTimerSnapshot();

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
    const now = performance.now();

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

    console.log(`[timer] reset`);
  });

  socket.on("timer:finish-now", () => {
    const now = performance.now();
    const timer = getTimerSnapshot();

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
}, 1_000);

httpServer.listen(port, "0.0.0.0", () => {
  console.log("> CAuDri-Challenge realtime server ready");
  console.log(`> http://0.0.0.0:${port}`);
  console.log(`> allowed origins: ${allowedOrigins.join(", ")}`);
});
