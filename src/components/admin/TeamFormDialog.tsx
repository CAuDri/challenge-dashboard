"use client";

import { useEffect, useMemo, useState, useRef } from "react";
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
import { PencilLine, Pipette } from "lucide-react";
import { uploadAsset } from "@/lib/realtime/assets";
import { readFileAsDataUrl } from "@/lib/files/readFileAsDataUrl";

type TeamFormDialogProps = {
  open: boolean;
  mode: "create" | "edit";
  team?: Team;
  onOpenChange: (open: boolean) => void;
  onSubmit: (teamDraft: TeamDraft) => void;
};

type EyeDropperResult = {
  sRGBHex: string;
};

type EyeDropperConstructor = new () => {
  open: () => Promise<EyeDropperResult>;
};

type WindowWithEyeDropper = Window & {
  EyeDropper?: EyeDropperConstructor;
};

function isValidHexColor(value: string) {
  return /^#[0-9A-Fa-f]{6}$/.test(value);
}

function createDefaultDraft(): TeamDraft {
  return {
    name: "",
    logoScale: 1,
    teamColor: "#22d3ee",
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
      teamColor: team.teamColor ?? "#22d3ee",
      participatingDisciplines: team.participatingDisciplines,
    };
  }, [team]);

  const [draft, setDraft] = useState<TeamDraft>(initialDraft);

  const colorInputRef = useRef<HTMLInputElement | null>(null);

  const eyeDropperSupported =
    typeof window !== "undefined" &&
    "EyeDropper" in window &&
    typeof (window as WindowWithEyeDropper).EyeDropper === "function";

  async function handlePickColorFromScreen() {
    const EyeDropper = (window as WindowWithEyeDropper).EyeDropper;

    if (!EyeDropper) {
      return;
    }

    try {
      const result = await new EyeDropper().open();

      setDraft((currentDraft) => ({
        ...currentDraft,
        teamColor: result.sRGBHex,
      }));
    } catch {
      // User cancelled the picker.
    }
  }

  useEffect(() => {
    if (open) {
      setDraft(initialDraft);
    }
  }, [initialDraft, open]);

  const canSubmit = draft.name.trim().length > 0;

  async function handleLogoFileChange(file: File | undefined) {
    if (!file) {
      return;
    }

    if (
      !["image/png", "image/jpeg", "image/svg+xml", "image/webp"].includes(
        file.type,
      )
    ) {
      window.alert("Please select a PNG, JPG, SVG or WebP image.");
      return;
    }

    try {
      const dataUrl = await readFileAsDataUrl(file);

      const uploadedAsset = await uploadAsset({
        fileName: file.name,
        mimeType: file.type,
        dataUrl,
        prefix: "team-logo",
      });

      setDraft((currentDraft) => ({
        ...currentDraft,
        logoUrl: uploadedAsset.assetUrl,
        logoFileName: file.name,
      }));
    } catch (error) {
      console.error(error);
      window.alert("Failed to upload team logo.");
    }
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
                  accept="image/png,image/jpeg,image/svg+xml,image/webp"
                  onChange={(event) => {
                    void handleLogoFileChange(event.target.files?.[0]);
                  }}
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
              Team Color
            </span>

            <div className="mt-2 grid gap-3 rounded-2xl border border-slate-800 bg-slate-900 p-4 md:grid-cols-[84px_minmax(0,1fr)_170px]">
              <div className="flex flex-col items-center gap-2">
                {/* <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-500">
                  Edit
                </span> */}

                <button
                  type="button"
                  onClick={() => colorInputRef.current?.click()}
                  className="group relative flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-700 transition hover:border-cyan-400"
                  style={{ backgroundColor: draft.teamColor ?? "#22d3ee" }}
                  title="Open color picker"
                >
                  <span className="absolute right-1.5 top-1.5 rounded-md bg-slate-950/70 p-1 text-slate-100 transition group-hover:bg-slate-950">
                    <PencilLine className="h-3.5 w-3.5" />
                  </span>
                </button>

                <input
                  ref={colorInputRef}
                  type="color"
                  value={
                    isValidHexColor(draft.teamColor ?? "")
                      ? draft.teamColor
                      : "#22d3ee"
                  }
                  onChange={(event) =>
                    setDraft((currentDraft) => ({
                      ...currentDraft,
                      teamColor: event.target.value,
                    }))
                  }
                  className="sr-only"
                  aria-label="Pick team color"
                />
              </div>

              <div className="flex flex-col justify-center gap-2">
                <span className="text-xs uppercase tracking-[0.25em] text-slate-500">
                  Hex
                </span>

                <input
                  type="text"
                  value={draft.teamColor ?? "#22d3ee"}
                  onChange={(event) =>
                    setDraft((currentDraft) => ({
                      ...currentDraft,
                      teamColor: event.target.value,
                    }))
                  }
                  onBlur={() =>
                    setDraft((currentDraft) => ({
                      ...currentDraft,
                      teamColor: isValidHexColor(currentDraft.teamColor ?? "")
                        ? currentDraft.teamColor
                        : "#22d3ee",
                    }))
                  }
                  className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-sm text-slate-100 outline-none transition focus:border-cyan-400"
                  placeholder="#22d3ee"
                />
              </div>

              <button
                type="button"
                disabled={!eyeDropperSupported}
                onClick={handlePickColorFromScreen}
                className="flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-950 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-cyan-400 hover:text-cyan-100 disabled:cursor-not-allowed disabled:opacity-30"
                title={
                  eyeDropperSupported
                    ? "Pick a color from the screen"
                    : "EyeDropper is not supported in this browser/context"
                }
              >
                <Pipette className="h-4 w-4" />
                <span>Pick Color</span>
              </button>
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
