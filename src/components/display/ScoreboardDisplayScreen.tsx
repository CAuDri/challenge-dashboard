"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import type { ScreenDefinition } from "@/types/screen";
import { disciplines, type DisciplineId, type Team } from "@/types/team";
import type { DisplayControlState } from "@/types/display-client";

type ScoreboardDisplayScreenProps = {
  screen: ScreenDefinition;
  teams: Team[];
  displayClientId?: string;
  displayControl: DisplayControlState;
  onRevealChange: (payload: {
    clientId: string;
    screenId: string;
    revealedCount: number;
    totalCount: number;
  }) => void;
};

type RankedTeam = {
  team: Team;
  score: number;
};

function getCurrentYear() {
  return new Date().getFullYear();
}

function getDisciplineName(disciplineId: DisciplineId) {
  return (
    disciplines.find((discipline) => discipline.id === disciplineId)?.name ??
    disciplineId
  );
}

function getScore(team: Team, disciplineId: DisciplineId) {
  return team.scores[disciplineId] ?? 0;
}

function getRankedTeams(teams: Team[], disciplineId: DisciplineId) {
  return teams
    .filter((team) => team.participatingDisciplines.includes(disciplineId))
    .map<RankedTeam>((team) => ({
      team,
      score: getScore(team, disciplineId),
    }))
    .sort((a, b) => {
      if (a.score !== b.score) {
        return b.score - a.score;
      }

      return a.team.name.localeCompare(b.team.name);
    });
}

function getLogoFallback(teamName: string) {
  return teamName.slice(0, 2).toUpperCase();
}

function getPlacementLabel(rank: number) {
  const lastDigit = rank % 10;
  const lastTwoDigits = rank % 100;

  if (lastTwoDigits >= 11 && lastTwoDigits <= 13) {
    return `${rank}th Place`;
  }

  if (lastDigit === 1) {
    return `${rank}st Place`;
  }

  if (lastDigit === 2) {
    return `${rank}nd Place`;
  }

  if (lastDigit === 3) {
    return `${rank}rd Place`;
  }

  return `${rank}th Place`;
}

