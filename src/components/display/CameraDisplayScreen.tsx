"use client";

import { CameraStreamView } from "@/components/camera/CameraStreamView";
import type { ScreenDefinition } from "@/types/screen";

type CameraDisplayScreenProps = {
  screen: ScreenDefinition;
};

function getSourceTypeLabel(screen: ScreenDefinition) {
  const sourceType = screen.config?.camera?.sourceType ?? "mjpeg";

  return sourceType === "hls"
    ? "HLS"
    : sourceType === "whep"
      ? "WHEP"
      : "MJPEG";
}

export function CameraDisplayScreen({ screen }: CameraDisplayScreenProps) {
  const sourceType = screen.config?.camera?.sourceType ?? "mjpeg";
  const sourceUrl = screen.config?.camera?.sourceUrl;

  if (!sourceUrl) {
    return (
      <main className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950 text-white">
        <section className="text-center">
          <p className="font-[family-name:var(--font-rajdhani)] text-2xl font-semibold uppercase tracking-[0.5em] text-cyan-300">
            CAuDri-Challenge
          </p>
          <h1 className="mt-10 font-[family-name:var(--font-rajdhani)] text-7xl font-bold tracking-tight">
            {screen.name}
          </h1>
          <p className="mx-auto mt-8 max-w-3xl text-xl leading-8 text-slate-300">
            Configure a camera source URL to use this screen on the display.
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="flex h-full w-full flex-col bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950 text-white">
      <div className="min-h-0 flex-1 p-[clamp(0.75rem,1.8vw,1.5rem)]">
        <CameraStreamView
          sourceType={sourceType}
          sourceUrl={sourceUrl}
          className="h-full w-full rounded-2xl bg-black"
          mediaClassName="bg-black"
          loadingLabel="Loading camera..."
          errorLabel="Failed to load camera stream"
        />
      </div>

      <footer className="flex h-10 shrink-0 items-center justify-between border-t border-white/10 px-4 text-xs text-slate-300">
        <span className="truncate">{screen.name}</span>
        <span className="font-mono text-slate-400">
          {getSourceTypeLabel(screen)}
        </span>
      </footer>
    </main>
  );
}
