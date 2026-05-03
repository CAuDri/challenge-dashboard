"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  disciplines,
  type DisciplineId,
  type Team,
  type TeamDraft,
} from "@/types/team";

type TeamFormDialogProps = {
  open: boolean;
  mode: "create" | "edit";
  team?: Team;
  onOpenChange: (open: boolean) => void;
  onSubmit: (teamDraft: TeamDraft) => void;
};

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result !== "string") {
        reject(new Error("Failed to read file."));
        return;
      }

      resolve(reader.result);
    };

    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function createDefaultDraft(): TeamDraft {
  return {
    name: "",
    logoScale: 1,
    participatingDisciplines: disciplines.map((discipline) => discipline.id),
  };
}

export function TeamFormDialog({
  open,
  mode,
  team,
  onOpenChange,
  onSubmit,
}: TeamFormDialogProps) {
  const initialDraft = useMemo<TeamDraft>(() => {
    if (!team) {
      return createDefaultDraft();
    }

    return {
      name: team.name,
      logoUrl: team.logoUrl,
      logoFileName: team.logoFileName,
      logoScale: team.logoScale ?? 1,
      participatingDisciplines: team.participatingDisciplines,
    };
  }, [team]);

  const [draft, setDraft] = useState<TeamDraft>(initialDraft);

  useEffect(() => {
    if (open) {
      setDraft(initialDraft);
    }
  }, [initialDraft, open]);

  const canSubmit = draft.name.trim().length > 0;

  async function handleLogoChange(file: File | undefined) {
    if (!file) {
      return;
    }

    const allowedTypes = ["image/svg+xml", "image/png"];

    if (!allowedTypes.includes(file.type)) {
      window.alert("Please select a transparent SVG or PNG file.");
      return;
    }

    const logoUrl = await readFileAsDataUrl(file);

    setDraft((currentDraft) => ({
      ...currentDraft,
      logoUrl,
      logoFileName: file.name,
    }));
  }

  function handleDisciplineToggle(
    disciplineId: DisciplineId,
    checked: boolean,
  ) {
    setDraft((currentDraft) => {
      const participatingDisciplines = checked
        ? [...new Set([...currentDraft.participatingDisciplines, disciplineId])]
        : currentDraft.participatingDisciplines.filter(
            (id) => id !== disciplineId,
          );

      return {
        ...currentDraft,
        participatingDisciplines,
      };
    });
  }

  function handleSubmit() {
    if (!canSubmit) {
      return;
    }

    onSubmit({
      ...draft,
      name: draft.name.trim(),
    });

    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-slate-800 bg-slate-950 text-slate-50 sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-[family-name:var(--font-rajdhani)] text-3xl font-bold uppercase tracking-wide text-cyan-100">
            {mode === "create" ? "Add Team" : "Edit Team"}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-6 pt-2">
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
              Team Name
            </span>
            <input
              type="text"
              value={draft.name}
              onChange={(event) =>
                setDraft((currentDraft) => ({
                  ...currentDraft,
                  name: event.target.value,
                }))
              }
              className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-lg font-semibold text-slate-50 outline-none transition focus:border-cyan-400"
              placeholder="Enter team name"
            />
          </label>

          <div>
            <span className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
              Team Logo
            </span>

            <div className="mt-2 grid gap-4 rounded-2xl border border-slate-800 bg-slate-900 p-4 sm:grid-cols-[120px_minmax(0,1fr)]">
              <div className="flex h-28 w-28 items-center justify-center rounded-2xl border border-slate-700 bg-slate-950">
                {draft.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={draft.logoUrl}
                    alt=""
                    className="max-h-20 max-w-20 object-contain"
                    style={{ transform: `scale(${draft.logoScale ?? 1})` }}
                  />
                ) : (
                  <span className="text-xs uppercase tracking-[0.2em] text-slate-600">
                    No Logo
                  </span>
                )}
              </div>

              <div className="flex flex-col justify-center gap-3">
                <input
                  type="file"
                  accept="image/svg+xml,image/png"
                  onChange={(event) =>
                    handleLogoChange(event.target.files?.[0])
                  }
                  className="block w-full text-sm text-slate-400 file:mr-4 file:rounded-xl file:border-0 file:bg-cyan-400 file:px-4 file:py-2 file:font-semibold file:text-slate-950 hover:file:bg-cyan-300"
                />

                {draft.logoFileName && (
                  <p className="text-sm text-slate-400">
                    Selected:{" "}
                    <span className="font-medium text-slate-200">
                      {draft.logoFileName}
                    </span>
                  </p>
                )}

                {draft.logoUrl && (
                  <button
                    type="button"
                    onClick={() =>
                      setDraft((currentDraft) => ({
                        ...currentDraft,
                        logoUrl: undefined,
                        logoFileName: undefined,
                        logoScale: 1,
                      }))
                    }
                    className="w-fit text-sm font-semibold text-rose-300 transition hover:text-rose-200"
                  >
                    Remove logo
                  </button>
                )}

                {draft.logoUrl && (
                  <label className="mt-2 block">
                    <div className="flex items-center justify-between gap-4 text-sm text-slate-400">
                      <span>Logo Scale</span>
                      <span className="font-mono text-slate-300">
                        {Math.round((draft.logoScale ?? 1) * 100)}%
                      </span>
                    </div>

                    <input
                      type="range"
                      min={0.5}
                      max={1.5}
                      step={0.05}
                      value={draft.logoScale ?? 1}
                      onChange={(event) =>
                        setDraft((currentDraft) => ({
                          ...currentDraft,
                          logoScale: Number(event.target.value),
                        }))
                      }
                      className="mt-2 w-full accent-cyan-400"
                    />
                  </label>
                )}
              </div>
            </div>
          </div>

          <div>
            <span className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
              Participating Disciplines
            </span>

            <div className="mt-2 grid gap-3 sm:grid-cols-3">
              {disciplines.map((discipline) => {
                const checked = draft.participatingDisciplines.includes(
                  discipline.id,
                );

                return (
                  <label
                    key={discipline.id}
                    className={`flex min-h-24 cursor-pointer items-center rounded-2xl border p-4 transition ${
                      checked
                        ? "border-cyan-400/70 bg-cyan-400/10 text-cyan-100"
                        : "border-slate-800 bg-slate-900 text-slate-400 hover:border-cyan-400/40"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(event) =>
                        handleDisciplineToggle(
                          discipline.id,
                          event.target.checked,
                        )
                      }
                      className="mr-3 h-4 w-4 accent-cyan-400"
                    />
                    <span className="font-semibold leading-5">
                      {discipline.name}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-800 pt-5">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="rounded-xl border border-slate-700 bg-slate-900 px-5 py-2 font-semibold text-slate-200 transition hover:border-slate-500"
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={!canSubmit}
              onClick={handleSubmit}
              className="rounded-xl bg-cyan-400 px-5 py-2 font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-30"
            >
              {mode === "create" ? "Create Team" : "Save Changes"}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