export function ScoreboardDisplayScreen({
  screen,
  teams,
  displayClientId,
  displayControl,
  onRevealChange,
}: ScoreboardDisplayScreenProps) {
  const disciplineId = screen.config?.scoreboard?.disciplineId;

  const rankedTeams = useMemo(() => {
    if (!disciplineId) {
      return [];
    }

    return getRankedTeams(teams, disciplineId);
  }, [disciplineId, teams]);

  const [revealedCount, setRevealedCount] = useState(0);
  const syncedRevealState = displayControl.scoreboardReveals[screen.id];
  const canControlSharedState =
    !displayControl.syncEnabled ||
    !displayControl.mainDisplayClientId ||
    displayControl.mainDisplayClientId === displayClientId;

  useEffect(() => {
    queueMicrotask(() => {
      setRevealedCount(0);
    });
  }, [screen.id, disciplineId]);

  useEffect(() => {
    if (!displayControl.syncEnabled || canControlSharedState) {
      return;
    }

    if (!syncedRevealState) {
      return;
    }

    queueMicrotask(() => {
      setRevealedCount(
        Math.min(
          Math.max(0, syncedRevealState.revealedCount),
          rankedTeams.length,
        ),
      );
    });
  }, [
    canControlSharedState,
    displayControl.syncEnabled,
    rankedTeams.length,
    syncedRevealState,
  ]);

  useEffect(() => {
    function setSharedRevealedCount(nextCount: number) {
      if (displayControl.syncEnabled && !canControlSharedState) {
        return;
      }

      const nextRevealedCount = Math.min(
        Math.max(0, nextCount),
        rankedTeams.length,
      );

      setRevealedCount(nextRevealedCount);

      if (displayClientId && canControlSharedState) {
        onRevealChange({
          clientId: displayClientId,
          screenId: screen.id,
          revealedCount: nextRevealedCount,
          totalCount: rankedTeams.length,
        });
      }
    }

    function revealNext() {
      setSharedRevealedCount(revealedCount + 1);
    }

    function revealPrevious() {
      setSharedRevealedCount(revealedCount - 1);
    }

    function handlePointerDown() {
      revealNext();
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (
        event.key === " " ||
        event.key === "Enter" ||
        event.key === "ArrowRight"
      ) {
        event.preventDefault();
        revealNext();
      }

      if (event.key === "ArrowLeft" || event.key === "Backspace") {
        event.preventDefault();
        revealPrevious();
      }

      if (event.key.toLowerCase() === "r") {
        event.preventDefault();
        setSharedRevealedCount(0);
      }
    }

    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    canControlSharedState,
    displayClientId,
    displayControl.syncEnabled,
    onRevealChange,
    rankedTeams.length,
    revealedCount,
    screen.id,
  ]);

  if (!disciplineId) {
    return (
      <main className="flex h-full w-full items-center justify-center bg-black text-white">
        <p className="font-[family-name:var(--font-rajdhani)] text-5xl font-bold">
          Scoreboard screen is missing a discipline.
        </p>
      </main>
    );
  }

  const maxScore = Math.max(
    1,
    ...rankedTeams.map((rankedTeam) => rankedTeam.score),
  );

  const disciplineName = getDisciplineName(disciplineId);
  const year = getCurrentYear();
  const slotCount = Math.max(4, rankedTeams.length);

  return (
    <main className="flex h-full w-full flex-col overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950 px-[clamp(2rem,4vw,4rem)] py-[clamp(1.75rem,3vw,3rem)] text-white">
      <header className="flex shrink-0 items-start justify-between gap-8">
        <div className="min-w-0">
          <p className="font-[family-name:var(--font-rajdhani)] text-[clamp(1.4rem,2vw,2.4rem)] font-semibold uppercase tracking-[0.45em] text-cyan-300">
            CAuDri-Challenge {year}
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

      <section className="mt-[clamp(1.75rem,3vw,3rem)] min-h-0 flex-1">
        {rankedTeams.length === 0 ? (
          <div className="flex h-full items-center justify-center rounded-3xl border border-dashed border-slate-700 bg-slate-950/40 text-center">
            <div>
              <p className="font-[family-name:var(--font-rajdhani)] text-[clamp(2rem,4vw,4rem)] font-bold text-slate-300">
                No teams for this discipline
              </p>
              <p className="mt-4 text-xl text-slate-500">
                Add participating teams in the admin console.
              </p>
            </div>
          </div>
        ) : (
          <div
            className="grid h-full gap-[clamp(0.75rem,1.4vh,1.25rem)]"
            style={{
              gridTemplateRows: `repeat(${slotCount}, minmax(0, 1fr))`,
            }}
          >
            {Array.from({ length: slotCount }).map((_, index) => {
              const rankedTeam = rankedTeams[index];

              if (!rankedTeam) {
                return <div key={`empty-slot-${index}`} />;
              }

              const revealed = index >= rankedTeams.length - revealedCount;
              const rank = index + 1;
              const placementLabel = getPlacementLabel(rank);
              const barWidthPercent = Math.max(
                5,
                (rankedTeam.score / maxScore) * 100,
              );
              const teamColor = rankedTeam.team.teamColor ?? "#22d3ee";

              return (
                <div key={`slot-${rankedTeam.team.id}`} className="min-h-0">
                  <AnimatePresence mode="wait" initial={false}>
                    {revealed ? (
                      <motion.article
                        key={`revealed-${rankedTeam.team.id}`}
                        initial={{ opacity: 0, y: 18 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 18 }}
                        transition={{ duration: 0.32, ease: "easeOut" }}
                        className="grid h-full min-h-0 grid-cols-[clamp(6.5rem,8vw,9rem)_minmax(0,1fr)] items-center gap-[clamp(1rem,2vw,1.75rem)]"
                      >
                        <motion.div
                          initial={{ opacity: 0, scale: 0.92 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.52, duration: 0.25 }}
                          className="flex h-full min-h-0 items-center justify-center"
                        >
                          <div className="flex aspect-square h-full max-h-[7.25rem] min-h-0 w-full max-w-[7.25rem] items-center justify-center rounded-3xl border border-slate-500/40 bg-slate-200/90 shadow-xl">
                            {rankedTeam.team.logoUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={rankedTeam.team.logoUrl}
                                alt={`${rankedTeam.team.name} logo`}
                                className="max-h-[82%] max-w-[82%] object-contain"
                                style={{
                                  transform: `scale(${
                                    rankedTeam.team.logoScale ?? 1
                                  })`,
                                }}
                              />
                            ) : (
                              <span className="font-[family-name:var(--font-rajdhani)] text-[clamp(1.9rem,2.7vw,3.1rem)] font-bold text-slate-900">
                                {getLogoFallback(rankedTeam.team.name)}
                              </span>
                            )}
                          </div>
                        </motion.div>

                        <div className="flex h-full min-h-0 flex-col justify-center">
                          <motion.p
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.48, duration: 0.24 }}
                            className="mb-[clamp(0.25rem,0.7vh,0.55rem)] font-[family-name:var(--font-rajdhani)] text-[clamp(1rem,1.55vw,1.6rem)] font-bold uppercase tracking-[0.25em] text-cyan-200/80"
                          >
                            {placementLabel}
                          </motion.p>

                          <div className="relative h-[clamp(2.75rem,5.2vh,4.15rem)] overflow-hidden rounded-2xl border border-slate-700 bg-slate-950/80 shadow-2xl">
                            <motion.div
                              className="absolute inset-y-0 left-0"
                              style={{ backgroundColor: teamColor }}
                              initial={{ width: "0%" }}
                              animate={{ width: `${barWidthPercent}%` }}
                              transition={{
                                duration: 0.85,
                                ease: "easeOut",
                                delay: 0.08,
                              }}
                            />

                            <div className="relative grid h-full grid-cols-[minmax(0,1fr)_clamp(5rem,9vw,9rem)] items-center gap-4 px-[clamp(1rem,2vw,1.75rem)]">
                              <motion.h2
                                initial={{ opacity: 0, x: -14 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.52, duration: 0.25 }}
                                className="truncate font-[family-name:var(--font-rajdhani)] text-[clamp(2rem,3vw,3.6rem)] font-bold leading-none text-slate-50 drop-shadow-lg"
                              >
                                {rankedTeam.team.name}
                              </motion.h2>

                              <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.7, duration: 0.22 }}
                                className="text-right font-mono"
                              >
                                <span className="text-[clamp(1.9rem,2.8vw,3.4rem)] font-bold tabular-nums leading-none text-slate-50 drop-shadow-lg">
                                  {rankedTeam.score}
                                </span>
                              </motion.div>
                            </div>
                          </div>
                        </div>
                      </motion.article>
                    ) : (
                      <div
                        key={`hidden-${rankedTeam.team.id}`}
                        className="h-full"
                      />
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
