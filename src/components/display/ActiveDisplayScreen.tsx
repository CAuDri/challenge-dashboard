"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo } from "react";
import { DisplayScreenRenderer } from "@/components/display/DisplayScreenRenderer";
import { useDisplayStateSocket } from "@/hooks/useDisplayStateSocket";
import { useServerCountdownTimer } from "@/hooks/useServerCountdownTimer";

function getActiveScreen(
  activeScreenId: string,
  screens: ReturnType<typeof useDisplayStateSocket>["displayState"]["screens"],
) {
  return (
    screens.find((screen) => screen.id === activeScreenId) ??
    screens.find((screen) => screen.id === "fallback") ??
    screens[0]
  );
}

export function ActiveDisplayScreen() {
  const {
    displayState,
    displayClientId,
    estimatedOneWayLatencyMs,
    registerDisplayClient,
    heartbeatDisplayClient,
    publishPdfPage,
    publishScoreboardReveal,
  } = useDisplayStateSocket();

  const noopTimerCommands = useMemo(
    () => ({
      setDurationMs() {},
      start() {},
      pause() {},
      reset() {},
      finish() {},
    }),
    [],
  );

  const derivedTimer = useServerCountdownTimer(
    displayState.timer,
    noopTimerCommands,
    estimatedOneWayLatencyMs,
  );

  const activeScreen = getActiveScreen(
    displayState.activeScreenId,
    displayState.screens,
  );

  useEffect(() => {
    if (!displayClientId || !activeScreen) {
      return;
    }

    const displayClient = {
      id: displayClientId,
      name: window.localStorage.getItem("caudri-display-name") ?? "Display",
      userAgent: window.navigator.userAgent,
      activeScreenId: activeScreen.id,
      activeScreenName: activeScreen.name,
      activeScreenType: activeScreen.type,
    };

    registerDisplayClient(displayClient);
  }, [activeScreen, displayClientId, registerDisplayClient]);

  useEffect(() => {
    if (!displayClientId || !activeScreen) {
      return;
    }

    const heartbeat = () => {
      heartbeatDisplayClient({
        id: displayClientId,
        activeScreenId: activeScreen.id,
        activeScreenName: activeScreen.name,
        activeScreenType: activeScreen.type,
      });
    };

    heartbeat();
    const intervalId = window.setInterval(heartbeat, 2_500);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [activeScreen, displayClientId, heartbeatDisplayClient]);

  if (!activeScreen) {
    return (
      <main className="flex h-full w-full items-center justify-center bg-black text-white">
        <p className="font-[family-name:var(--font-rajdhani)] text-5xl font-bold">
          No display screen available
        </p>
      </main>
    );
  }

  return (
    <div className="relative h-full w-full overflow-hidden bg-black">
      <AnimatePresence initial={false} mode="sync">
        <motion.div
          key={activeScreen.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22, ease: "easeInOut" }}
          className="absolute inset-0"
        >
          <DisplayScreenRenderer
            screen={activeScreen}
            teams={displayState.teams}
            currentRun={displayState.currentRun}
            timer={derivedTimer.timer}
            displayClientId={displayClientId}
            displayControl={displayState.displayControl}
            onPdfPageChange={publishPdfPage}
            onScoreboardRevealChange={publishScoreboardReveal}
          />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
