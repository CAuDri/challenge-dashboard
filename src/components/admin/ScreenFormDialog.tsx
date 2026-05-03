"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  screenTypes,
  type ScreenDefinition,
  type ScreenDraft,
  type ScreenType,
} from "@/types/screen";

type ScreenFormDialogProps = {
  open: boolean;
  mode: "create" | "edit";
  screen?: ScreenDefinition;
  onOpenChange: (open: boolean) => void;
  onSubmit: (screenDraft: ScreenDraft) => void;
};

function createDefaultDraft(): ScreenDraft {
  return {
    name: "",
    description: "",
    type: "image",
    thumbnailLabel: "Image",
  };
}

function getDefaultThumbnailLabel(type: ScreenType) {
  const labels: Record<ScreenType, string> = {
    image: "Image",
    pdf: "PDF",
    camera: "Cam",
    timer: "Timer",
    scoreboard: "Scores",
  };

  return labels[type];
}

export function ScreenFormDialog({
  open,
  mode,
  screen,
  onOpenChange,
  onSubmit,
}: ScreenFormDialogProps) {
  const initialDraft = useMemo<ScreenDraft>(() => {
    if (!screen) {
      return createDefaultDraft();
    }

    return {
      name: screen.name,
      description: screen.description,
      type: screen.type,
      thumbnailLabel: screen.thumbnailLabel,
    };
  }, [screen]);

  const [draft, setDraft] = useState<ScreenDraft>(initialDraft);

  useEffect(() => {
    if (open) {
      setDraft(initialDraft);
    }
  }, [initialDraft, open]);

  const canSubmit =
    draft.name.trim().length > 0 &&
    draft.description.trim().length > 0 &&
    draft.thumbnailLabel.trim().length > 0;

  function handleTypeChange(type: ScreenType) {
    setDraft((currentDraft) => ({
      ...currentDraft,
      type,
      thumbnailLabel: getDefaultThumbnailLabel(type),
    }));
  }

  function handleSubmit() {
    if (!canSubmit) {
      return;
    }

    onSubmit({
      ...draft,
      name: draft.name.trim(),
      description: draft.description.trim(),
      thumbnailLabel: draft.thumbnailLabel.trim(),
    });

    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-slate-800 bg-slate-950 text-slate-50 sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-[family-name:var(--font-rajdhani)] text-3xl font-bold uppercase tracking-wide text-cyan-100">
            {mode === "create" ? "Add Screen" : "Edit Screen"}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-6 pt-2">
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
              Screen Name
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
              placeholder="Enter screen name"
            />
          </label>

          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
              Description
            </span>
            <textarea
              value={draft.description}
              onChange={(event) =>
                setDraft((currentDraft) => ({
                  ...currentDraft,
                  description: event.target.value,
                }))
              }
              className="mt-2 min-h-24 w-full resize-none rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm leading-6 text-slate-50 outline-none transition focus:border-cyan-400"
              placeholder="Describe what this screen is used for"
            />
          </label>

          <div>
            <span className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
              Screen Type
            </span>

            <div className="mt-2 grid gap-3 sm:grid-cols-2">
              {screenTypes.map((screenType) => {
                const checked = draft.type === screenType.id;

                return (
                  <label
                    key={screenType.id}
                    className={`flex cursor-pointer rounded-2xl border p-4 transition ${
                      checked
                        ? "border-cyan-400/70 bg-cyan-400/10 text-cyan-100"
                        : "border-slate-800 bg-slate-900 text-slate-400 hover:border-cyan-400/40"
                    }`}
                  >
                    <input
                      type="radio"
                      name="screen-type"
                      checked={checked}
                      onChange={() => handleTypeChange(screenType.id)}
                      className="mr-3 mt-1 h-4 w-4 accent-cyan-400"
                    />

                    <span>
                      <span className="block font-semibold text-slate-100">
                        {screenType.name}
                      </span>
                      <span className="mt-1 block text-sm leading-5 text-slate-500">
                        {screenType.description}
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
              Thumbnail Label
            </span>
            <input
              type="text"
              value={draft.thumbnailLabel}
              onChange={(event) =>
                setDraft((currentDraft) => ({
                  ...currentDraft,
                  thumbnailLabel: event.target.value,
                }))
              }
              className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-lg font-semibold text-slate-50 outline-none transition focus:border-cyan-400"
              placeholder="Short preview label"
            />
          </label>

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
              {mode === "create" ? "Create Screen" : "Save Changes"}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
