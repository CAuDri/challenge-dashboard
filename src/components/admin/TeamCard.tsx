"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { disciplines, type DisciplineId, type Team } from "@/types/team";

type TeamCardProps = {
  team: Team;
  onEdit: (team: Team) => void;
  onDelete: (teamId: string) => void;
  onScoreChange: (
    teamId: string,
    disciplineId: DisciplineId,
    score: number,
  ) => void;
};

export function TeamCard({
  team,
  onEdit,
  onDelete,
  onScoreChange,
}: TeamCardProps) {
  const participatingDisciplines = disciplines.filter((discipline) =>
    team.participatingDisciplines.includes(discipline.id),
  );

  function handleDelete() {
    const confirmed = window.confirm(`Delete team "${team.name}"?`);

    if (!confirmed) {
      return;
    }

    onDelete(team.id);
  }

  return (
    <article className="relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 p-5 shadow-lg">
      <div className="absolute right-4 top-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-xl font-bold text-slate-300 transition hover:border-cyan-400/50 hover:text-cyan-100"
              aria-label={`Open actions for ${team.name}`}
            >
              ⋯
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="end"
            className="border-slate-800 bg-slate-950 text-slate-100"
          >
            <DropdownMenuItem
              onClick={() => onEdit(team)}
              className="cursor-pointer focus:bg-slate-800 focus:text-cyan-100"
            >
              Edit Team
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={handleDelete}
              className="cursor-pointer text-rose-300 focus:bg-rose-950 focus:text-rose-100"
            >
              Delete Team
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <header className="flex items-center gap-4 pr-12">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border border-slate-800 bg-slate-900">
          {team.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={team.logoUrl}
              alt={`${team.name} logo`}
              className="max-h-14 max-w-14 object-contain"
              style={{ transform: `scale(${team.logoScale ?? 1})` }}
            />
          ) : (
            <span className="font-[family-name:var(--font-rajdhani)] text-3xl font-bold text-cyan-300">
              {team.name.slice(0, 2).toUpperCase()}
            </span>
          )}
        </div>

        <div className="min-w-0">
          <h3 className="truncate font-[family-name:var(--font-rajdhani)] text-3xl font-bold text-slate-50">
            {team.name}
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            {participatingDisciplines.length} discipline
            {participatingDisciplines.length === 1 ? "" : "s"}
          </p>
        </div>

        <div
          className="absolute inset-x-0 top-0 h-1"
          style={{ backgroundColor: team.teamColor ?? "#22d3ee" }}
        />
      </header>

      <div className="mt-5 grid gap-3">
        {participatingDisciplines.length === 0 ? (
          <div className="mt-5 rounded-2xl border border-dashed border-slate-800 bg-slate-900/60 px-4 py-5 text-sm text-slate-500">
            No disciplines selected for this team.
          </div>
        ) : (
          <div className="mt-5 grid gap-3">
            {participatingDisciplines.map((discipline) => (
              <label
                key={discipline.id}
                className="grid grid-cols-[minmax(0,1fr)_120px] items-center gap-4 rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3"
              >
                <span className="font-medium text-slate-200">
                  {discipline.name}
                </span>

                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={team.scores[discipline.id] ?? 0}
                  onFocus={(event) => event.target.select()}
                  onClick={(event) => event.currentTarget.select()}
                  onChange={(event) => {
                    const sanitizedValue = event.target.value.replace(
                      /\D/g,
                      "",
                    );
                    const score =
                      sanitizedValue === "" ? 0 : Number(sanitizedValue);

                    onScoreChange(team.id, discipline.id, score);
                  }}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-right font-mono text-xl font-bold text-cyan-100 outline-none transition focus:border-cyan-400"
                />
              </label>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}
