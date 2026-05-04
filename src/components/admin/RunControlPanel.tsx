"use client";

import { motion } from "framer-motion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAdminState } from "@/providers/AdminStateProvider";
import { runPhaseLabels, type RunPhase } from "@/types/run";
import { disciplines, type DisciplineId, type Team } from "@/types/team";

function formatDuration(durationMs: number) {
  const totalSeconds = Math.floor(durationMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return {
    minutes,
    seconds,
  };
}

function getLogoFallback(teamName: string) {
  return teamName.slice(0, 2).toUpperCase();
}

type TeamLogoProps = {
  team: Team;
  size?: "sm" | "md";
};

function TeamLogo({ team, size = "md" }: TeamLogoProps) {
  const sizeClassName =
    size === "sm" ? "h-9 w-9 rounded-xl" : "h-16 w-16 rounded-2xl";

  const imageSizeClassName =
    size === "sm" ? "max-h-7 max-w-7" : "max-h-12 max-w-12";

  const fallbackSizeClassName = size === "sm" ? "text-base" : "text-2xl";

  return (
    <div
      className={`flex shrink-0 items-center justify-center border border-slate-700 bg-slate-200/90 ${sizeClassName}`}
    >
      {team.logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={team.logoUrl}
          alt={`${team.name} logo`}
          className={`object-contain ${imageSizeClassName}`}
          style={{ transform: `scale(${team.logoScale ?? 1})` }}
        />
      ) : (
        <span
          className={`font-[family-name:var(--font-rajdhani)] font-bold text-slate-900 ${fallbackSizeClassName}`}
        >
          {getLogoFallback(team.name)}
        </span>
      )}
    </div>
  );
}

type TeamSelectorProps = {
  teams: Team[];
  selectedTeam?: Team;
  onSelectTeam: (teamId: string | undefined) => void;
  onStepTeam: (direction: -1 | 1) => void;
};

