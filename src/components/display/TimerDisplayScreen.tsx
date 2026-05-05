"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { CurrentRunState, RunPhase } from "@/types/run";
import type { ScreenDefinition, TimerScreenConfig } from "@/types/screen";
import { disciplines, type Team } from "@/types/team";
import type { CountdownTimerState } from "@/types/timer";

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

function getPhaseColorClassName(phase: RunPhase, timerExpired: boolean) {
  if (timerExpired && (phase === "preparation" || phase === "running")) {
    return "text-rose-100 border-rose-400 bg-rose-500/15";
  }

  const classes: Record<RunPhase, string> = {
    standby: "text-rose-100 border-rose-500/70 bg-rose-500/10",
    preparation: "text-amber-100 border-amber-400/70 bg-amber-500/10",
    ready: "text-sky-100 border-sky-400/70 bg-sky-500/10",
    running: "text-emerald-100 border-emerald-400/70 bg-emerald-500/10",
    finish: "text-rose-100 border-rose-500/70 bg-rose-500/10",
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

function getTimerConfig(screen: ScreenDefinition): TimerScreenConfig {
  return {
    layout: screen.config?.timer?.layout ?? "timer_only",
    showHeader: screen.config?.timer?.showHeader ?? false,
    showLogo: screen.config?.timer?.showLogo ?? false,
    showTeam: screen.config?.timer?.showTeam ?? false,
    showDiscipline: screen.config?.timer?.showDiscipline ?? false,
    showPhase: screen.config?.timer?.showPhase ?? false,
    showCustomTitle: screen.config?.timer?.showCustomTitle ?? false,
    customTitle: screen.config?.timer?.customTitle ?? "",
    showInfoText: screen.config?.timer?.showInfoText ?? false,
    infoText: screen.config?.timer?.infoText ?? "",
    useTeamColorAccent: screen.config?.timer?.useTeamColorAccent ?? false,
    timerScale: screen.config?.timer?.timerScale ?? 1,
    showMilliseconds:
      screen.config?.timer?.showMilliseconds ?? "during_running",
  };
}

function LargeTimer({
  timer,
  emphasized,
  scale,
  showMilliseconds,
}: {
  timer: CountdownTimerState;
  emphasized: boolean;
  scale: number;
  showMilliseconds: boolean;
}) {
  const time = formatTimer(timer.remainingMs);
  const safeScale = Math.min(Math.max(scale, 0.7), 1.25);

  return (
    <div
      className={`relative inline-flex font-mono text-[clamp(6rem,14vw,13rem)] tabular-nums transition-colors ${
        emphasized ? "text-rose-100" : "text-cyan-100"
      }`}
      style={{
        transform: `scale(${safeScale})`,
        transformOrigin: "center",
      }}
    >
      <div className="grid grid-cols-[2.1ch_0.85ch_2.1ch] items-baseline justify-center font-bold leading-none tracking-[-0.03em]">
        <span className="inline-block text-right">{time.minutes}</span>
        <span className="inline-block text-center">:</span>
        <span className="inline-block text-left">{time.seconds}</span>
      </div>

      {showMilliseconds && (
        <span className="absolute left-full bottom-[+0.3em] ml-[0.08em] inline-block w-[4.2ch] text-left text-[0.34em] font-semibold leading-none tracking-[-0.03em] opacity-75">
          .{time.milliseconds}
        </span>
      )}
    </div>
  );
}

function TimerHeader({
  config,
  currentRun,
  selectedTeam,
}: {
  config: TimerScreenConfig;
  currentRun: CurrentRunState;
  selectedTeam?: Team;
}) {
  const disciplineName = getDisciplineName(currentRun);
  const hasCustomTitle =
    config.showCustomTitle && config.customTitle?.trim().length > 0;

  const showMainTitle = hasCustomTitle || config.showDiscipline;
  const mainTitle = hasCustomTitle ? config.customTitle : disciplineName;

  const showSeparateDiscipline =
    hasCustomTitle && config.showDiscipline && disciplineName;

  const textLineCount = (config.showHeader ? 1 : 0) + (showMainTitle ? 1 : 0);

  const logoClassName =
    textLineCount >= 2
      ? "h-[clamp(6.2rem,8vw,9rem)]"
      : "h-[clamp(3.8rem,5.3vw,6rem)]";

  return (
    <header className="flex shrink-0 items-start justify-between gap-7">
      <div className="min-w-0">
        <div className="flex min-w-0 items-end gap-15">
          {config.showLogo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src="/caudri_logo.svg"
              alt="CAuDri-Challenge"
              className={`w-auto shrink-0 object-contain opacity-95 ${logoClassName}`}
            />
          )}

          <div className="min-w-0">
            {config.showHeader && (
              <p className="font-[family-name:var(--font-rajdhani)] text-[clamp(1.2rem,1.8vw,2rem)] font-semibold uppercase tracking-[0.42em] text-cyan-300">
                CAuDri-Challenge {new Date().getFullYear()}
              </p>
            )}

            {showMainTitle && (
              <h1 className="mb-[-0.2em] mt-2 truncate font-[family-name:var(--font-rajdhani)] text-[clamp(4rem,6vw,7rem)] font-bold leading-none text-slate-50">
                {mainTitle}
              </h1>
            )}
          </div>
        </div>

        {showSeparateDiscipline && (
          <p className="mt-4 truncate font-[family-name:var(--font-rajdhani)] text-[clamp(1.4rem,2.1vw,2.5rem)] font-semibold uppercase tracking-[0.28em] text-slate-400">
            {disciplineName}
          </p>
        )}
      </div>

      {config.showTeam && (
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedTeam?.id ?? "no-team"}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
            className="flex max-w-[38vw] shrink-0 items-center justify-end gap-4 text-right"
          >
            <div className="min-w-0">
              <p className="font-[family-name:var(--font-rajdhani)] text-[clamp(0.9rem,1.2vw,1.3rem)] font-bold uppercase tracking-[0.3em] text-slate-500">
                Team
              </p>

              <p className="truncate font-[family-name:var(--font-rajdhani)] text-[clamp(2rem,3.4vw,4rem)] font-bold leading-none text-slate-50">
                {selectedTeam?.name ?? "No team selected"}
              </p>
            </div>

            <div className="flex h-[clamp(4rem,6vw,7rem)] w-[clamp(4rem,6vw,7rem)] shrink-0 items-center justify-center rounded-3xl border border-slate-500/40 bg-slate-200/90 shadow-xl">
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
                <span className="font-[family-name:var(--font-rajdhani)] text-[clamp(1.8rem,3vw,3.5rem)] font-bold text-slate-900">
                  {selectedTeam ? getLogoFallback(selectedTeam.name) : "—"}
                </span>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      )}
    </header>
  );
}

