import { config } from "dotenv";

config({ path: ".env.local" });
config();

import { reverse } from "node:dns/promises";
import { createServer } from "node:http";
import { Server as SocketIOServer, type Socket } from "socket.io";
import { demoScreens } from "../config/demoScreens";
import type { DisplayState } from "../types/display";
import type {
  DisplayClientInfo,
  DisplayControlState,
} from "../types/display-client";
import {
  clearPendingPersistedDashboardStateSave,
  createPersistedStateFromDisplayState,
  loadPersistedDashboardState,
  mergePersistedStateWithDefaults,
  savePersistedDashboardState,
  savePersistedDashboardStateDebounced,
} from "./state-store";
import type { PersistedDashboardState } from "@/types/persistence";
import { saveDataUrlAsset, readAsset } from "./asset-store";
import type { AssetUploadRequest } from "../types/assets";
import type { IncomingMessage, ServerResponse } from "node:http";
import {
  createDashboardBackupZip,
  restoreDashboardBackupZip,
} from "./dashboard-backup";
import {
  getTrafficLightColorForRunPhase,
  type TrafficLightColor,
  type TrafficLightConfig,
  type TrafficLightRuntime,
} from "../types/traffic-light";
import {
  createTrafficLightClient,
  normalizeTrafficLightHost,
} from "./traffic-light-client";

const port = Number(process.env.REALTIME_PORT ?? 3001);

const allowedOrigins = (
  process.env.REALTIME_CORS_ORIGIN ?? "*"
)
  .split(",")
  .map((origin) => origin.trim());

// function nowMs() {
//   return Number(process.hrtime.bigint()) / 1_000_000;
// }

function nowMs() {
  return Date.now();
}

function isAllowedOrigin(origin: string | undefined) {
  if (!origin) {
    return true;
  }

  return allowedOrigins.includes("*") || allowedOrigins.includes(origin);
}

function setCorsHeaders(request: IncomingMessage, response: ServerResponse) {
  const origin = request.headers.origin;

  if (allowedOrigins.includes("*")) {
    response.setHeader("Access-Control-Allow-Origin", "*");
  } else if (typeof origin === "string" && isAllowedOrigin(origin)) {
    response.setHeader("Access-Control-Allow-Origin", origin);
    response.setHeader("Vary", "Origin");
  }

  response.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  response.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization",
  );
}

function getSocketIoCorsOrigin() {
  if (allowedOrigins.includes("*")) {
    return true;
  }

  return allowedOrigins;
}

const initialNow = nowMs();

const defaultTrafficLightConfig: TrafficLightConfig = {
  transport: "http",
  host: "caudri-traffic-light",
  autoConnect: true,
  syncWithRunControl: true,
  enabled: true,
  pollIntervalMs: 2_000,
};

function createDefaultTrafficLightRuntime(): TrafficLightRuntime {
  return {
    connectionStatus: "idle",
    reportedColor: "unknown",
    expectedColor: undefined,
    temperatureC: undefined,
    lastSeenAtServerMs: undefined,
    lastError: undefined,
  };
}

const defaultPersistedDashboardState: PersistedDashboardState = {
  activeScreenId: "fallback",
  screens: demoScreens,
  teams: [],
  currentRun: {
    selectedTeamId: undefined,
    selectedDisciplineId: "freedrive",
    phase: "standby",
    preparationDurationMs: 30 * 1000,
    runDurationMs: 3 * 60 * 1000,
  },
  autoEndRunWhenTimerFinished: false,
  trafficLight: defaultTrafficLightConfig,
};

const displayClients = new Map<string, DisplayClientInfo>();
let displayControl: DisplayControlState = {
  syncEnabled: true,
  mainDisplayClientId: undefined,
  pdfPages: {},
  scoreboardReveals: {},
};

