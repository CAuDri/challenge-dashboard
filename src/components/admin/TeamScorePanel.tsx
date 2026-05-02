"use client";

import { useState } from "react";
import { disciplines, type DisciplineId, type Team } from "@/types/team";

function createEmptyScores() {
  return {
    freedrive: 0,
    obstacle_evasion: 0,
    navigation: 0,
  };
}

function createDemoTeam(index: number): Team {
  return {
    id: crypto.randomUUID(),
    name: `Team ${index}`,
    participatingDisciplines: disciplines.map((discipline) => discipline.id),
    scores: createEmptyScores(),
  };
}

export function TeamScorePanel() {
  const [teams, setTeams] = useState<Team[]>([
    {
      id: "demo-team-1",
      name: "KITcar",
      participatingDisciplines: disciplines.map((discipline) => discipline.id),
      scores: {
        freedrive: 0,
        obstacle_evasion: 0,
        navigation: 0,
      },
    },
  ]);

  function handleAddTeam() {
    setTeams((currentTeams) => [
      ...currentTeams,
      createDemoTeam(currentTeams.length + 1),
    ]);
  }

  function handleTeamNameChange(teamId: string, name: string) {
    setTeams((currentTeams) =>
      currentTeams.map((team) =>
        team.id === teamId
          ? {
              ...team,
              name,
            }
          : team,
      ),
    );
  }

  function handleScoreChange(
    teamId: string,
    disciplineId: DisciplineId,
    score: number,
  ) {
    setTeams((currentTeams) =>
      currentTeams.map((team) =>
        team.id === teamId
          ? {
              ...team,
              scores: {
                ...team.scores,
                [disciplineId]: score,
              },
            }
          : team,
      ),
    );
  }

  function handleParticipationChange(
    teamId: string,
    disciplineId: DisciplineId,
    participates: boolean,
  ) {
    setTeams((currentTeams) =>
      currentTeams.map((team) => {
        if (team.id !== teamId) {
          return team;
        }

        const nextDisciplines = participates
          ? [...new Set([...team.participatingDisciplines, disciplineId])]
          : team.participatingDisciplines.filter((id) => id !== disciplineId);

        return {
          ...team,
          participatingDisciplines: nextDisciplines,
        };
      }),
    );
  }

  return (
    <section className="flex h-full flex-col rounded-3xl border border-slate-800 bg-slate-900 text-slate-50 shadow-xl">
      <header className="flex items-center justify-between gap-4 border-b border-slate-800 px-5 py-4">
        <div>
          <h2 className="text-xl font-bold">Teams & Punkte</h2>
          <p className="mt-1 text-sm text-slate-400">
            Vorläufig lokal im Browser. Später persistent in der Datenbank.
          </p>
        </div>

        <button
          type="button"
          onClick={handleAddTeam}
          className="rounded-xl bg-cyan-400 px-4 py-2 font-semibold text-slate-950 transition hover:bg-cyan-300"
        >
          Team hinzufügen
        </button>
      </header>

      <div className="flex-1 space-y-4 overflow-auto p-5">
        {teams.map((team) => (
          <article
            key={team.id}
            className="rounded-2xl border border-slate-800 bg-slate-950 p-4"
          >
            <label className="block">
              <span className="text-xs uppercase tracking-[0.25em] text-slate-500">
                Teamname
              </span>
              <input
                type="text"
                value={team.name}
                onChange={(event) =>
                  handleTeamNameChange(team.id, event.target.value)
                }
                className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 font-semibold text-slate-50 outline-none transition focus:border-cyan-400"
              />
            </label>

            <div className="mt-4 space-y-3">
              {disciplines.map((discipline) => {
                const participates = team.participatingDisciplines.includes(
                  discipline.id,
                );

                return (
                  <div
                    key={discipline.id}
                    className="rounded-xl border border-slate-800 bg-slate-900 p-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <label className="flex items-center gap-2 text-sm font-medium text-slate-200">
                        <input
                          type="checkbox"
                          checked={participates}
                          onChange={(event) =>
                            handleParticipationChange(
                              team.id,
                              discipline.id,
                              event.target.checked,
                            )
                          }
                          className="h-4 w-4 accent-cyan-400"
                        />
                        {discipline.name}
                      </label>

                      <input
                        type="number"
                        min={0}
                        disabled={!participates}
                        value={team.scores[discipline.id]}
                        onChange={(event) =>
                          handleScoreChange(
                            team.id,
                            discipline.id,
                            Number(event.target.value),
                          )
                        }
                        className="w-24 rounded-lg border border-slate-700 bg-slate-950 px-2 py-1 text-right font-mono text-lg font-bold text-slate-50 disabled:cursor-not-allowed disabled:opacity-30"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