function PhaseDisplay({
  phase,
  timerExpired,
}: {
  phase: RunPhase;
  timerExpired: boolean;
}) {
  return (
    <motion.div
      key={`${phase}-${timerExpired}`}
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.2 }}
      className={`mx-auto w-fit rounded-full border px-[clamp(1.5rem,3vw,3rem)] py-[clamp(0.55rem,1vw,0.9rem)] font-[family-name:var(--font-rajdhani)] text-[clamp(1.6rem,3vw,3.4rem)] font-bold uppercase tracking-[0.28em] shadow-xl ${getPhaseColorClassName(
        phase,
        timerExpired,
      )}`}
    >
      {getPhaseLabel(phase)}
    </motion.div>
  );
}

export function TimerDisplayScreen({
  screen,
  timer,
  currentRun,
  teams,
}: TimerDisplayScreenProps) {
  const config = getTimerConfig(screen);
  const selectedTeam = getSelectedTeam(currentRun, teams);

  const timerExpired =
    timer.remainingMs <= 0 &&
    timer.status === "finished" &&
    (currentRun.phase === "preparation" || currentRun.phase === "running");

  const teamColor = selectedTeam?.teamColor ?? "#22d3ee";
  const showAccent = config.useTeamColorAccent && selectedTeam;

  const showMilliseconds =
    config.showMilliseconds === "always" ||
    (config.showMilliseconds === "during_running" &&
      currentRun.phase === "running");

  return (
    <main
      className={`relative flex h-full w-full flex-col overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950 px-[clamp(2rem,4vw,4rem)] py-[clamp(2rem,3vw,3rem)] text-white transition-colors ${
        timerExpired ? "from-slate-950 via-rose-950 to-black" : ""
      }`}
    >
      {showAccent && (
        <div
          className="absolute inset-x-0 top-0 h-2"
          style={{ backgroundColor: teamColor }}
        />
      )}

      {(config.showHeader ||
        config.showLogo ||
        config.showTeam ||
        config.showDiscipline ||
        config.showCustomTitle) && (
        <TimerHeader
          config={config}
          currentRun={currentRun}
          selectedTeam={selectedTeam}
        />
      )}

      <section className="flex min-h-0 flex-1 flex-col items-center justify-center gap-[clamp(1.5rem,3vh,3rem)]">
        {config.showPhase && (
          <PhaseDisplay phase={currentRun.phase} timerExpired={timerExpired} />
        )}

        <motion.div
          animate={
            timerExpired
              ? {
                  scale: [1, 1.015, 1],
                }
              : {
                  scale: 1,
                }
          }
          transition={{
            duration: 1.1,
            repeat: timerExpired ? Infinity : 0,
          }}
          className={
            timerExpired ? "drop-shadow-[0_0_56px_rgba(244,63,94,0.45)]" : ""
          }
        >
          <LargeTimer
            timer={timer}
            emphasized={timerExpired}
            scale={config.timerScale}
            showMilliseconds={showMilliseconds}
          />
        </motion.div>

        {config.showInfoText && config.infoText?.trim() && (
          <motion.p
            key={config.infoText}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="max-w-5xl text-center font-[family-name:var(--font-rajdhani)] text-[clamp(1.1rem,1.8vw,2rem)] font-semibold uppercase tracking-[0.25em] text-slate-400"
          >
            {config.infoText}
          </motion.p>
        )}
      </section>
    </main>
  );
}