let displayState: DisplayState = {
  ...defaultPersistedDashboardState,
  timer: {
    status: "stopped",
    durationMs: defaultPersistedDashboardState.currentRun.runDurationMs,
    remainingMs: defaultPersistedDashboardState.currentRun.runDurationMs,
    updatedAtServerMs: initialNow,
    targetEndTimeServerMs: undefined,
    startedAtServerMs: undefined,
    pausedAtServerMs: undefined,
    finishedAtServerMs: undefined,
  },
  trafficLight: {
    config: defaultTrafficLightConfig,
    runtime: createDefaultTrafficLightRuntime(),
  },
  displayClients: [],
  displayControl,
  diagnostics: {
    serverNowMs: initialNow,
    activeScreenId: defaultPersistedDashboardState.activeScreenId,
    timerStatus: "stopped",
    currentRunPhase: defaultPersistedDashboardState.currentRun.phase,
    displayClientCount: 0,
    connectedDisplayClientCount: 0,
  },
};

let timerFinishTimeout: NodeJS.Timeout | null = null;
let trafficLightPollTimeout: NodeJS.Timeout | null = null;
let trafficLightRequestSequence = 0;
let trafficLightSyncArmed = false;

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
  const timer = getTimerSnapshot();
  const clients = Array.from(displayClients.values());

  return {
    ...displayState,
    timer,
    displayClients: clients,
    displayControl,
    diagnostics: {
      serverNowMs: nowMs(),
      activeScreenId: displayState.activeScreenId,
      timerStatus: timer.status,
      currentRunPhase: displayState.currentRun.phase,
      displayClientCount: clients.length,
      connectedDisplayClientCount: clients.filter(
        (client) => client.status === "connected",
      ).length,
    },
  };
}

function createStoppedTimer(durationMs: number) {
  const now = nowMs();

  return {
    status: "stopped" as const,
    durationMs,
    remainingMs: durationMs,
    updatedAtServerMs: now,
    targetEndTimeServerMs: undefined,
    startedAtServerMs: undefined,
    pausedAtServerMs: undefined,
    finishedAtServerMs: undefined,
  };
}

function setTrafficLightRuntimePatch(patch: Partial<TrafficLightRuntime>) {
  displayState.trafficLight = {
    ...displayState.trafficLight,
    runtime: {
      ...displayState.trafficLight.runtime,
      ...patch,
    },
  };
}

async function readTrafficLightTelemetry() {
  const requestSequence = ++trafficLightRequestSequence;
  const telemetry = await createTrafficLightClient(
    displayState.trafficLight.config,
  ).readTelemetry();

  if (requestSequence !== trafficLightRequestSequence) {
    return;
  }

  setTrafficLightRuntimePatch({
    connectionStatus: "connected",
    reportedColor: telemetry.reportedColor,
    temperatureC: telemetry.temperatureC,
    lastSeenAtServerMs: nowMs(),
    lastError: undefined,
  });
}

async function sendTrafficLightCommand(color: TrafficLightColor) {
  const requestSequence = ++trafficLightRequestSequence;
  setTrafficLightRuntimePatch({
    connectionStatus:
      displayState.trafficLight.runtime.connectionStatus === "connected"
        ? "connected"
        : "connecting",
    expectedColor: color,
    lastError: undefined,
  });

  const telemetry = await createTrafficLightClient(
    displayState.trafficLight.config,
  ).sendCommand(color);

  if (requestSequence !== trafficLightRequestSequence) {
    return;
  }

  setTrafficLightRuntimePatch({
    connectionStatus: "connected",
    reportedColor: telemetry.reportedColor,
    temperatureC: telemetry.temperatureC,
    lastSeenAtServerMs: nowMs(),
    lastError: undefined,
  });
}

function handleTrafficLightError(error: unknown) {
  setTrafficLightRuntimePatch({
    connectionStatus: "disconnected",
    lastError: error instanceof Error ? error.message : String(error),
  });
}

