"use client";

import { DisplayScreenRenderer } from "@/components/display/DisplayScreenRenderer";
import { useDisplayStateSocket } from "@/hooks/useDisplayStateSocket";

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
  const { displayState } = useDisplayStateSocket();

  const activeScreen = getActiveScreen(
    displayState.activeScreenId,
    displayState.screens,
  );

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
    <DisplayScreenRenderer
      screen={activeScreen}
      teams={displayState.teams}
      currentRun={displayState.currentRun}
      timer={displayState.timer}
    />
  );
}
