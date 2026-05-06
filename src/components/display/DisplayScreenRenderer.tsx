"use client";

import { ScoreboardDisplayScreen } from "@/components/display/ScoreboardDisplayScreen";
import { TimerDisplayScreen } from "@/components/display/TimerDisplayScreen";
import type { CurrentRunState } from "@/types/run";
import type { ScreenDefinition } from "@/types/screen";
import type { Team } from "@/types/team";
import type { CountdownTimerState } from "@/types/timer";

type DisplayScreenRendererProps = {
  screen: ScreenDefinition;
  teams: Team[];
  currentRun: CurrentRunState;
  timer: CountdownTimerState;
};

function ImageDisplayScreen({ screen }: { screen: ScreenDefinition }) {
  const imageUrl = screen.config?.image?.imageUrl;

  if (imageUrl) {
    return (
      <main className="flex h-full w-full items-center justify-center bg-black">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt={screen.name}
          className="h-full w-full object-contain"
        />
      </main>
    );
  }

  return (
    <main className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950 text-white">
      <section className="text-center">
        <p className="font-[family-name:var(--font-rajdhani)] text-3xl font-semibold uppercase tracking-[0.5em] text-cyan-300">
          CAuDri-Challenge
        </p>

        <h1 className="mt-10 font-[family-name:var(--font-rajdhani)] text-8xl font-bold leading-none tracking-tight text-slate-50">
          {screen.name}
        </h1>

        <p className="mx-auto mt-8 max-w-4xl text-2xl leading-10 text-slate-300">
          {screen.description}
        </p>
      </section>
    </main>
  );
}

function PlaceholderDisplayScreen({ screen }: { screen: ScreenDefinition }) {
  return (
    <main className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950 text-white">
      <section className="text-center">
        <p className="font-[family-name:var(--font-rajdhani)] text-2xl font-semibold uppercase tracking-[0.5em] text-cyan-300">
          CAuDri-Challenge
        </p>

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

export function DisplayScreenRenderer({
  screen,
  teams,
  currentRun,
  timer,
}: DisplayScreenRendererProps) {
  switch (screen.type) {
    case "image":
      return <ImageDisplayScreen screen={screen} />;

    case "scoreboard":
      return <ScoreboardDisplayScreen screen={screen} teams={teams} />;

    case "timer":
      return (
        <TimerDisplayScreen
          screen={screen}
          timer={timer}
          currentRun={currentRun}
          teams={teams}
        />
      );

    case "pdf":
    case "camera":
      return <PlaceholderDisplayScreen screen={screen} />;
  }
}
