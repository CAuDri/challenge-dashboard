"use client";

import { FileText, Trophy, Video } from "lucide-react";
import type { ReactNode } from "react";
import type { CurrentRunState, RunPhase } from "@/types/run";
import type { ScreenDefinition, TimerScreenConfig } from "@/types/screen";
import { disciplines, type DisciplineId, type Team } from "@/types/team";
import type { CountdownTimerState } from "@/types/timer";

type ScreenThumbnailProps = {
  screen: ScreenDefinition;
  teams: Team[];
  currentRun: CurrentRunState;
  timer: CountdownTimerState;
};

function getDisciplineName(disciplineId: DisciplineId | undefined) {
  if (!disciplineId) {
    return "Discipline";
  }

  return (
    disciplines.find((discipline) => discipline.id === disciplineId)?.name ??
    disciplineId
  );
}

function formatTimer(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes.toString().padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}`;
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

function getPhaseClassName(phase: RunPhase, timerExpired: boolean) {
  if (timerExpired && (phase === "preparation" || phase === "running")) {
    return "border-rose-400/80 bg-rose-500/15 text-rose-100";
  }

  const classes: Record<RunPhase, string> = {
    standby: "border-rose-500/60 bg-rose-500/10 text-rose-100",
    preparation: "border-amber-400/60 bg-amber-500/10 text-amber-100",
    ready: "border-sky-400/60 bg-sky-500/10 text-sky-100",
    running: "border-emerald-400/60 bg-emerald-500/10 text-emerald-100",
    finish: "border-rose-500/60 bg-rose-500/10 text-rose-100",
  };

  return classes[phase];
}

function getLogoFallback(teamName: string) {
  return teamName.slice(0, 2).toUpperCase();
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

function getRankedTeams(teams: Team[], disciplineId: DisciplineId | undefined) {
  if (!disciplineId) {
    return [];
  }

  return teams
    .filter((team) => team.participatingDisciplines.includes(disciplineId))
    .map((team) => ({
      team,
      score: team.scores[disciplineId] ?? 0,
    }))
    .sort((a, b) => b.score - a.score || a.team.name.localeCompare(b.team.name))
    .slice(0, 4);
}

function ImageThumbnail({ screen }: { screen: ScreenDefinition }) {
  if (!screen.config?.image?.imageUrl) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-slate-900 to-slate-950 text-center">
        <p className="font-[family-name:var(--font-rajdhani)] text-2xl font-bold uppercase tracking-wide text-cyan-100">
          Image Preview
        </p>
        <p className="text-xs uppercase tracking-[0.22em] text-slate-500">
          No image selected
        </p>
      </div>
    );
  }

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={screen.config.image.imageUrl}
        alt=""
        className="h-full w-full object-contain"
      />
      <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-slate-950/95 to-transparent" />
    </>
  );
}

function TimerThumbnail({
  screen,
  currentRun,
  timer,
  teams,
}: ScreenThumbnailProps) {
  const selectedTeam = teams.find(
    (team) => team.id === currentRun.selectedTeamId,
  );
  const config = getTimerConfig(screen);
  const disciplineName = getDisciplineName(currentRun.selectedDisciplineId);
  const hasCustomTitle =
    config.showCustomTitle && (config.customTitle?.trim().length ?? 0) > 0;
  const title = hasCustomTitle ? config.customTitle : disciplineName;
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
    <div
      className={`relative flex h-full w-full flex-col overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950/70 p-4 ${
        timerExpired ? "from-slate-950 via-rose-950 to-black" : ""
      }`}
    >
      {showAccent && (
        <div
          className="absolute inset-x-0 top-0 h-1"
          style={{ backgroundColor: teamColor }}
        />
      )}

      <div className="flex min-h-12 items-start justify-between gap-3">
        <div className="min-w-0">
          {config.showHeader && (
            <p className="font-[family-name:var(--font-rajdhani)] text-[0.6rem] font-bold uppercase tracking-[0.28em] text-cyan-300">
              CAuDri-Challenge
            </p>
          )}

          {(config.showDiscipline || hasCustomTitle) && (
            <p className="mt-1 truncate font-[family-name:var(--font-rajdhani)] text-sm font-bold uppercase tracking-wide text-slate-100">
              {title}
            </p>
          )}
        </div>

        {config.showTeam && (
          <div className="flex max-w-[45%] shrink-0 items-center justify-end gap-2 text-right">
            <div className="min-w-0">
              <p className="text-[0.55rem] font-bold uppercase tracking-[0.2em] text-slate-500">
                Team
              </p>
              <p className="truncate text-xs font-bold text-slate-100">
                {selectedTeam?.name ?? "No team"}
              </p>
            </div>

            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-slate-400/30 bg-slate-200/90">
              {selectedTeam?.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={selectedTeam.logoUrl}
                  alt=""
                  className="max-h-[76%] max-w-[76%] object-contain"
                  style={{
                    transform: `scale(${selectedTeam.logoScale ?? 1})`,
                  }}
                />
              ) : (
                <span className="font-[family-name:var(--font-rajdhani)] text-sm font-bold text-slate-900">
                  {selectedTeam ? getLogoFallback(selectedTeam.name) : "-"}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-3">
        {config.showPhase && (
          <span
            className={`rounded-full border px-4 py-1 font-[family-name:var(--font-rajdhani)] text-xs font-bold uppercase tracking-[0.22em] ${getPhaseClassName(
              currentRun.phase,
              timerExpired,
            )}`}
          >
            {getPhaseLabel(currentRun.phase)}
          </span>
        )}

        <div
          className={`font-mono text-5xl font-bold tracking-[-0.08em] ${
            timerExpired ? "text-rose-100" : "text-cyan-100"
          }`}
        >
          {formatTimer(timer.remainingMs)}
          {showMilliseconds && (
            <span className="ml-1 text-2xl font-semibold opacity-70">
              .
              {Math.floor(timer.remainingMs % 1000)
                .toString()
                .padStart(3, "0")}
            </span>
          )}
        </div>
      </div>

      <div className="flex min-h-5 items-center justify-between gap-3 text-[0.65rem] uppercase tracking-[0.18em] text-slate-500">
        <span>{timer.status}</span>
        {config.showInfoText && config.infoText?.trim() && (
          <span className="truncate">{config.infoText}</span>
        )}
      </div>
    </div>
  );
}

function ScoreboardThumbnail({
  screen,
  teams,
}: {
  screen: ScreenDefinition;
  teams: Team[];
}) {
  const disciplineId = screen.config?.scoreboard?.disciplineId;
  const rankedTeams = getRankedTeams(teams, disciplineId);
  const maxScore = Math.max(
    1,
    ...rankedTeams.map((rankedTeam) => rankedTeam.score),
  );

  return (
    <div className="flex h-full w-full flex-col bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950/70 p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="font-[family-name:var(--font-rajdhani)] text-xs font-bold uppercase tracking-[0.28em] text-cyan-300">
            CAuDri-Challenge
          </p>
          <p className="mt-1 truncate font-[family-name:var(--font-rajdhani)] text-base font-bold leading-none text-slate-100">
            {getDisciplineName(disciplineId)}
          </p>
        </div>

        <Trophy className="size-5 shrink-0 text-cyan-200/70" />
      </div>

      <div className="mt-4 grid flex-1 content-center gap-2">
        {rankedTeams.length > 0 ? (
          rankedTeams.map((rankedTeam, index) => (
            <div
              key={rankedTeam.team.id}
              className="relative overflow-hidden rounded-lg border border-cyan-400/10 bg-slate-950/55 px-3 py-2 text-xs"
            >
              <div
                className="absolute inset-y-0 left-0 bg-cyan-400/10"
                style={{
                  width: `${Math.max(6, (rankedTeam.score / maxScore) * 100)}%`,
                }}
              />
              <div className="relative grid grid-cols-[1.5rem_minmax(0,1fr)_3rem] items-center gap-2">
                <span className="font-mono font-bold text-cyan-200">
                  {index + 1}
                </span>
                <span className="truncate font-semibold text-slate-200">
                  {rankedTeam.team.name}
                </span>
                <span className="text-right font-mono text-slate-400">
                  {rankedTeam.score}
                </span>
              </div>
            </div>
          ))
        ) : (
          <p className="text-center text-xs uppercase tracking-[0.2em] text-slate-600">
            No teams
          </p>
        )}
      </div>
    </div>
  );
}

function PlaceholderThumbnail({
  icon,
  label,
}: {
  icon: ReactNode;
  label: string;
}) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-4 bg-gradient-to-br from-slate-900 to-slate-950 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-200">
        {icon}
      </div>
      <p className="font-[family-name:var(--font-rajdhani)] text-2xl font-bold uppercase tracking-wide text-cyan-100">
        {label}
      </p>
    </div>
  );
}

export function ScreenThumbnail(props: ScreenThumbnailProps) {
  const { screen } = props;

  switch (screen.type) {
    case "image":
      return <ImageThumbnail screen={screen} />;
    case "timer":
      return <TimerThumbnail {...props} />;
    case "scoreboard":
      return <ScoreboardThumbnail screen={screen} teams={props.teams} />;
    case "pdf":
      return (
        <PlaceholderThumbnail
          icon={<FileText className="size-7" />}
          label="PDF Preview"
        />
      );
    case "camera":
      return (
        <PlaceholderThumbnail
          icon={<Video className="size-7" />}
          label="Camera Preview"
        />
      );
  }
}
