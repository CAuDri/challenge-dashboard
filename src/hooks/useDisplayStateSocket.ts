"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { demoScreens } from "@/config/demoScreens";
import { getSocketClient } from "@/lib/realtime/socketClient";
import type { DisplayState } from "@/types/display";

type AdminDisplayStatePayload = Pick<
  DisplayState,
  | "activeScreenId"
  | "screens"
  | "teams"
  | "currentRun"
  | "autoEndRunWhenTimerFinished"
>;

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
};

export function useDisplayStateSocket() {
  const [displayState, setDisplayState] =
    useState<DisplayState>(initialDisplayState);

  const [estimatedOneWayLatencyMs, setEstimatedOneWayLatencyMs] = useState(0);
  const latencyInitializedRef = useRef(false);

  useEffect(() => {
    const socket = getSocketClient();

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
      window.clearInterval(intervalId);
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

  return {
    displayState,
    publishDisplayState,
    setActiveScreen,
    timerCommands,
    estimatedOneWayLatencyMs,
  };
}
