"use client";

import { Clock3, FileText, Trophy, Video } from "lucide-react";
import type { ReactNode } from "react";
import type { CurrentRunState } from "@/types/run";
import type { ScreenDefinition } from "@/types/screen";
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

function LabelThumbnail({ screen }: { screen: ScreenDefinition }) {
  return (
    <span className="rounded-xl border border-cyan-400/40 bg-cyan-400/10 px-5 py-3 font-[family-name:var(--font-rajdhani)] text-2xl font-bold uppercase tracking-wide text-cyan-200">
      {screen.thumbnailLabel}
    </span>
  );
}

function ImageThumbnail({ screen }: { screen: ScreenDefinition }) {
  if (!screen.config?.image?.imageUrl) {
    return <LabelThumbnail screen={screen} />;
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
  const config = screen.config?.timer;
  const showRunInfo = config?.layout !== "timer_only";

  return (
    <div className="flex h-full w-full flex-col justify-between bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950/70 p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="font-[family-name:var(--font-rajdhani)] text-xs font-bold uppercase tracking-[0.28em] text-cyan-300">
            Timer
          </p>
          {showRunInfo && (
            <p className="mt-1 truncate text-xs text-slate-500">
              {getDisciplineName(currentRun.selectedDisciplineId)}
            </p>
          )}
        </div>

        <Clock3 className="size-5 shrink-0 text-cyan-200/70" />
      </div>

      <div className="text-center font-mono text-5xl font-bold tracking-[-0.08em] text-cyan-100">
        {formatTimer(timer.remainingMs)}
      </div>

      <div className="flex min-h-5 items-center justify-between gap-3 text-xs uppercase tracking-[0.18em] text-slate-500">
        <span>{timer.status}</span>
        {showRunInfo && (
          <span className="truncate">{selectedTeam?.name ?? "No team"}</span>
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

  return (
    <div className="flex h-full w-full flex-col bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950/70 p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="font-[family-name:var(--font-rajdhani)] text-xs font-bold uppercase tracking-[0.28em] text-cyan-300">
            Scoreboard
          </p>
          <p className="mt-1 truncate text-xs text-slate-500">
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
              className="grid grid-cols-[1.5rem_minmax(0,1fr)_3rem] items-center gap-2 rounded-lg border border-cyan-400/10 bg-slate-950/55 px-3 py-2 text-xs"
            >
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
  screen,
  icon,
  label,
}: {
  screen: ScreenDefinition;
  icon: ReactNode;
  label: string;
}) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-4 bg-gradient-to-br from-slate-900 to-slate-950 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-200">
        {icon}
      </div>
      <div>
        <p className="font-[family-name:var(--font-rajdhani)] text-2xl font-bold uppercase tracking-wide text-cyan-100">
          {screen.thumbnailLabel}
        </p>
        <p className="mt-1 text-xs uppercase tracking-[0.22em] text-slate-500">
          {label}
        </p>
      </div>
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
          screen={screen}
          icon={<FileText className="size-7" />}
          label="Presentation Preview"
        />
      );
    case "camera":
      return (
        <PlaceholderThumbnail
          screen={screen}
          icon={<Video className="size-7" />}
          label="Camera Preview"
        />
      );
  }
}
