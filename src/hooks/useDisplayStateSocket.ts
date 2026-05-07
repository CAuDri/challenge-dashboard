"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { demoScreens } from "@/config/demoScreens";
import { getSocketClient } from "@/lib/realtime/socketClient";
import type { DisplayState } from "@/types/display";
import type { PersistedDashboardState } from "@/types/persistence";
import type {
  TrafficLightColor,
  TrafficLightConfigPatch,
} from "@/types/traffic-light";

type AdminDisplayStatePayload = Pick<
  DisplayState,
  | "activeScreenId"
  | "screens"
  | "teams"
  | "currentRun"
  | "autoEndRunWhenTimerFinished"
>;

export type RealtimeConnectionStatus =
  | "connected"
  | "reconnecting"
  | "disconnected";

const initialDisplayState: DisplayState = {
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
    updatedAtServerMs: undefined,
    targetEndTimeServerMs: undefined,
    startedAtServerMs: undefined,
    pausedAtServerMs: undefined,
    finishedAtServerMs: undefined,
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

export function useDisplayStateSocket() {
  const [displayState, setDisplayState] =
    useState<DisplayState>(initialDisplayState);

  const [connectionStatus, setConnectionStatus] =
    useState<RealtimeConnectionStatus>("reconnecting");

  const [estimatedOneWayLatencyMs, setEstimatedOneWayLatencyMs] = useState(0);
  const latencyInitializedRef = useRef(false);

  useEffect(() => {
    const socket = getSocketClient();
    let isMounted = true;

    queueMicrotask(() => {
      if (isMounted) {
        setConnectionStatus(socket.connected ? "connected" : "reconnecting");
      }
    });

    function handleConnect() {
      setConnectionStatus("connected");
    }

    function handleDisconnect() {
      setConnectionStatus("reconnecting");
    }

    function handleConnectError() {
      setConnectionStatus("disconnected");
    }

    function handleReconnectAttempt() {
      setConnectionStatus("reconnecting");
    }

    function handleReconnectFailed() {
      setConnectionStatus("disconnected");
    }

    function handleDisplayState(state: DisplayState) {
      setDisplayState(state);
    }

    function handleTimeSyncResponse(payload: { clientSentAt: number }) {
      const clientReceivedAt = performance.now();
      const roundTripMs = clientReceivedAt - payload.clientSentAt;

      if (roundTripMs < 0 || roundTripMs > 250) {
        return;
      }

      const nextOneWayLatencyMs = roundTripMs / 2;

      setEstimatedOneWayLatencyMs((currentLatencyMs) => {
        if (!latencyInitializedRef.current) {
          latencyInitializedRef.current = true;
          return nextOneWayLatencyMs;
        }

        const deltaMs = nextOneWayLatencyMs - currentLatencyMs;

        if (Math.abs(deltaMs) > 80) {
          return nextOneWayLatencyMs;
        }

        return currentLatencyMs + deltaMs * 0.1;
      });
    }

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("connect_error", handleConnectError);
    socket.io.on("reconnect_attempt", handleReconnectAttempt);
    socket.io.on("reconnect_failed", handleReconnectFailed);
    socket.on("display:state", handleDisplayState);
    socket.on("time:sync-response", handleTimeSyncResponse);

    socket.emit("display:request-state");

    function requestTimeSync() {
      socket.emit("time:sync-request", {
        clientSentAt: performance.now(),
      });
    }

    requestTimeSync();
    const intervalId = window.setInterval(requestTimeSync, 2_000);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("connect_error", handleConnectError);
      socket.io.off("reconnect_attempt", handleReconnectAttempt);
      socket.io.off("reconnect_failed", handleReconnectFailed);
      socket.off("display:state", handleDisplayState);
      socket.off("time:sync-response", handleTimeSyncResponse);
    };
  }, []);

  const publishDisplayState = useCallback(
    (nextDisplayState: AdminDisplayStatePayload) => {
      const socket = getSocketClient();

      socket.emit("display:set-state", nextDisplayState);

      setDisplayState((currentState) => ({
        ...currentState,
        ...nextDisplayState,
      }));
    },
    [],
  );

  const setActiveScreen = useCallback((screenId: string) => {
    const socket = getSocketClient();

    socket.emit("display:set-active-screen", {
      screenId,
    });

    setDisplayState((currentState) => ({
      ...currentState,
      activeScreenId: screenId,
    }));
  }, []);

  const timerCommands = useMemo(
    () => ({
      setDurationMs(durationMs: number) {
        getSocketClient().emit("timer:set-duration", { durationMs });
      },

      start() {
        getSocketClient().emit("timer:start");
      },

      pause() {
        getSocketClient().emit("timer:pause");
      },

      reset() {
        getSocketClient().emit("timer:reset");
      },

      finish() {
        getSocketClient().emit("timer:finish-now");
      },
    }),
    [],
  );

  const updateDashboardState = useCallback(
    (patch: Partial<PersistedDashboardState>) => {
      const socket = getSocketClient();

      socket.emit("dashboard:update-state", patch);

      setDisplayState((currentState) => ({
        ...currentState,
        ...patch,
        currentRun: patch.currentRun
          ? {
              ...currentState.currentRun,
              ...patch.currentRun,
            }
          : currentState.currentRun,
        trafficLight: patch.trafficLight
          ? {
              ...currentState.trafficLight,
              config: {
                ...currentState.trafficLight.config,
                ...patch.trafficLight,
              },
            }
          : currentState.trafficLight,
      }));
    },
    [],
  );

  const updateTrafficLightConfig = useCallback(
    (patch: TrafficLightConfigPatch) => {
      updateDashboardState({
        trafficLight: {
          ...displayState.trafficLight.config,
          ...patch,
        },
      });
    },
    [displayState.trafficLight.config, updateDashboardState],
  );

  const connectTrafficLight = useCallback(() => {
    getSocketClient().emit("traffic-light:connect");

    setDisplayState((currentState) => ({
      ...currentState,
      trafficLight: {
        ...currentState.trafficLight,
        runtime: {
          ...currentState.trafficLight.runtime,
          connectionStatus: "connecting",
          lastError: undefined,
        },
      },
    }));
  }, []);

  const commandTrafficLight = useCallback((color: TrafficLightColor) => {
    getSocketClient().emit("traffic-light:command", { color });

    setDisplayState((currentState) => ({
      ...currentState,
      trafficLight: {
        ...currentState.trafficLight,
        runtime: {
          ...currentState.trafficLight.runtime,
          expectedColor: color,
          lastError: undefined,
        },
      },
    }));
  }, []);

  return {
    displayState,
    connectionStatus,
    publishDisplayState,
    updateDashboardState,
    setActiveScreen,
    timerCommands,
    estimatedOneWayLatencyMs,
    updateTrafficLightConfig,
    connectTrafficLight,
    commandTrafficLight,
  };
}
