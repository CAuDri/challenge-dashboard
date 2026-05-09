"use client";

import { CameraDisplayScreen } from "@/components/display/CameraDisplayScreen";
import { PdfDisplayScreen } from "@/components/display/PdfDisplayScreen";
import { ScoreboardDisplayScreen } from "@/components/display/ScoreboardDisplayScreen";
import { TimerDisplayScreen } from "@/components/display/TimerDisplayScreen";
import type { CurrentRunState } from "@/types/run";
import type { ScreenDefinition } from "@/types/screen";
import type { Team } from "@/types/team";
import type { CountdownTimerState } from "@/types/timer";
import type { DisplayControlState } from "@/types/display-client";

type DisplayScreenRendererProps = {
  screen: ScreenDefinition;
  teams: Team[];
  currentRun: CurrentRunState;
  timer: CountdownTimerState;
  displayClientId?: string;
  displayControl: DisplayControlState;
  onPdfPageChange: (payload: {
    clientId: string;
    screenId: string;
    page: number;
    pageCount: number;
  }) => void;
  onScoreboardRevealChange: (payload: {
    clientId: string;
    screenId: string;
    revealedCount: number;
    totalCount: number;
  }) => void;
};

function ImageDisplayScreen({ screen }: { screen: ScreenDefinition }) {
  const imageUrl = screen.config?.image?.imageUrl;

  if (screen.id === "fallback" && !imageUrl) {
    return <FallbackDisplayScreen />;
  }

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

function FallbackDisplayScreen() {
  return (
    <main className="relative flex h-full w-full flex-col items-center justify-center gap-[clamp(2rem,5vh,4rem)] overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950 px-[clamp(2rem,4vw,4rem)] py-[clamp(2rem,3vw,3rem)] text-center text-white">
      <div className="flex h-[clamp(13rem,24vw,28rem)] w-[clamp(13rem,24vw,28rem)] items-center justify-center rounded-[2rem] border border-cyan-300/20 bg-slate-950/40 p-[clamp(2rem,4vw,4.5rem)] shadow-[0_0_90px_rgba(34,211,238,0.16)]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/caudri_logo.svg"
          alt="CAuDri-Challenge"
          className="h-full w-full object-contain drop-shadow-[0_0_32px_rgba(34,211,238,0.22)]"
        />
      </div>

      <h1 className="font-[family-name:var(--font-rajdhani)] text-[clamp(4rem,7vw,8rem)] font-bold leading-none text-slate-50">
        CAUDRI-CHALLENGE 2026
      </h1>
    </main>
  );
}

export function DisplayScreenRenderer({
  screen,
  teams,
  currentRun,
  timer,
  displayClientId,
  displayControl,
  onPdfPageChange,
  onScoreboardRevealChange,
}: DisplayScreenRendererProps) {
  switch (screen.type) {
    case "image":
      return <ImageDisplayScreen screen={screen} />;

    case "scoreboard":
      return (
        <ScoreboardDisplayScreen
          screen={screen}
          teams={teams}
          displayClientId={displayClientId}
          displayControl={displayControl}
          onRevealChange={onScoreboardRevealChange}
        />
      );

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
      return (
        <PdfDisplayScreen
          screen={screen}
          displayClientId={displayClientId}
          displayControl={displayControl}
          onPageChange={onPdfPageChange}
        />
      );

    case "camera":
      return <CameraDisplayScreen screen={screen} />;
  }
}
