"use client";

import { useState } from "react";
import { TeamCard } from "@/components/admin/TeamCard";
import { TeamFormDialog } from "@/components/admin/TeamFormDialog";
import { useAdminState } from "@/providers/AdminStateProvider";
import type { Team, TeamDraft } from "@/types/team";

export function TeamScorePanel() {
  const { teams, addTeam, updateTeam, deleteTeam, updateTeamScore } =
    useAdminState();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [teamBeingEdited, setTeamBeingEdited] = useState<Team | undefined>();

  const dialogMode = teamBeingEdited ? "edit" : "create";

  function handleAddTeamClick() {
    setTeamBeingEdited(undefined);
    setDialogOpen(true);
  }

  function handleEditTeam(team: Team) {
    setTeamBeingEdited(team);
    setDialogOpen(true);
  }

  function handleSubmitTeam(teamDraft: TeamDraft) {
    if (teamBeingEdited) {
      updateTeam(teamBeingEdited.id, teamDraft);
      return;
    }

    addTeam(teamDraft);
  }

  function handleDialogOpenChange(open: boolean) {
    setDialogOpen(open);

    if (!open) {
      setTeamBeingEdited(undefined);
    }
  }

  return (
    <section className="flex h-full min-h-0 flex-col overflow-hidden bg-slate-900 text-slate-50">
      <header className="flex items-center justify-between gap-4 border-b border-slate-800 px-5 py-4">
        <div>
          <h2 className="text-xl font-bold">Teams & Scores</h2>
          <p className="mt-1 text-sm text-slate-400">
            Configure teams through the dialog. Enter scores directly on each
            team card.
          </p>
        </div>

        <button
          type="button"
          onClick={handleAddTeamClick}
          className="rounded-xl bg-cyan-400 px-4 py-2 font-semibold text-slate-950 transition hover:bg-cyan-300"
        >
          Add Team
        </button>
      </header>

      <div className="flex-1 overflow-auto p-5">
        {teams.length === 0 ? (
          <div className="flex h-full min-h-80 items-center justify-center rounded-3xl border border-dashed border-slate-700 bg-slate-950/40 text-center">
            <div>
              <p className="font-[family-name:var(--font-rajdhani)] text-3xl font-bold text-slate-300">
                No teams yet
              </p>
              <p className="mt-2 text-sm text-slate-500">
                Add the first team to start entering scores.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
            {teams.map((team) => (
              <TeamCard
                key={team.id}
                team={team}
                onEdit={handleEditTeam}
                onDelete={deleteTeam}
                onScoreChange={updateTeamScore}
              />
            ))}
          </div>
        )}
      </div>

      <TeamFormDialog
        open={dialogOpen}
        mode={dialogMode}
        team={teamBeingEdited}
        onOpenChange={handleDialogOpenChange}
        onSubmit={handleSubmitTeam}
      />
    </section>
  );
}
