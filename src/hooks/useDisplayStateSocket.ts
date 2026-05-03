"use client";

import { useEffect, useState } from "react";
import { getSocketClient } from "@/lib/realtime/socketClient";
import type { DisplayState } from "@/types/display";

const initialDisplayState: DisplayState = {
  activeScreenId: "fallback",
};

export function useDisplayStateSocket() {
  const [displayState, setDisplayState] =
    useState<DisplayState>(initialDisplayState);

  useEffect(() => {
    const socket = getSocketClient();

    function handleDisplayState(state: DisplayState) {
      setDisplayState(state);
    }

    function handleActiveScreenChanged(payload: { activeScreenId: string }) {
      setDisplayState((currentState) => ({
        ...currentState,
        activeScreenId: payload.activeScreenId,
      }));
    }

    socket.on("display:state", handleDisplayState);
    socket.on("display:active-screen-changed", handleActiveScreenChanged);

    socket.emit("display:request-state");

    return () => {
      socket.off("display:state", handleDisplayState);
      socket.off("display:active-screen-changed", handleActiveScreenChanged);
    };
  }, []);

  function setActiveScreen(screenId: string) {
    const socket = getSocketClient();

    socket.emit("display:set-active-screen", {
      screenId,
    });

    setDisplayState((currentState) => ({
      ...currentState,
      activeScreenId: screenId,
    }));
  }

  return {
    displayState,
    setActiveScreen,
  };
}
