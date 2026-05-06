"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
  type TimerScreenConfig,
} from "@/types/screen";
import { uploadAsset } from "@/lib/realtime/assets";
import { readFileAsDataUrl } from "@/lib/files/readFileAsDataUrl";

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
    config: {
      image: {},
    },
  };
}

function createDefaultTimerConfig(): TimerScreenConfig {
  return {
    layout: "run_info",
    showHeader: true,
    showLogo: true,
    showTeam: true,
    showDiscipline: true,
    showPhase: true,
    showCustomTitle: false,
    customTitle: "",
    showInfoText: false,
    infoText: "",
    useTeamColorAccent: true,
    timerScale: 1,
    showMilliseconds: "during_running",
  };
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
      config: screen.config,
    };
  }, [screen]);

  const [draft, setDraft] = useState<ScreenDraft>(initialDraft);
  const imageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let isMounted = true;

    if (open) {
      queueMicrotask(() => {
        if (isMounted) {
          setDraft(initialDraft);
        }
      });
    }

    return () => {
      isMounted = false;
    };
  }, [initialDraft, open]);

  const canSubmit = draft.name.trim().length > 0;

  function handleTypeChange(type: ScreenType) {
    setDraft((currentDraft) => ({
      ...currentDraft,
      type,
      config:
        type === "image"
          ? {
              ...currentDraft.config,
              image: currentDraft.config?.image ?? {},
            }
          : type === "timer"
            ? {
                ...currentDraft.config,
                timer: currentDraft.config?.timer ?? createDefaultTimerConfig(),
              }
            : currentDraft.config,
    }));
  }

  async function handleImageFileChange(file: File | undefined) {
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
        prefix: "screen-image",
      });

      setDraft((currentDraft) => ({
        ...currentDraft,
        config: {
          ...currentDraft.config,
          image: {
            ...currentDraft.config?.image,
            imageUrl: uploadedAsset.assetUrl,
            imageFileName: file.name,
          },
        },
      }));
    } catch (error) {
      console.error(error);
      window.alert("Failed to upload image.");
    }
  }

  function handleSubmit() {
    if (!canSubmit) {
      return;
    }

    onSubmit({
      ...draft,
      name: draft.name.trim(),
      description: draft.description.trim(),
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
              Description (Optional)
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
              placeholder="Optional note for the admin overview"
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

          {draft.type === "image" && (
            <div>
              <span className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
                Image File
              </span>

              <div className="mt-2 grid gap-4 rounded-2xl border border-slate-800 bg-slate-900 p-4 md:grid-cols-[minmax(0,1fr)_220px]">
                <div className="flex flex-col justify-center gap-3">
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/svg+xml,image/webp"
                    className="hidden"
                    onChange={(event) => {
                      void handleImageFileChange(event.target.files?.[0]);
                    }}
                  />

                  <button
                    type="button"
                    onClick={() => imageInputRef.current?.click()}
                    className="w-fit rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm font-semibold text-cyan-100 transition hover:border-cyan-300 hover:bg-cyan-400/20"
                  >
                    Choose Image
                  </button>

                  {draft.config?.image?.imageFileName && (
                    <p className="text-sm text-slate-400">
                      Selected:{" "}
                      <span className="font-medium text-slate-200">
                        {draft.config.image.imageFileName}
                      </span>
                    </p>
                  )}

                  {draft.config?.image?.imageUrl && (
                    <button
                      type="button"
                      onClick={() =>
                        setDraft((currentDraft) => ({
                          ...currentDraft,
                          config: {
                            ...currentDraft.config,
                            image: {
                              imageUrl: undefined,
                              imageFileName: undefined,
                            },
                          },
                        }))
                      }
                      className="w-fit text-sm font-semibold text-rose-300 transition hover:text-rose-200"
                    >
                      Remove image
                    </button>
                  )}

                  <p className="text-xs leading-5 text-slate-500">
                    Uploaded images are stored by the realtime server and
                    included in dashboard backups when referenced by a screen.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                  className="flex aspect-video items-center justify-center overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 transition hover:border-cyan-400/50 hover:bg-slate-900"
                  aria-label="Choose image file"
                >
                  {draft.config?.image?.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={draft.config.image.imageUrl}
                      alt=""
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <span className="text-center text-xs uppercase tracking-[0.2em] text-slate-600">
                      Click to choose image
                    </span>
                  )}
                </button>
              </div>
            </div>
          )}

          {draft.type === "timer" && (
            <div>
              <span className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
                Timer Screen Configuration
              </span>

              <div className="mt-2 grid gap-4 rounded-2xl border border-slate-800 bg-slate-900 p-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                    <span className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
                      Layout
                    </span>

                    <select
                      value={draft.config?.timer?.layout ?? "run_info"}
                      onChange={(event) =>
                        setDraft((currentDraft) => ({
                          ...currentDraft,
                          config: {
                            ...currentDraft.config,
                            timer: {
                              ...(currentDraft.config?.timer ??
                                createDefaultTimerConfig()),
                              layout: event.target.value as
                                | "timer_only"
                                | "run_info",
                            },
                          },
                        }))
                      }
                      className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 outline-none transition focus:border-cyan-400"
                    >
                      <option value="timer_only">Timer only</option>
                      <option value="run_info">Run info</option>
                    </select>
                  </label>

                  <label className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-950 p-4 text-sm text-slate-300">
                    <input
                      type="checkbox"
                      checked={draft.config?.timer?.useTeamColorAccent ?? true}
                      onChange={(event) =>
                        setDraft((currentDraft) => ({
                          ...currentDraft,
                          config: {
                            ...currentDraft.config,
                            timer: {
                              ...(currentDraft.config?.timer ??
                                createDefaultTimerConfig()),
                              useTeamColorAccent: event.target.checked,
                            },
                          },
                        }))
                      }
                      className="h-4 w-4 accent-cyan-400"
                    />
                    <span>Use team color accent</span>
                  </label>
                </div>

                <label className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
                      Timer Size
                    </span>

                    <span className="font-mono text-sm text-slate-300">
                      {Math.round((draft.config?.timer?.timerScale ?? 1) * 100)}
                      %
                    </span>
                  </div>

                  <input
                    type="range"
                    min={0.7}
                    max={1.25}
                    step={0.05}
                    value={draft.config?.timer?.timerScale ?? 1}
                    onChange={(event) =>
                      setDraft((currentDraft) => ({
                        ...currentDraft,
                        config: {
                          ...currentDraft.config,
                          timer: {
                            ...(currentDraft.config?.timer ??
                              createDefaultTimerConfig()),
                            timerScale: Number(event.target.value),
                          },
                        },
                      }))
                    }
                    className="mt-3 w-full accent-cyan-400"
                  />
                </label>

                <label className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                  <span className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
                    Show Milliseconds
                  </span>

                  <select
                    value={
                      draft.config?.timer?.showMilliseconds ?? "during_running"
                    }
                    onChange={(event) =>
                      setDraft((currentDraft) => ({
                        ...currentDraft,
                        config: {
                          ...currentDraft.config,
                          timer: {
                            ...(currentDraft.config?.timer ??
                              createDefaultTimerConfig()),
                            showMilliseconds: event.target.value as
                              | "always"
                              | "during_running"
                              | "never",
                          },
                        },
                      }))
                    }
                    className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 outline-none transition focus:border-cyan-400"
                  >
                    <option value="always">Always</option>
                    <option value="during_running">During Running Phase</option>
                    <option value="never">Never</option>
                  </select>
                </label>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {[
                    ["showHeader", "Header"],
                    ["showLogo", "CAuDri Logo"],
                    ["showTeam", "Team"],
                    ["showDiscipline", "Discipline"],
                    ["showPhase", "Phase"],
                    ["showCustomTitle", "Custom Title"],
                    ["showInfoText", "Info Text"],
                  ].map(([key, label]) => (
                    <label
                      key={key}
                      className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-300"
                    >
                      <input
                        type="checkbox"
                        checked={
                          Boolean(
                            draft.config?.timer?.[
                              key as keyof NonNullable<
                                typeof draft.config
                              >["timer"]
                            ],
                          ) ?? false
                        }
                        onChange={(event) =>
                          setDraft((currentDraft) => ({
                            ...currentDraft,
                            config: {
                              ...currentDraft.config,
                              timer: {
                                ...(currentDraft.config?.timer ??
                                  createDefaultTimerConfig()),
                                [key]: event.target.checked,
                              },
                            },
                          }))
                        }
                        className="h-4 w-4 accent-cyan-400"
                      />

                      <span>{label}</span>
                    </label>
                  ))}
                </div>

                {(draft.config?.timer?.showCustomTitle ?? false) && (
                  <label className="block">
                    <span className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
                      Custom Title
                    </span>

                    <input
                      type="text"
                      value={draft.config?.timer?.customTitle ?? ""}
                      onChange={(event) =>
                        setDraft((currentDraft) => ({
                          ...currentDraft,
                          config: {
                            ...currentDraft.config,
                            timer: {
                              ...(currentDraft.config?.timer ??
                                createDefaultTimerConfig()),
                              customTitle: event.target.value,
                            },
                          },
                        }))
                      }
                      className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-lg font-semibold text-slate-50 outline-none transition focus:border-cyan-400"
                      placeholder="Custom title"
                    />
                  </label>
                )}

                {(draft.config?.timer?.showInfoText ?? false) && (
                  <label className="block">
                    <span className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
                      Info Text
                    </span>

                    <textarea
                      value={draft.config?.timer?.infoText ?? ""}
                      onChange={(event) =>
                        setDraft((currentDraft) => ({
                          ...currentDraft,
                          config: {
                            ...currentDraft.config,
                            timer: {
                              ...(currentDraft.config?.timer ??
                                createDefaultTimerConfig()),
                              infoText: event.target.value,
                            },
                          },
                        }))
                      }
                      className="mt-2 min-h-20 w-full resize-none rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm leading-6 text-slate-50 outline-none transition focus:border-cyan-400"
                      placeholder="Optional information shown below the timer"
                    />
                  </label>
                )}
              </div>
            </div>
          )}

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
