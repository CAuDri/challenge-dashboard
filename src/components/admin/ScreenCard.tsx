"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ScreenDefinition } from "@/types/screen";

type ScreenCardProps = {
  screen: ScreenDefinition;
  active: boolean;
  onActivate: (screenId: string) => void;
  onEdit: (screen: ScreenDefinition) => void;
  onDelete: (screenId: string) => void;
};

export function ScreenCard({
  screen,
  active,
  onActivate,
  onEdit,
  onDelete,
}: ScreenCardProps) {
  function handleDelete() {
    if (screen.id === "fallback") {
      window.alert("The fallback screen cannot be deleted.");
      return;
    }

    const confirmed = window.confirm(`Delete screen "${screen.name}"?`);

    if (!confirmed) {
      return;
    }

    onDelete(screen.id);
  }

  return (
    <article
      onDoubleClick={() => onActivate(screen.id)}
      className={`group relative overflow-hidden rounded-3xl border bg-slate-950 shadow-lg transition ${
        active
          ? "border-cyan-400 shadow-cyan-950/40"
          : "border-slate-800 hover:border-cyan-400/50"
      }`}
    >
      <div className="absolute right-4 top-4 z-10">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-800 bg-slate-900/90 text-xl font-bold text-slate-300 transition hover:border-cyan-400/50 hover:text-cyan-100"
              aria-label={`Open actions for ${screen.name}`}
            >
              ⋯
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="end"
            className="border-slate-800 bg-slate-950 text-slate-100"
          >
            <DropdownMenuItem
              onClick={() => onActivate(screen.id)}
              className="cursor-pointer focus:bg-slate-800 focus:text-cyan-100"
            >
              Activate Screen
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={() => onEdit(screen)}
              className="cursor-pointer focus:bg-slate-800 focus:text-cyan-100"
            >
              Edit Screen
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={handleDelete}
              disabled={screen.id === "fallback"}
              className="cursor-pointer text-rose-300 focus:bg-rose-950 focus:text-rose-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Delete Screen
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex aspect-video items-center justify-center bg-gradient-to-br from-slate-800 to-slate-950">
        <span className="rounded-xl border border-cyan-400/40 bg-cyan-400/10 px-5 py-3 font-[family-name:var(--font-rajdhani)] text-2xl font-bold uppercase tracking-wide text-cyan-200">
          {screen.thumbnailLabel}
        </span>
      </div>

      <div className="space-y-3 p-5">
        <div className="flex items-start justify-between gap-3 pr-10">
          <div>
            <h3 className="font-[family-name:var(--font-rajdhani)] text-2xl font-bold text-slate-50">
              {screen.name}
            </h3>

            <p className="mt-1 text-sm uppercase tracking-[0.2em] text-slate-500">
              {screen.type}
            </p>
          </div>

          {active && (
            <span className="rounded-full border border-cyan-400/50 bg-cyan-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200">
              Active
            </span>
          )}
        </div>

        <p className="text-sm leading-6 text-slate-400">{screen.description}</p>

        <p className="text-xs uppercase tracking-[0.25em] text-slate-600">
          Double-click to activate
        </p>
      </div>
    </article>
  );
}