function shouldTrafficLightPoll() {
  return (
    displayState.trafficLight.config.autoConnect ||
    displayState.trafficLight.config.syncWithRunControl
  );
}

function clearTrafficLightPoll() {
  if (trafficLightPollTimeout !== null) {
    clearTimeout(trafficLightPollTimeout);
    trafficLightPollTimeout = null;
  }
}

function scheduleTrafficLightPoll(io: SocketIOServer, immediate = false) {
  clearTrafficLightPoll();

  if (!shouldTrafficLightPoll()) {
    return;
  }

  const delayMs = immediate
    ? 0
    : Math.max(500, displayState.trafficLight.config.pollIntervalMs);

  trafficLightPollTimeout = setTimeout(() => {
    pollTrafficLight(io).catch((error) => {
      handleTrafficLightError(error);
      broadcastDisplayState(io);
      scheduleTrafficLightPoll(io);
    });
  }, delayMs);
}

async function pollTrafficLight(io: SocketIOServer) {
  if (!shouldTrafficLightPoll()) {
    return;
  }

  await readTrafficLightTelemetry();

  const { config, runtime } = displayState.trafficLight;
  const syncColor =
    config.enabled && config.syncWithRunControl
      ? getTrafficLightColorForRunPhase(displayState.currentRun.phase)
      : undefined;

  if (!config.enabled && runtime.reportedColor !== "off") {
    await sendTrafficLightCommand("off");
  } else if (
    trafficLightSyncArmed &&
    syncColor &&
    runtime.reportedColor !== "unknown" &&
    runtime.reportedColor !== syncColor
  ) {
    await sendTrafficLightCommand(syncColor);
  }

  broadcastDisplayState(io);
  scheduleTrafficLightPoll(io);
}

function syncTrafficLightToCurrentRunPhase(io: SocketIOServer) {
  trafficLightSyncArmed = true;

  const { config } = displayState.trafficLight;

  if (!config.enabled) {
    sendTrafficLightCommand("off")
      .catch(handleTrafficLightError)
      .finally(() => {
        broadcastDisplayState(io);
        scheduleTrafficLightPoll(io, true);
      });
    return;
  }

  if (!config.syncWithRunControl) {
    return;
  }

  const nextColor = getTrafficLightColorForRunPhase(displayState.currentRun.phase);

  if (!nextColor) {
    return;
  }

  sendTrafficLightCommand(nextColor)
    .catch(handleTrafficLightError)
    .finally(() => {
      broadcastDisplayState(io);
      scheduleTrafficLightPoll(io, true);
    });
}

function replaceDashboardState(persistedState: PersistedDashboardState) {
  clearTimerFinishTimeout();
  clearTrafficLightPoll();
  trafficLightSyncArmed = false;

  displayState = {
    ...persistedState,
    timer: createStoppedTimer(persistedState.currentRun.runDurationMs),
    currentRun: {
      ...persistedState.currentRun,
      phase: "standby",
    },
    trafficLight: {
      config: persistedState.trafficLight,
      runtime: createDefaultTrafficLightRuntime(),
    },
    displayClients: [],
    displayControl,
    diagnostics: {
      serverNowMs: nowMs(),
      activeScreenId: persistedState.activeScreenId,
      timerStatus: "stopped",
      currentRunPhase: "standby",
      displayClientCount: 0,
      connectedDisplayClientCount: 0,
    },
  };
}

function broadcastDisplayState(io: SocketIOServer) {
  io.emit("display:state", getDisplayStateSnapshot());
}

function persistAndBroadcastDisplayState(io: SocketIOServer) {
  savePersistedDashboardStateDebounced(displayState);
  broadcastDisplayState(io);
}

async function persistImmediatelyAndBroadcastDisplayState(io: SocketIOServer) {
  clearPendingPersistedDashboardStateSave();
  await savePersistedDashboardState(displayState);
  broadcastDisplayState(io);
}

