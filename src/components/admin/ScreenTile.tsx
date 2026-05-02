import type { ScreenDefinition } from "@/types/screen";

type ScreenTileProps = {
  screen: ScreenDefinition;
};

export function ScreenTile({ screen }: ScreenTileProps) {
  return (
    <button
      type="button"
      className="group overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 text-left shadow-lg transition hover:-translate-y-1 hover:border-cyan-400 hover:shadow-cyan-950/40"
    >
      <div className="flex aspect-video items-center justify-center bg-gradient-to-br from-slate-800 to-slate-950">
        <span className="rounded-xl border border-cyan-400/40 bg-cyan-400/10 px-4 py-2 text-lg font-semibold text-cyan-200">
          {screen.thumbnailLabel}
        </span>
      </div>

      <div className="space-y-2 p-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-semibold text-slate-50">{screen.name}</h2>

          <span className="rounded-full bg-slate-800 px-2 py-1 text-xs text-slate-300">
            {screen.type}
          </span>
        </div>

        <p className="text-sm leading-6 text-slate-400">{screen.description}</p>
      </div>
    </button>
  );
}
