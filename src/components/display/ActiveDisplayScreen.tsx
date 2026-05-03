"use client";

import { demoScreens } from "@/config/demoScreens";
import { useDisplayStateSocket } from "@/hooks/useDisplayStateSocket";

function getScreenLabel(screenId: string) {
  const screen = demoScreens.find((candidate) => candidate.id === screenId);

  if (!screen) {
    return {
      name: "Unknown Screen",
      type: "unknown",
      description: `No local placeholder exists for screen "${screenId}".`,
      thumbnailLabel: "Unknown",
    };
  }

  return screen;
}

export function ActiveDisplayScreen() {
  const { displayState } = useDisplayStateSocket();

  const screen = getScreenLabel(displayState.activeScreenId);

  return (
    <main className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950 text-white">
      <section className="text-center">
        <p className="font-[family-name:var(--font-rajdhani)] text-2xl font-semibold uppercase tracking-[0.5em] text-cyan-300">
          CAuDri-Challenge
        </p>

        <div className="mt-10 inline-flex rounded-3xl border border-cyan-400/30 bg-cyan-400/10 px-10 py-6">
          <span className="font-[family-name:var(--font-rajdhani)] text-7xl font-bold uppercase tracking-wide text-cyan-100">
            {screen.thumbnailLabel}
          </span>
        </div>

        <h1 className="mt-10 font-[family-name:var(--font-rajdhani)] text-7xl font-bold tracking-tight">
          {screen.name}
        </h1>

        <p className="mt-4 text-2xl uppercase tracking-[0.35em] text-slate-400">
          {screen.type}
        </p>

        <p className="mx-auto mt-8 max-w-3xl text-xl leading-8 text-slate-300">
          {screen.description}
        </p>
      </section>
    </main>
  );
}