function readRequestBody(
  request: IncomingMessage,
  maxBytes: number,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let size = 0;

    request.on("data", (chunk: Buffer) => {
      size += chunk.length;

      if (size > maxBytes) {
        reject(new Error("Request body is too large"));
        request.destroy();
        return;
      }

      chunks.push(chunk);
    });

    request.on("end", () => {
      resolve(Buffer.concat(chunks));
    });

    request.on("error", reject);
  });
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
  setCorsHeaders(request, response);

  if (request.method === "OPTIONS") {
    response.writeHead(204);
    response.end();
    return;
  }

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

  if (request.method === "GET" && request.url === "/dashboard/export") {
    createDashboardBackupZip(
      createPersistedStateFromDisplayState(getDisplayStateSnapshot()),
    )
      .then((backup) => {
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

        response.writeHead(200, {
          "Content-Type": "application/zip",
          "Content-Disposition": `attachment; filename="caudri-dashboard-${timestamp}.zip"`,
          "Cache-Control": "no-store",
        });
        response.end(backup);
      })
      .catch((error) => {
        response.writeHead(500, { "Content-Type": "application/json" });
        response.end(
          JSON.stringify({
            error: error instanceof Error ? error.message : String(error),
          }),
        );
      });

    return;
  }

  if (request.method === "POST" && request.url === "/dashboard/import") {
    readRequestBody(request, 50 * 1024 * 1024)
      .then(restoreDashboardBackupZip)
      .then((backupState) => {
        replaceDashboardState(
          mergePersistedStateWithDefaults(
            backupState,
            defaultPersistedDashboardState,
          ),
        );

        return persistImmediatelyAndBroadcastDisplayState(io);
      })
      .then(() => {
        response.writeHead(200, { "Content-Type": "application/json" });
        response.end(JSON.stringify({ ok: true }));
      })
      .catch((error) => {
        response.writeHead(400, { "Content-Type": "application/json" });
        response.end(
          JSON.stringify({
            error: error instanceof Error ? error.message : String(error),
          }),
        );
      });

    return;
  }

  if (request.method === "POST" && request.url === "/dashboard/reset") {
    replaceDashboardState(defaultPersistedDashboardState);

    persistImmediatelyAndBroadcastDisplayState(io)
      .then(() => {
        response.writeHead(200, { "Content-Type": "application/json" });
        response.end(JSON.stringify({ ok: true }));
      })
      .catch((error) => {
        response.writeHead(500, { "Content-Type": "application/json" });
        response.end(
          JSON.stringify({
            error: error instanceof Error ? error.message : String(error),
          }),
        );
      });

    return;
  }

  if (request.method === "GET" && request.url?.startsWith("/assets/")) {
    const encodedFileName = request.url.slice("/assets/".length);
    const fileName = decodeURIComponent(encodedFileName);

    readAsset(fileName)
      .then((asset) => {
        response.writeHead(200, {
          "Content-Type": asset.mimeType,
          "Cache-Control": "public, max-age=31536000, immutable",
        });
        response.end(asset.data);
      })
      .catch(() => {
        response.writeHead(404);
        response.end();
      });

    return;
  }

  if (request.method === "POST" && request.url === "/assets") {
    readRequestBody(request, 15 * 1024 * 1024)
      .then((body) => {
        try {
          const payload = JSON.parse(
            body.toString("utf8"),
          ) as AssetUploadRequest;

          if (
            typeof payload.fileName !== "string" ||
            typeof payload.mimeType !== "string" ||
            typeof payload.dataUrl !== "string"
          ) {
            response.writeHead(400, { "Content-Type": "application/json" });
            response.end(
              JSON.stringify({ error: "Invalid asset upload payload" }),
            );
            return;
          }

          saveDataUrlAsset({
            fileName: payload.fileName,
            mimeType: payload.mimeType,
            dataUrl: payload.dataUrl,
            prefix: payload.prefix ?? "asset",
          })
            .then((savedAsset) => {
              response.writeHead(200, { "Content-Type": "application/json" });
              response.end(
                JSON.stringify({
                  assetUrl: savedAsset.assetUrl,
                  fileName: savedAsset.fileName,
                }),
              );
            })
            .catch((error) => {
              response.writeHead(400, { "Content-Type": "application/json" });
              response.end(
                JSON.stringify({
                  error:
                    error instanceof Error ? error.message : String(error),
                }),
              );
            });
        } catch {
          response.writeHead(400, { "Content-Type": "application/json" });
          response.end(JSON.stringify({ error: "Invalid JSON" }));
        }
      })
      .catch((error) => {
        response.writeHead(400, { "Content-Type": "application/json" });
        response.end(
          JSON.stringify({
            error: error instanceof Error ? error.message : String(error),
          }),
        );
      });

    return;
  }

  response.writeHead(404);
  response.end();
});

