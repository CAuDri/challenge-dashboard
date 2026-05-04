"use client";

import { useCallback, useEffect, useState } from "react";
import { demoScreens } from "@/config/demoScreens";
import { getSocketClient } from "@/lib/realtime/socketClient";
import type { DisplayState } from "@/types/display";

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
  },
};

export function useDisplayStateSocket() {
  const [displayState, setDisplayState] =
    useState<DisplayState>(initialDisplayState);

  useEffect(() => {
    const socket = getSocketClient();

    function handleDisplayState(state: DisplayState) {
      setDisplayState(state);
    }

    socket.on("display:state", handleDisplayState);

    socket.emit("display:request-state");

    return () => {
      socket.off("display:state", handleDisplayState);
    };
  }, []);

  const publishDisplayState = useCallback((nextDisplayState: DisplayState) => {
    const socket = getSocketClient();

    socket.emit("display:set-state", nextDisplayState);
    setDisplayState(nextDisplayState);
  }, []);

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

  return {
    displayState,
    publishDisplayState,
    setActiveScreen,
  };
}