function TeamSelector({
  teams,
  selectedTeam,
  onSelectTeam,
  onStepTeam,
}: TeamSelectorProps) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
        Team
      </p>

      <div className="grid grid-cols-[52px_minmax(0,1fr)_52px] gap-2">
        <button
          type="button"
          onClick={() => onStepTeam(-1)}
          disabled={teams.length === 0}
          className="rounded-xl border border-slate-700 bg-slate-950 text-xl font-bold text-slate-200 transition hover:border-cyan-400 hover:text-cyan-100 disabled:cursor-not-allowed disabled:opacity-30"
        >
          ←
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex min-h-24 items-center gap-4 rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-left transition hover:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/40"
            >
              {selectedTeam ? (
                <>
                  <TeamLogo team={selectedTeam} />
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-[0.25em] text-slate-600">
                      Current Team
                    </p>
                    <p className="truncate font-[family-name:var(--font-rajdhani)] text-3xl font-bold text-slate-50">
                      {selectedTeam.name}
                    </p>
                  </div>
                </>
              ) : (
                <span className="text-slate-500">No team selected</span>
              )}
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="start"
            className="max-h-96 w-[var(--radix-dropdown-menu-trigger-width)] overflow-auto border-slate-800 bg-slate-950 text-slate-100"
          >
            <DropdownMenuItem
              onClick={() => onSelectTeam(undefined)}
              className="cursor-pointer focus:bg-slate-800 focus:text-cyan-100"
            >
              No team selected
            </DropdownMenuItem>

            {teams.map((team) => (
              <DropdownMenuItem
                key={team.id}
                onClick={() => onSelectTeam(team.id)}
                className="cursor-pointer gap-3 py-3 focus:bg-slate-800 focus:text-cyan-100"
              >
                <TeamLogo team={team} size="sm" />
                <span className="truncate font-semibold">{team.name}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <button
          type="button"
          onClick={() => onStepTeam(1)}
          disabled={teams.length === 0}
          className="rounded-xl border border-slate-700 bg-slate-950 text-xl font-bold text-slate-200 transition hover:border-cyan-400 hover:text-cyan-100 disabled:cursor-not-allowed disabled:opacity-30"
        >
          →
        </button>
      </div>
    </div>
  );
}

type DurationStepperProps = {
  label: string;
  valueMs: number;
  onChange: (durationMs: number) => void;
};

type VerticalStepperProps = {
  label: string;
  value: string;
  onIncrement: () => void;
  onDecrement: () => void;
};

function VerticalStepper({
  label,
  value,
  onIncrement,
  onDecrement,
}: VerticalStepperProps) {
  return (
    <div className="flex flex-col items-center gap-2">
      <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
        {label}
      </span>

      <button
        type="button"
        onClick={onIncrement}
        className="flex h-8 w-12 items-center justify-center rounded-lg border border-slate-700 bg-slate-950 text-xs text-slate-300 transition hover:border-cyan-400 hover:text-cyan-100"
      >
        ▲
      </button>

      <div className="min-w-[4.5rem] text-center font-mono text-4xl font-bold tabular-nums text-cyan-100">
        {value}
      </div>

      <button
        type="button"
        onClick={onDecrement}
        className="flex h-8 w-12 items-center justify-center rounded-lg border border-slate-700 bg-slate-950 text-xs text-slate-300 transition hover:border-cyan-400 hover:text-cyan-100"
      >
        ▼
      </button>
    </div>
  );
}

function DurationStepper({ label, valueMs, onChange }: DurationStepperProps) {
  const { minutes, seconds } = formatDuration(valueMs);

  function updateDuration(deltaMs: number) {
    onChange(Math.max(0, valueMs + deltaMs));
  }

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900 p-5">
      <p className="font-[family-name:var(--font-rajdhani)] text-2xl font-bold uppercase tracking-wide text-cyan-100">
        {label}
      </p>

      <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950 px-5 py-4">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
          <VerticalStepper
            label="Min"
            value={minutes.toString()}
            onIncrement={() => updateDuration(60_000)}
            onDecrement={() => updateDuration(-60_000)}
          />

          <span className="pt-6 font-mono text-5xl font-bold text-slate-600">
            :
          </span>

          <VerticalStepper
            label="Sec"
            value={seconds.toString().padStart(2, "0")}
            onIncrement={() => updateDuration(30_000)}
            onDecrement={() => updateDuration(-30_000)}
          />
        </div>
      </div>
    </div>
  );
}

const visiblePhaseOrder: RunPhase[] = [
  "standby",
  "preparation",
  "ready",
  "finish",
];

function getPhaseVisualState(
  phase: RunPhase,
  currentPhase: RunPhase,
): {
  label: string;
  active: boolean;
  className: string;
  accentClassName: string;
} {
  const isRunningVisual = phase === "ready" && currentPhase === "running";
  const active = currentPhase === phase || isRunningVisual;
  const visualPhase = isRunningVisual ? "running" : phase;

  const styles: Record<
    RunPhase,
    { active: string; inactive: string; accent: string }
  > = {
    standby: {
      active: "border-rose-500 bg-rose-500/25 text-rose-50 shadow-rose-950/40",
      inactive:
        "border-slate-800 bg-slate-950 text-slate-400 hover:border-rose-500/60 hover:text-rose-100",
      accent: "bg-rose-500",
    },
    preparation: {
      active:
        "border-amber-400 bg-amber-500/20 text-amber-100 shadow-amber-950/30",
      inactive:
        "border-slate-800 bg-slate-950 text-slate-400 hover:border-amber-400/60 hover:text-amber-100",
      accent: "bg-amber-400",
    },
    ready: {
      active: "border-sky-400 bg-sky-500/20 text-sky-100 shadow-sky-950/30",
      inactive:
        "border-slate-800 bg-slate-950 text-slate-400 hover:border-sky-400/60 hover:text-sky-100",
      accent: "bg-sky-400",
    },
    running: {
      active:
        "border-emerald-500 bg-emerald-500/25 text-emerald-50 shadow-emerald-950/40",
      inactive:
        "border-slate-800 bg-slate-950 text-slate-400 hover:border-emerald-500/60 hover:text-emerald-100",
      accent: "bg-emerald-500",
    },
    finish: {
      active: "border-rose-500 bg-rose-500/25 text-rose-50 shadow-rose-950/40",
      inactive:
        "border-slate-800 bg-slate-950 text-slate-400 hover:border-rose-500/60 hover:text-rose-100",
      accent: "bg-rose-500",
    },
  };

  return {
    label: isRunningVisual ? runPhaseLabels.running : runPhaseLabels[phase],
    active,
    className: active ? styles[visualPhase].active : styles[phase].inactive,
    accentClassName: styles[visualPhase].accent,
  };
}