const io = new SocketIOServer(httpServer, {
  path: "/socket.io",
  cors: {
    origin: getSocketIoCorsOrigin(),
    methods: ["GET", "POST"],
  },
});

function getSocketIpAddress(socket: Socket) {
  const forwardedFor = socket.handshake.headers["x-forwarded-for"];
  const rawAddress =
    typeof forwardedFor === "string"
      ? forwardedFor.split(",")[0]?.trim()
      : socket.handshake.address;

  return rawAddress?.replace(/^::ffff:/, "");
}

async function resolveDisplayClientHostname(
  clientId: string,
  ipAddress: string | undefined,
  io: SocketIOServer,
) {
  if (!ipAddress || ipAddress.includes(":")) {
    return;
  }

  try {
    const hostnames = await reverse(ipAddress);
    const hostname = hostnames[0];
    const client = displayClients.get(clientId);

    if (!hostname || !client || client.hostname) {
      return;
    }

    displayClients.set(clientId, {
      ...client,
      hostname,
    });

    broadcastDisplayState(io);
  } catch {
    // Reverse DNS is optional on the event network.
  }
}

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

  socket.on("display-client:register", (payload: unknown) => {
    if (typeof payload !== "object" || payload === null) {
      return;
    }

    const candidate = payload as Partial<DisplayClientInfo>;
    const clientId =
      typeof candidate.id === "string" && candidate.id.trim().length > 0
        ? candidate.id
        : socket.id;
    const now = nowMs();
    const existingClient = displayClients.get(clientId);
    const ipAddress = getSocketIpAddress(socket);

    displayClients.set(clientId, {
      id: clientId,
      socketId: socket.id,
      name:
        typeof candidate.name === "string" && candidate.name.trim().length > 0
          ? candidate.name.trim()
          : existingClient?.name ?? `Display ${clientId.slice(0, 6)}`,
      status: "connected",
      ipAddress,
      hostname:
        typeof candidate.hostname === "string" &&
        candidate.hostname.trim().length > 0
          ? candidate.hostname.trim()
          : existingClient?.hostname,
      userAgent:
        typeof candidate.userAgent === "string"
          ? candidate.userAgent
          : socket.handshake.headers["user-agent"],
      activeScreenId:
        typeof candidate.activeScreenId === "string"
          ? candidate.activeScreenId
          : existingClient?.activeScreenId,
      activeScreenName:
        typeof candidate.activeScreenName === "string"
          ? candidate.activeScreenName
          : existingClient?.activeScreenName,
      activeScreenType:
        typeof candidate.activeScreenType === "string"
          ? candidate.activeScreenType
          : existingClient?.activeScreenType,
      connectedAtServerMs: existingClient?.connectedAtServerMs ?? now,
      lastSeenAtServerMs: now,
      disconnectedAtServerMs: undefined,
    });

    void resolveDisplayClientHostname(clientId, ipAddress, io);
    broadcastDisplayState(io);
  });

  socket.on("display-client:heartbeat", (payload: unknown) => {
    if (typeof payload !== "object" || payload === null) {
      return;
    }

    const candidate = payload as Partial<DisplayClientInfo>;

    if (typeof candidate.id !== "string") {
      return;
    }

    const existingClient = displayClients.get(candidate.id);

    if (!existingClient) {
      return;
    }
    const ipAddress = getSocketIpAddress(socket);

    displayClients.set(candidate.id, {
      ...existingClient,
      socketId: socket.id,
      status: "connected",
      ipAddress,
      activeScreenId:
        typeof candidate.activeScreenId === "string"
          ? candidate.activeScreenId
          : existingClient.activeScreenId,
      activeScreenName:
        typeof candidate.activeScreenName === "string"
          ? candidate.activeScreenName
          : existingClient.activeScreenName,
      activeScreenType:
        typeof candidate.activeScreenType === "string"
          ? candidate.activeScreenType
          : existingClient.activeScreenType,
      lastSeenAtServerMs: nowMs(),
      disconnectedAtServerMs: undefined,
    });

    void resolveDisplayClientHostname(candidate.id, ipAddress, io);
    broadcastDisplayState(io);
  });

  socket.on("display-control:set-main-display", (payload: unknown) => {
    if (typeof payload !== "object" || payload === null) {
      return;
    }

    const candidate = payload as { clientId?: unknown };

    displayControl = {
      ...displayControl,
      mainDisplayClientId:
        typeof candidate.clientId === "string" && candidate.clientId.length > 0
          ? candidate.clientId
          : undefined,
    };

    broadcastDisplayState(io);
  });

  socket.on("display-control:set-sync-enabled", (payload: unknown) => {
    if (typeof payload !== "object" || payload === null) {
      return;
    }

    const candidate = payload as { enabled?: unknown };

    if (typeof candidate.enabled !== "boolean") {
      return;
    }

    displayControl = {
      ...displayControl,
      syncEnabled: candidate.enabled,
    };

    broadcastDisplayState(io);
  });

  socket.on("display-runtime:pdf-page", (payload: unknown) => {
    if (typeof payload !== "object" || payload === null) {
      return;
    }

    const candidate = payload as {
      clientId?: unknown;
      screenId?: unknown;
      page?: unknown;
      pageCount?: unknown;
    };

    if (
      typeof candidate.clientId !== "string" ||
      typeof candidate.screenId !== "string" ||
      typeof candidate.page !== "number" ||
      typeof candidate.pageCount !== "number"
    ) {
      return;
    }

    if (
      displayControl.syncEnabled &&
      displayControl.mainDisplayClientId &&
      displayControl.mainDisplayClientId !== candidate.clientId
    ) {
      return;
    }

    displayControl = {
      ...displayControl,
      pdfPages: {
        ...displayControl.pdfPages,
        [candidate.screenId]: {
          page: Math.max(1, Math.round(candidate.page)),
          pageCount: Math.max(1, Math.round(candidate.pageCount)),
          updatedByClientId: candidate.clientId,
          updatedAtServerMs: nowMs(),
        },
      },
    };

    broadcastDisplayState(io);
  });

  socket.on("display-runtime:scoreboard-reveal", (payload: unknown) => {
    if (typeof payload !== "object" || payload === null) {
      return;
    }

    const candidate = payload as {
      clientId?: unknown;
      screenId?: unknown;
      revealedCount?: unknown;
      totalCount?: unknown;
    };

    if (
      typeof candidate.clientId !== "string" ||
      typeof candidate.screenId !== "string" ||
      typeof candidate.revealedCount !== "number" ||
      typeof candidate.totalCount !== "number"
    ) {
      return;
    }

    if (
      displayControl.syncEnabled &&
      displayControl.mainDisplayClientId &&
      displayControl.mainDisplayClientId !== candidate.clientId
    ) {
      return;
    }

    displayControl = {
      ...displayControl,
      scoreboardReveals: {
        ...displayControl.scoreboardReveals,
        [candidate.screenId]: {
          revealedCount: Math.min(
            Math.max(0, Math.round(candidate.revealedCount)),
            Math.max(0, Math.round(candidate.totalCount)),
          ),
          totalCount: Math.max(0, Math.round(candidate.totalCount)),
          updatedByClientId: candidate.clientId,
          updatedAtServerMs: nowMs(),
        },
      },
    };

    broadcastDisplayState(io);
  });

  socket.on("dashboard:update-state", (payload: unknown) => {
    if (typeof payload !== "object" || payload === null) {
      return;
    }

    const patch = payload as Partial<PersistedDashboardState>;
    const previousRunPhase = displayState.currentRun.phase;

    if (typeof patch.activeScreenId === "string") {
      displayState.activeScreenId = patch.activeScreenId;
    }

    if (Array.isArray(patch.screens)) {
      displayState.screens = patch.screens;
    }

    if (Array.isArray(patch.teams)) {
      displayState.teams = patch.teams;
    }

    if (typeof patch.currentRun === "object" && patch.currentRun !== null) {
      displayState.currentRun = {
        ...displayState.currentRun,
        ...patch.currentRun,
      };
    }

    if (typeof patch.autoEndRunWhenTimerFinished === "boolean") {
      displayState.autoEndRunWhenTimerFinished =
        patch.autoEndRunWhenTimerFinished;
    }

    if (typeof patch.trafficLight === "object" && patch.trafficLight !== null) {
      const previousEnabled = displayState.trafficLight.config.enabled;
      const previousSyncWithRunControl =
        displayState.trafficLight.config.syncWithRunControl;

      displayState.trafficLight = {
        ...displayState.trafficLight,
        config: {
          ...displayState.trafficLight.config,
          ...patch.trafficLight,
          transport: "http",
          host:
            typeof patch.trafficLight.host === "string"
              ? normalizeTrafficLightHost(patch.trafficLight.host)
              : displayState.trafficLight.config.host,
          pollIntervalMs:
            typeof patch.trafficLight.pollIntervalMs === "number"
              ? Math.max(500, Math.round(patch.trafficLight.pollIntervalMs))
              : displayState.trafficLight.config.pollIntervalMs,
        },
      };

      if (
        previousEnabled &&
        displayState.trafficLight.config.enabled === false
      ) {
        syncTrafficLightToCurrentRunPhase(io);
      }

      if (
        !previousSyncWithRunControl &&
        displayState.trafficLight.config.syncWithRunControl
      ) {
        syncTrafficLightToCurrentRunPhase(io);
      }

      scheduleTrafficLightPoll(io, true);
    }

    persistAndBroadcastDisplayState(io);

    if (
      patch.currentRun?.phase !== undefined &&
      previousRunPhase !== displayState.currentRun.phase
    ) {
      syncTrafficLightToCurrentRunPhase(io);
    }

    console.log("[dashboard] state patch applied");
  });

  // socket.on("display:set-state", (payload: unknown) => {
  //   if (typeof payload !== "object" || payload === null) {
  //     return;
  //   }

  //   const candidate = payload as Partial<DisplayState>;

  //   if (
  //     typeof candidate.activeScreenId !== "string" ||
  //     !Array.isArray(candidate.screens) ||
  //     !Array.isArray(candidate.teams) ||
  //     typeof candidate.currentRun !== "object" ||
  //     candidate.currentRun === null
  //   ) {
  //     return;
  //   }

  //   displayState.activeScreenId = candidate.activeScreenId;
  //   displayState.screens = candidate.screens;
  //   displayState.teams = candidate.teams;
  //   displayState.currentRun = candidate.currentRun;

  //   if (typeof candidate.autoEndRunWhenTimerFinished === "boolean") {
  //     displayState.autoEndRunWhenTimerFinished =
  //       candidate.autoEndRunWhenTimerFinished;
  //   }

  //   broadcastDisplayState(io);

  //   console.log(
  //     `[display] state updated: activeScreenId=${displayState.activeScreenId}, screens=${displayState.screens.length}, teams=${displayState.teams.length}, phase=${displayState.currentRun.phase}`,
  //   );
  // });

  socket.on("display:set-active-screen", (payload: { screenId?: unknown }) => {
    if (typeof payload.screenId !== "string") {
      return;
    }

    displayState.activeScreenId = payload.screenId;

    persistAndBroadcastDisplayState(io);

    console.log(
      `[display] active screen changed: ${displayState.activeScreenId}`,
    );
  });

  socket.on(
    "traffic-light:command",
    (payload: { color?: unknown; force?: unknown }) => {
      const color = payload.color;

      if (
        color !== "red" &&
        color !== "yellow" &&
        color !== "green" &&
        color !== "off"
      ) {
        return;
      }

      if (
        displayState.trafficLight.config.syncWithRunControl &&
        payload.force !== true
      ) {
        return;
      }

      sendTrafficLightCommand(color)
        .catch(handleTrafficLightError)
        .finally(() => {
          broadcastDisplayState(io);
          scheduleTrafficLightPoll(io, true);
        });
    },
  );

  socket.on("traffic-light:connect", () => {
    setTrafficLightRuntimePatch({
      connectionStatus: "connecting",
      lastError: undefined,
    });

    readTrafficLightTelemetry()
      .catch(handleTrafficLightError)
      .finally(() => {
        broadcastDisplayState(io);
        scheduleTrafficLightPoll(io, true);
      });
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
    const disconnectedAtServerMs = nowMs();

    for (const [clientId, client] of displayClients.entries()) {
      if (client.socketId === socket.id) {
        displayClients.set(clientId, {
          ...client,
          status: "disconnected",
          disconnectedAtServerMs,
          lastSeenAtServerMs: disconnectedAtServerMs,
        });
      }
    }

    broadcastDisplayState(io);
    console.log(`[socket] client disconnected: ${socket.id}`);
  });
});

