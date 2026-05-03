"use client";

import type { ScreenDefinition } from "@/types/screen";

type DisplayScreenRendererProps = {
  screen: ScreenDefinition;
};

function ImageDisplayScreen({ screen }: DisplayScreenRendererProps) {
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

function PlaceholderDisplayScreen({ screen }: DisplayScreenRendererProps) {
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

export function DisplayScreenRenderer({ screen }: DisplayScreenRendererProps) {
  switch (screen.type) {
    case "image":
      return <ImageDisplayScreen screen={screen} />;

    case "pdf":
    case "camera":
    case "timer":
    case "scoreboard":
      return <PlaceholderDisplayScreen screen={screen} />;
  }
}