function PhaseConnector() {
  return (
    <div className="flex items-center justify-center">
      <span className="h-px w-full min-w-10 bg-slate-700" />
    </div>
  );
}

export function RunControlPanel() {
  const {
    teams,
    currentRun,
    setCurrentRunTeamId,
    selectNextRunTeam,
    setCurrentRunDisciplineId,
    setRunPhase,
    setPreparationDurationMs,
    setRunDurationMs,
    startCurrentRunTimer,
    endCurrentRun,
    autoEndRunWhenTimerFinished,
    setAutoEndRunWhenTimerFinished,
    timer,
  } = useAdminState();

  const selectedTeam = teams.find(
    (team) => team.id === currentRun.selectedTeamId,
  );

  const selectedDiscipline = disciplines.find(
    (discipline) => discipline.id === currentRun.selectedDisciplineId,
  );

  const selectedTeamParticipates =
    !selectedTeam ||
    !currentRun.selectedDisciplineId ||
    selectedTeam.participatingDisciplines.includes(
      currentRun.selectedDisciplineId,
    );

  const showStartTimerButton =
    currentRun.phase === "preparation" || currentRun.phase === "ready";

  const startButtonLabel =
    currentRun.phase === "ready" ? "Start Run >" : "Start Timer >";

  function handlePhaseChange(nextPhase: RunPhase) {
    if (
      currentRun.phase === "running" &&
      timer.timer.status === "running" &&
      nextPhase !== "running"
    ) {
      const confirmed = window.confirm(
        "The run timer is currently running. Do you really want to change the run phase?",
      );

      if (!confirmed) {
        return;
      }
    }

    setRunPhase(nextPhase);
  }

  return (
    <section className="flex h-full min-h-0 flex-col overflow-hidden bg-slate-900 text-slate-50">
      <header className="border-b border-slate-800 px-5 py-4">
        <div>
          <h2 className="text-xl font-bold">Run Control</h2>
          <p className="mt-1 text-sm text-slate-400">
            Configure the current run, select phase, team and discipline, and
            load the required timer durations.
          </p>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-auto p-5">
        <section className="rounded-3xl border border-slate-800 bg-slate-950/50 p-5">
          <h3 className="font-[family-name:var(--font-rajdhani)] text-2xl font-bold uppercase tracking-wide text-cyan-100">
            Phase
          </h3>

          <div className="mt-5 grid grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr] items-center gap-3">
            {visiblePhaseOrder.map((phase, index) => {
              const visualState = getPhaseVisualState(phase, currentRun.phase);

              return (
                <div key={phase} className="contents">
                  <button
                    type="button"
                    onClick={() => handlePhaseChange(phase)}
                    className={`relative min-h-28 overflow-hidden rounded-3xl border px-5 py-4 text-center font-[family-name:var(--font-rajdhani)] text-2xl font-bold uppercase tracking-wide shadow-xl transition ${visualState.className}`}
                  >
                    <span className="block">{visualState.label}</span>
                    <span
                      className={`absolute inset-x-0 bottom-0 h-1.5 ${visualState.accentClassName}`}
                    />
                  </button>

                  {index < visiblePhaseOrder.length - 1 && <PhaseConnector />}
                </div>
              );
            })}
          </div>

          {(showStartTimerButton || currentRun.phase === "running") && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.18 }}
              className="mt-5 flex justify-end"
            >
              {currentRun.phase === "running" ? (
                <button
                  type="button"
                  onClick={endCurrentRun}
                  className="rounded-2xl border border-rose-400/70 bg-rose-700/80 px-7 py-4 font-[family-name:var(--font-rajdhani)] text-2xl font-bold uppercase tracking-wide text-rose-50 transition hover:bg-rose-600"
                >
                  End Run
                </button>
              ) : (
                <button
                  type="button"
                  onClick={startCurrentRunTimer}
                  disabled={timer.timer.status === "running"}
                  className="rounded-2xl border border-emerald-400/70 bg-emerald-600/80 px-7 py-4 font-[family-name:var(--font-rajdhani)] text-2xl font-bold uppercase tracking-wide text-emerald-50 transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {startButtonLabel}
                </button>
              )}
            </motion.div>
          )}
        </section>

        <section className="mt-5 rounded-3xl border border-slate-800 bg-slate-950/50 p-5">
          <h3 className="font-[family-name:var(--font-rajdhani)] text-2xl font-bold uppercase tracking-wide text-cyan-100">
            Configuration
          </h3>

          <div className="mt-4 grid gap-5 xl:grid-cols-[minmax(360px,1fr)_minmax(420px,1.05fr)_minmax(300px,0.75fr)]">
            <section className="rounded-3xl border border-slate-800 bg-slate-950 p-5">
              <div className="space-y-5">
                <TeamSelector
                  teams={teams}
                  selectedTeam={selectedTeam}
                  onSelectTeam={setCurrentRunTeamId}
                  onStepTeam={selectNextRunTeam}
                />

                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
                    Discipline
                  </p>

                  <select
                    value={currentRun.selectedDisciplineId ?? ""}
                    onChange={(event) =>
                      setCurrentRunDisciplineId(
                        (event.target.value || undefined) as
                          | DisciplineId
                          | undefined,
                      )
                    }
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-slate-100 outline-none transition focus:border-cyan-400"
                  >
                    <option value="">No discipline selected</option>
                    {disciplines.map((discipline) => (
                      <option key={discipline.id} value={discipline.id}>
                        {discipline.name}
                      </option>
                    ))}
                  </select>

                  {!selectedTeamParticipates &&
                    selectedDiscipline &&
                    selectedTeam && (
                      <div className="mt-3 rounded-2xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
                        Warning: {selectedTeam.name} is not marked as
                        participating in {selectedDiscipline.name}.
                      </div>
                    )}
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-slate-800 bg-slate-950 p-5">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                <DurationStepper
                  label="Preparation Timer"
                  valueMs={currentRun.preparationDurationMs}
                  onChange={setPreparationDurationMs}
                />

                <DurationStepper
                  label="Run Timer"
                  valueMs={currentRun.runDurationMs}
                  onChange={setRunDurationMs}
                />
              </div>
            </section>

            <section className="rounded-3xl border border-slate-800 bg-slate-950 p-5">
              <label
                title="Automatically switch to Finish when the run timer reaches zero"
                className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900 px-4 py-4 text-sm text-slate-300"
              >
                <input
                  type="checkbox"
                  checked={autoEndRunWhenTimerFinished}
                  onChange={(event) =>
                    setAutoEndRunWhenTimerFinished(event.target.checked)
                  }
                  className="h-4 w-4 accent-cyan-400"
                />

                <span className="font-medium text-slate-200">
                  Finish run when the timer expires
                </span>
              </label>
            </section>
          </div>
        </section>
      </div>
    </section>
  );
}
