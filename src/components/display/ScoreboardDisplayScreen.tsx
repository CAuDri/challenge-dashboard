"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { disciplines, type DisciplineId, type Team } from "@/types/team";
import type { ScreenDefinition } from "@/types/screen";

type ScoreboardDisplayScreenProps = {
  screen: ScreenDefinition;
  teams: Team[];
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

export function ScoreboardDisplayScreen({
  screen,
  teams,
}: ScoreboardDisplayScreenProps) {
  const disciplineId = screen.config?.scoreboard?.disciplineId;

  const rankedTeams = useMemo(() => {
    if (!disciplineId) {
      return [];
    }

    return getRankedTeams(teams, disciplineId);
  }, [disciplineId, teams]);

  const [revealedCount, setRevealedCount] = useState(0);

  useEffect(() => {
    setRevealedCount(0);
  }, [screen.id, disciplineId]);

  useEffect(() => {
    function revealNext() {
      setRevealedCount((currentCount) =>
        Math.min(currentCount + 1, rankedTeams.length),
      );
    }

    function revealPrevious() {
      setRevealedCount((currentCount) => Math.max(currentCount - 1, 0));
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
        setRevealedCount(0);
      }
    }

    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [rankedTeams.length]);

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
    <main className="flex h-full w-full flex-col overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950 px-16 py-12 text-white">
      <header className="flex shrink-0 items-start justify-between gap-10">
        <div>
          <p className="font-[family-name:var(--font-rajdhani)] text-[clamp(2rem,2.2vw,3rem)] font-semibold uppercase tracking-[0.45em] text-cyan-300">
            CAuDri-Challenge {year}
          </p>

          <h1 className="mt-5 font-[family-name:var(--font-rajdhani)] text-[clamp(4.5rem,5.2vw,7rem)] font-bold leading-none text-slate-50">
            {disciplineName}
          </h1>
        </div>

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/caudri_logo.svg"
          alt="CAuDri-Challenge"
          className="h-[clamp(8rem,10vw,11rem)] w-auto object-contain opacity-95"
        />
      </header>

      <section className="mt-12 min-h-0 flex-1">
        {rankedTeams.length === 0 ? (
          <div className="flex h-full items-center justify-center rounded-3xl border border-dashed border-slate-700 bg-slate-950/40 text-center">
            <div>
              <p className="font-[family-name:var(--font-rajdhani)] text-5xl font-bold text-slate-300">
                No teams for this discipline
              </p>
              <p className="mt-4 text-xl text-slate-500">
                Add participating teams in the admin console.
              </p>
            </div>
          </div>
        ) : (
          <div
            className="grid h-full gap-4"
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
                        initial={{ opacity: 0, y: 22 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 22 }}
                        transition={{ duration: 0.35, ease: "easeOut" }}
                        className="grid h-full min-h-0 grid-cols-[150px_minmax(0,1fr)] items-center gap-6"
                      >
                        <motion.div
                          initial={{ opacity: 0, scale: 0.92 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.55, duration: 0.28 }}
                          className="flex h-full items-center justify-center"
                        >
                          <div className="flex h-full max-h-[9rem] w-full items-center justify-center rounded-3xl border border-slate-500/40 bg-slate-200/90 shadow-xl">
                            {rankedTeam.team.logoUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={rankedTeam.team.logoUrl}
                                alt={`${rankedTeam.team.name} logo`}
                                className="max-h-[78%] max-w-[78%] object-contain"
                                style={{
                                  transform: `scale(${rankedTeam.team.logoScale ?? 1})`,
                                }}
                              />
                            ) : (
                              <span className="font-[family-name:var(--font-rajdhani)] text-[clamp(2.2rem,2.6vw,3.2rem)] font-bold text-slate-900">
                                {getLogoFallback(rankedTeam.team.name)}
                              </span>
                            )}
                          </div>
                        </motion.div>

                        <div className="flex h-full items-center">
                          <div className="relative h-full max-h-[9rem] w-full overflow-hidden rounded-3xl border border-slate-700 bg-slate-950/80 shadow-2xl">
                            <motion.div
                              className="absolute inset-y-0 left-0"
                              style={{ backgroundColor: teamColor }}
                              initial={{ width: "0%" }}
                              animate={{ width: `${barWidthPercent}%` }}
                              transition={{
                                duration: 0.9,
                                ease: "easeOut",
                                delay: 0.08,
                              }}
                            />

                            <div className="relative grid h-full grid-cols-[minmax(0,1fr)_170px] items-center gap-6 px-8">
                              <motion.h2
                                initial={{ opacity: 0, x: -14 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.55, duration: 0.28 }}
                                className="truncate font-[family-name:var(--font-rajdhani)] text-[clamp(3rem,3.4vw,4.75rem)] font-bold text-slate-50 drop-shadow-lg"
                              >
                                {rank}. {rankedTeam.team.name}
                              </motion.h2>

                              <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.72, duration: 0.22 }}
                                className="text-right font-mono"
                              >
                                <span className="text-[clamp(2.8rem,3.1vw,4.2rem)] font-bold tabular-nums text-slate-50 drop-shadow-lg">
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
