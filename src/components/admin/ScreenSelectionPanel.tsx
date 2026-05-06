"use client";

import { useState } from "react";
import { ScreenCard } from "@/components/admin/ScreenCard";
import { ScreenFormDialog } from "@/components/admin/ScreenFormDialog";
import { useAdminState } from "@/providers/AdminStateProvider";
import {
  screenTypes,
  type ScreenDefinition,
  type ScreenDraft,
  type ScreenType,
} from "@/types/screen";
import { demoScreens } from "@/config/demoScreens";
import { Clock3, FileText, Image, Plus, Trophy, Video } from "lucide-react";
import type { ComponentType, SVGProps } from "react";

const builtInScreenIds = new Set(demoScreens.map((screen) => screen.id));
const screenSectionOrder: ScreenType[] = [
  "image",
  "timer",
  "scoreboard",
  "pdf",
  "camera",
];

const screenSectionIcons: Record<
  ScreenType,
  ComponentType<SVGProps<SVGSVGElement>>
> = {
  image: Image,
  timer: Clock3,
  scoreboard: Trophy,
  pdf: FileText,
  camera: Video,
};

function groupScreensByType(screens: ScreenDefinition[]) {
  return screenSectionOrder
    .map((screenTypeId) =>
      screenTypes.find((screenType) => screenType.id === screenTypeId),
    )
    .filter((screenType) => screenType !== undefined)
    .map((screenType) => ({
      ...screenType,
      screens: screens.filter((screen) => screen.type === screenType.id),
    }))
    .filter((group) => group.screens.length > 0);
}

function sortScreensForSection(screens: ScreenDefinition[]) {
  return [...screens].sort((a, b) => {
    const builtInSort =
      Number(builtInScreenIds.has(b.id)) - Number(builtInScreenIds.has(a.id));

    return builtInSort || a.name.localeCompare(b.name);
  });
}

export function ScreenSelectionPanel() {
  const {
    screens,
    activeScreenId,
    teams,
    currentRun,
    timer,
    addScreen,
    updateScreen,
    deleteScreen,
    activateScreen,
  } = useAdminState();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [screenBeingEdited, setScreenBeingEdited] = useState<
    ScreenDefinition | undefined
  >();
  const [screenTypeForCreate, setScreenTypeForCreate] = useState<
    ScreenType | undefined
  >();

  const dialogMode = screenBeingEdited ? "edit" : "create";
  const groupedScreens = groupScreensByType(screens);

  function handleAddScreenClick() {
    setScreenBeingEdited(undefined);
    setScreenTypeForCreate(undefined);
    setDialogOpen(true);
  }

  function handleAddScreenForType(screenType: ScreenType) {
    setScreenBeingEdited(undefined);
    setScreenTypeForCreate(screenType);
    setDialogOpen(true);
  }

  function handleEditScreen(screen: ScreenDefinition) {
    setScreenBeingEdited(screen);
    setScreenTypeForCreate(undefined);
    setDialogOpen(true);
  }

  function handleSubmitScreen(screenDraft: ScreenDraft) {
    if (screenBeingEdited) {
      updateScreen(screenBeingEdited.id, screenDraft);
      return;
    }

    addScreen(screenDraft);
  }

  function handleDialogOpenChange(open: boolean) {
    setDialogOpen(open);

    if (!open) {
      setScreenBeingEdited(undefined);
      setScreenTypeForCreate(undefined);
    }
  }

  return (
    <section className="flex h-full min-h-0 flex-col overflow-hidden bg-slate-900 text-slate-50">
      <header className="flex items-center justify-between gap-4 border-b border-slate-800 px-5 py-4">
        <div>
          <h2 className="text-xl font-bold">Screens</h2>
          <p className="mt-1 text-sm text-slate-400">
            Create display screens and manage what appears on the display.
          </p>
        </div>

        <button
          type="button"
          onClick={handleAddScreenClick}
          className="inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-4 py-2 font-semibold text-slate-950 transition hover:bg-cyan-300"
        >
          <Plus className="size-4" />
          Add Screen
        </button>
      </header>

      <div className="flex-1 overflow-auto p-5">
        <div className="space-y-8">
          {groupedScreens.map((group) => (
            <section key={group.id} className="space-y-3">
              <div className="flex items-end justify-between gap-4 border-b border-cyan-400/20 bg-slate-950/35 px-4 py-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-200">
                    {(() => {
                      const SectionIcon = screenSectionIcons[group.id];

                      return <SectionIcon className="size-5" />;
                    })()}
                  </div>

                  <div className="min-w-0">
                    <h3 className="font-[family-name:var(--font-rajdhani)] text-2xl font-bold uppercase tracking-wide text-cyan-100">
                      {group.name}
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      {group.description}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleAddScreenForType(group.id)}
                  className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-cyan-400/25 bg-cyan-400/10 px-3 py-2 font-semibold text-cyan-100 transition hover:border-cyan-300/50 hover:bg-cyan-400/20"
                >
                  <Plus className="size-4" />
                  Add {group.id === "pdf" ? "PDF" : group.name}
                </button>
              </div>

              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                {sortScreensForSection(group.screens).map((screen) => (
                  <ScreenCard
                    key={screen.id}
                    screen={screen}
                    active={screen.id === activeScreenId}
                    builtIn={builtInScreenIds.has(screen.id)}
                    teams={teams}
                    currentRun={currentRun}
                    timer={timer.timer}
                    onActivate={activateScreen}
                    onEdit={handleEditScreen}
                    onDelete={deleteScreen}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>

      <ScreenFormDialog
        open={dialogOpen}
        mode={dialogMode}
        screen={screenBeingEdited}
        fixedType={screenBeingEdited?.type ?? screenTypeForCreate}
        onOpenChange={handleDialogOpenChange}
        onSubmit={handleSubmitScreen}
      />
    </section>
  );
}