setInterval(() => {
  finishTimerIfExpired(io);
}, 50);

async function startServer() {
  const persistedDashboardState = await loadPersistedDashboardState(
    defaultPersistedDashboardState,
  );

  const startupNow = nowMs();

  displayState = {
    ...persistedDashboardState,

    // Timer is intentionally reset on realtime-server restart.
    timer: {
      ...createStoppedTimer(persistedDashboardState.currentRun.runDurationMs),
      updatedAtServerMs: startupNow,
    },

    currentRun: {
      ...persistedDashboardState.currentRun,
      phase: "standby",
    },
    trafficLight: {
      config: persistedDashboardState.trafficLight,
      runtime: createDefaultTrafficLightRuntime(),
    },
    displayClients: [],
    displayControl,
    diagnostics: {
      serverNowMs: startupNow,
      activeScreenId: persistedDashboardState.activeScreenId,
      timerStatus: "stopped",
      currentRunPhase: "standby",
      displayClientCount: 0,
      connectedDisplayClientCount: 0,
    },
  };

  httpServer.listen(port, "0.0.0.0", () => {
    console.log("> CAuDri-Challenge realtime server ready");
    console.log(`> http://0.0.0.0:${port}`);
    console.log(`> allowed origins: ${allowedOrigins.join(", ")}`);
    console.log(
      "[env] REALTIME_CORS_ORIGIN =",
      process.env.REALTIME_CORS_ORIGIN,
    );
    console.log("[env] allowedOrigins =", allowedOrigins);
  });

  scheduleTrafficLightPoll(io, true);
}

startServer().catch((error) => {
  console.error("[server] failed to start realtime server", error);
  process.exit(1);
});
