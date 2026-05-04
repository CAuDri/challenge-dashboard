"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { ScreenDefinition } from "@/types/screen";
import { disciplines, type Team } from "@/types/team";
import type { CountdownTimerState } from "@/types/timer";
import type { CurrentRunState, RunPhase } from "@/types/run";

type TimerDisplayScreenProps = {
  screen: ScreenDefinition;
  timer: CountdownTimerState;
  currentRun: CurrentRunState;
  teams: Team[];
};

function formatTimer(ms: number) {
  const safeMs = Math.max(0, ms);
  const totalSeconds = Math.floor(safeMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const milliseconds = Math.floor(safeMs % 1000);

  return {
    minutes: minutes.toString().padStart(2, "0"),
    seconds: seconds.toString().padStart(2, "0"),
    milliseconds: milliseconds.toString().padStart(3, "0"),
  };
}

function getLogoFallback(teamName: string) {
  return teamName.slice(0, 2).toUpperCase();
}

function getPhaseLabel(phase: RunPhase) {
  const labels: Record<RunPhase, string> = {
    standby: "Stand-By",
    preparation: "Preparation",
    ready: "Ready",
    running: "Go!",
    finish: "Finish",
  };

  return labels[phase];
}

function getPhaseClassName(phase: RunPhase, timerFinished: boolean) {
  if (timerFinished && (phase === "preparation" || phase === "running")) {
    return "border-rose-400 bg-rose-500/20 text-rose-100";
  }

  const classes: Record<RunPhase, string> = {
    standby: "border-rose-400/70 bg-rose-500/15 text-rose-100",
    preparation: "border-amber-400/70 bg-amber-500/15 text-amber-100",
    ready: "border-sky-400/70 bg-sky-500/15 text-sky-100",
    running: "border-emerald-400/70 bg-emerald-500/15 text-emerald-100",
    finish: "border-rose-400/70 bg-rose-500/15 text-rose-100",
  };

  return classes[phase];
}

function getDisciplineName(currentRun: CurrentRunState) {
  if (!currentRun.selectedDisciplineId) {
    return "No discipline selected";
  }

  return (
    disciplines.find(
      (discipline) => discipline.id === currentRun.selectedDisciplineId,
    )?.name ?? currentRun.selectedDisciplineId
  );
}

function getSelectedTeam(currentRun: CurrentRunState, teams: Team[]) {
  return teams.find((team) => team.id === currentRun.selectedTeamId);
}

function LargeTimer({
  timer,
  emphasized,
}: {
  timer: CountdownTimerState;
  emphasized?: boolean;
}) {
  const time = formatTimer(timer.remainingMs);

  return (
    <div
      className={`font-mono tabular-nums ${
        emphasized ? "text-rose-100" : "text-cyan-100"
      }`}
    >
      <span className="inline-block w-[2ch] text-right text-[clamp(6rem,14vw,14rem)] font-bold leading-none tracking-[-0.08em]">
        {time.minutes}
      </span>

      <span className="inline-block w-[0.7ch] text-center text-[clamp(6rem,14vw,14rem)] font-bold leading-none tracking-[-0.08em]">
        :
      </span>

      <span className="inline-block w-[2ch] text-left text-[clamp(6rem,14vw,14rem)] font-bold leading-none tracking-[-0.08em]">
        {time.seconds}
      </span>

      <span className="inline-block w-[4ch] text-left text-[clamp(2.8rem,5vw,5rem)] font-semibold tracking-[-0.08em] opacity-75">
        .{time.milliseconds}
      </span>
    </div>
  );
}

function SimpleTimerScreen({ timer }: { timer: CountdownTimerState }) {
  const timerFinished = timer.remainingMs <= 0 && timer.status === "finished";

  return (
    <main
      className={`flex h-full w-full items-center justify-center overflow-hidden text-white transition-colors ${
        timerFinished
          ? "bg-gradient-to-br from-slate-950 via-rose-950 to-black"
          : "bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950"
      }`}
    >
      <motion.div
        key={timerFinished ? "finished" : "running"}
        initial={{ scale: 0.985, opacity: 0.85 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.25 }}
        className={
          timerFinished ? "drop-shadow-[0_0_48px_rgba(244,63,94,0.45)]" : ""
        }
      >
        <LargeTimer timer={timer} emphasized={timerFinished} />
      </motion.div>
    </main>
  );
}

function RunInfoTimerScreen({
  timer,
  currentRun,
  teams,
}: {
  timer: CountdownTimerState;
  currentRun: CurrentRunState;
  teams: Team[];
}) {
  const selectedTeam = getSelectedTeam(currentRun, teams);
  const disciplineName = getDisciplineName(currentRun);
  const timerFinished = timer.remainingMs <= 0 && timer.status === "finished";
  const phaseLabel = getPhaseLabel(currentRun.phase);
  const phaseClassName = getPhaseClassName(currentRun.phase, timerFinished);

  return (
    <main className="flex h-full w-full flex-col overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950 px-[clamp(2rem,4vw,4rem)] py-[clamp(2rem,3vw,3rem)] text-white">
      <header className="flex shrink-0 items-start justify-between gap-8">
        <div className="min-w-0">
          <p className="font-[family-name:var(--font-rajdhani)] text-[clamp(1.4rem,2vw,2.4rem)] font-semibold uppercase tracking-[0.45em] text-cyan-300">
            CAuDri-Challenge {new Date().getFullYear()}
          </p>

          <h1 className="mt-3 truncate font-[family-name:var(--font-rajdhani)] text-[clamp(3rem,5vw,5.8rem)] font-bold leading-none text-slate-50">
            {disciplineName}
          </h1>
        </div>

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/caudri_logo.svg"
          alt="CAuDri-Challenge"
          className="h-[clamp(5.5rem,8vw,9rem)] w-auto shrink-0 object-contain opacity-95"
        />
      </header>

      <section className="grid min-h-0 flex-1 grid-rows-[auto_minmax(0,1fr)] gap-[clamp(2rem,4vh,4rem)] pt-[clamp(2rem,4vh,4rem)]">
        <div className="flex items-center justify-between gap-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedTeam?.id ?? "no-team"}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
              className="flex min-w-0 items-center gap-6"
            >
              <div className="flex h-[clamp(6rem,9vw,10rem)] w-[clamp(6rem,9vw,10rem)] shrink-0 items-center justify-center rounded-3xl border border-slate-500/40 bg-slate-200/90 shadow-xl">
                {selectedTeam?.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={selectedTeam.logoUrl}
                    alt={`${selectedTeam.name} logo`}
                    className="max-h-[78%] max-w-[78%] object-contain"
                    style={{
                      transform: `scale(${selectedTeam.logoScale ?? 1})`,
                    }}
                  />
                ) : (
                  <span className="font-[family-name:var(--font-rajdhani)] text-[clamp(2.4rem,4vw,4.5rem)] font-bold text-slate-900">
                    {selectedTeam ? getLogoFallback(selectedTeam.name) : "—"}
                  </span>
                )}
              </div>

              <div className="min-w-0">
                <p className="font-[family-name:var(--font-rajdhani)] text-[clamp(1rem,1.6vw,1.6rem)] font-bold uppercase tracking-[0.3em] text-slate-400">
                  Current Team
                </p>
                <h2 className="truncate font-[family-name:var(--font-rajdhani)] text-[clamp(3rem,5vw,6rem)] font-bold leading-none text-slate-50">
                  {selectedTeam?.name ?? "No team selected"}
                </h2>
              </div>
            </motion.div>
          </AnimatePresence>

          <motion.div
            key={currentRun.phase}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
            className={`shrink-0 rounded-3xl border px-[clamp(1.5rem,3vw,3rem)] py-[clamp(1rem,2vw,1.75rem)] font-[family-name:var(--font-rajdhani)] text-[clamp(2rem,3.6vw,4rem)] font-bold uppercase tracking-wide shadow-xl ${phaseClassName}`}
          >
            {phaseLabel}
          </motion.div>
        </div>

        <div className="flex min-h-0 items-center justify-center">
          <motion.div
            animate={
              timerFinished &&
              (currentRun.phase === "preparation" ||
                currentRun.phase === "running")
                ? {
                    scale: [1, 1.015, 1],
                  }
                : {
                    scale: 1,
                  }
            }
            transition={{
              duration: 1.1,
              repeat:
                timerFinished &&
                (currentRun.phase === "preparation" ||
                  currentRun.phase === "running")
                  ? Infinity
                  : 0,
            }}
            className={
              timerFinished &&
              (currentRun.phase === "preparation" ||
                currentRun.phase === "running")
                ? "drop-shadow-[0_0_56px_rgba(244,63,94,0.45)]"
                : ""
            }
          >
            <LargeTimer
              timer={timer}
              emphasized={
                timerFinished &&
                (currentRun.phase === "preparation" ||
                  currentRun.phase === "running")
              }
            />
          </motion.div>
        </div>
      </section>
    </main>
  );
}

export function TimerDisplayScreen({
  screen,
  timer,
  currentRun,
  teams,
}: TimerDisplayScreenProps) {
  const layout = screen.config?.timer?.layout ?? "timer_only";

  if (layout === "run_info") {
    return (
      <RunInfoTimerScreen timer={timer} currentRun={currentRun} teams={teams} />
    );
  }

  return <SimpleTimerScreen timer={timer} />;
}
