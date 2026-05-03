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
        return a.score - b.score;
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

  const visibleTeams = rankedTeams.slice(0, revealedCount);
  const disciplineName = getDisciplineName(disciplineId);
  const year = getCurrentYear();
  const allRevealed = revealedCount >= rankedTeams.length;

  return (
    <main className="flex h-full w-full flex-col overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950 px-16 py-12 text-white">
      <header className="flex items-start justify-between gap-8">
        <div>
          <p className="font-[family-name:var(--font-rajdhani)] text-3xl font-semibold uppercase tracking-[0.45em] text-cyan-300">
            CAuDri-Challenge {year}
          </p>

          <h1 className="mt-4 font-[family-name:var(--font-rajdhani)] text-7xl font-bold leading-none text-slate-50">
            {disciplineName}
          </h1>
        </div>

        <div className="text-right font-[family-name:var(--font-rajdhani)]">
          <p className="text-lg uppercase tracking-[0.3em] text-slate-500">
            Results Reveal
          </p>
          <p className="mt-2 text-4xl font-bold text-cyan-100">
            {revealedCount}/{rankedTeams.length}
          </p>
        </div>
      </header>

      <section className="mt-12 flex min-h-0 flex-1 flex-col justify-end gap-4">
        {rankedTeams.length === 0 ? (
          <div className="flex flex-1 items-center justify-center rounded-3xl border border-dashed border-slate-700 bg-slate-950/40 text-center">
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
          <div className="flex flex-col-reverse gap-4">
            <AnimatePresence initial={false}>
              {visibleTeams.map((rankedTeam, index) => {
                const rankFromBottom = index + 1;
                const actualRank = rankedTeams.length - index;
                const barWidthPercent = Math.max(
                  6,
                  (rankedTeam.score / maxScore) * 100,
                );

                return (
                  <motion.article
                    key={rankedTeam.team.id}
                    initial={{ opacity: 0, y: 40, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 20, scale: 0.98 }}
                    transition={{ duration: 0.45, ease: "easeOut" }}
                    className={`relative overflow-hidden rounded-3xl border bg-slate-950/80 p-5 shadow-2xl ${
                      allRevealed && index === visibleTeams.length - 1
                        ? "border-cyan-300 shadow-cyan-950/60"
                        : "border-slate-700"
                    }`}
                  >
                    <motion.div
                      className="absolute inset-y-0 left-0 bg-cyan-400/15"
                      initial={{ width: "0%" }}
                      animate={{ width: `${barWidthPercent}%` }}
                      transition={{
                        duration: 0.9,
                        ease: "easeOut",
                        delay: 0.1,
                      }}
                    />

                    <div className="relative grid grid-cols-[110px_minmax(0,1fr)_180px] items-center gap-6">
                      <div className="flex h-24 w-24 items-center justify-center rounded-2xl border border-slate-700 bg-slate-900">
                        {rankedTeam.team.logoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={rankedTeam.team.logoUrl}
                            alt={`${rankedTeam.team.name} logo`}
                            className="max-h-16 max-w-16 object-contain"
                            style={{
                              transform: `scale(${
                                rankedTeam.team.logoScale ?? 1
                              })`,
                            }}
                          />
                        ) : (
                          <span className="font-[family-name:var(--font-rajdhani)] text-4xl font-bold text-cyan-300">
                            {getLogoFallback(rankedTeam.team.name)}
                          </span>
                        )}
                      </div>

                      <div className="min-w-0">
                        <p className="font-[family-name:var(--font-rajdhani)] text-lg font-bold uppercase tracking-[0.25em] text-slate-500">
                          Rank {actualRank}
                        </p>

                        <motion.h2
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.45, duration: 0.35 }}
                          className="truncate font-[family-name:var(--font-rajdhani)] text-5xl font-bold text-slate-50"
                        >
                          {rankedTeam.team.name}
                        </motion.h2>
                      </div>

                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.65, duration: 0.35 }}
                        className="text-right font-mono"
                      >
                        <p className="text-5xl font-bold tabular-nums text-cyan-100">
                          {rankedTeam.score}
                        </p>
                        <p className="mt-1 text-sm uppercase tracking-[0.25em] text-slate-500">
                          points
                        </p>
                      </motion.div>
                    </div>
                  </motion.article>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </section>

      {rankedTeams.length > 0 && revealedCount === 0 && (
        <footer className="mt-8 text-center">
          <p className="font-[family-name:var(--font-rajdhani)] text-3xl font-semibold uppercase tracking-[0.3em] text-slate-400">
            Click to reveal results
          </p>
        </footer>
      )}

      {rankedTeams.length > 0 && revealedCount > 0 && !allRevealed && (
        <footer className="mt-8 text-center">
          <p className="font-[family-name:var(--font-rajdhani)] text-2xl font-semibold uppercase tracking-[0.3em] text-slate-500">
            Click to reveal next result
          </p>
        </footer>
      )}

      {rankedTeams.length > 0 && allRevealed && (
        <footer className="mt-8 text-center">
          <p className="font-[family-name:var(--font-rajdhani)] text-4xl font-bold uppercase tracking-[0.3em] text-cyan-200">
            Winner revealed
          </p>
        </footer>
      )}
    </main>
  );
}
