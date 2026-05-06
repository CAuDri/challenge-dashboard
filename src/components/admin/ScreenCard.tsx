"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScreenThumbnail } from "@/components/admin/ScreenThumbnail";
import type { CurrentRunState } from "@/types/run";
import type { ScreenDefinition } from "@/types/screen";
import type { Team } from "@/types/team";
import type { CountdownTimerState } from "@/types/timer";
import { Eye, PencilLine, Trash2 } from "lucide-react";

type ScreenCardProps = {
  screen: ScreenDefinition;
  active: boolean;
  builtIn: boolean;
  teams: Team[];
  currentRun: CurrentRunState;
  timer: CountdownTimerState;
  onActivate: (screenId: string) => void;
  onEdit: (screen: ScreenDefinition) => void;
  onDelete: (screenId: string) => void;
};

export function ScreenCard({
  screen,
  active,
  builtIn,
  teams,
  currentRun,
  timer,
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
            className="w-52 border-slate-800 bg-slate-950 p-2 text-slate-100"
          >
            <DropdownMenuLabel className="font-[family-name:var(--font-rajdhani)] text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
              Screen Actions
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-slate-800" />

            <DropdownMenuItem
              onClick={() => onActivate(screen.id)}
              className="cursor-pointer gap-2 focus:bg-slate-800 focus:text-cyan-100"
            >
              <Eye className="size-4 text-cyan-300" />
              Activate Screen
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={() => onEdit(screen)}
              className="cursor-pointer gap-2 focus:bg-slate-800 focus:text-cyan-100"
            >
              <PencilLine className="size-4 text-cyan-300" />
              Edit Screen
            </DropdownMenuItem>

            <DropdownMenuSeparator className="bg-slate-800" />

            <DropdownMenuItem
              onClick={handleDelete}
              disabled={screen.id === "fallback"}
              className="cursor-pointer gap-2 text-rose-300 focus:bg-rose-950 focus:text-rose-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Trash2 className="size-4" />
              {screen.id === "fallback" ? "Fallback Locked" : "Delete Screen"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="relative flex aspect-video items-center justify-center overflow-hidden bg-gradient-to-br from-slate-800 to-slate-950">
        <ScreenThumbnail
          screen={screen}
          teams={teams}
          currentRun={currentRun}
          timer={timer}
        />

        <span className="absolute left-4 top-4 rounded-full border border-slate-700 bg-slate-950/85 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">
          {screen.type}
        </span>
      </div>

      <div className="space-y-3 p-5">
        <div className="flex items-start justify-between gap-3 pr-10">
          <div>
            <h3 className="font-[family-name:var(--font-rajdhani)] text-2xl font-bold text-slate-50">
              {screen.name}
            </h3>

            <div className="mt-2 flex flex-wrap items-center gap-2">
              {builtIn && (
                <span className="rounded-full border border-slate-700 bg-slate-900 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Built-in
                </span>
              )}

              {screen.id === "fallback" && (
                <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-amber-200">
                  Fallback
                </span>
              )}
            </div>
          </div>

          {active && (
            <span className="rounded-full border border-cyan-400/50 bg-cyan-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200">
              Active
            </span>
          )}
        </div>

        {screen.description.trim().length > 0 && (
          <p className="text-sm leading-6 text-slate-400">
            {screen.description}
          </p>
        )}
      </div>
    </article>
  );
}
