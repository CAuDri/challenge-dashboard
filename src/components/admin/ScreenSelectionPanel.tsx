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

const builtInScreenIds = new Set(demoScreens.map((screen) => screen.id));

function groupScreensByType(screens: ScreenDefinition[]) {
  return screenTypes
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

function getScreenTypeCounts(screens: ScreenDefinition[]) {
  return screens.reduce<Record<ScreenType, number>>(
    (counts, screen) => ({
      ...counts,
      [screen.type]: counts[screen.type] + 1,
    }),
    {
      image: 0,
      timer: 0,
      scoreboard: 0,
      pdf: 0,
      camera: 0,
    },
  );
}

export function ScreenSelectionPanel() {
  const {
    screens,
    activeScreenId,
    addScreen,
    updateScreen,
    deleteScreen,
    activateScreen,
  } = useAdminState();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [screenBeingEdited, setScreenBeingEdited] = useState<
    ScreenDefinition | undefined
  >();

  const dialogMode = screenBeingEdited ? "edit" : "create";
  const groupedScreens = groupScreensByType(screens);
  const screenTypeCounts = getScreenTypeCounts(screens);

  function handleAddScreenClick() {
    setScreenBeingEdited(undefined);
    setDialogOpen(true);
  }

  function handleEditScreen(screen: ScreenDefinition) {
    setScreenBeingEdited(screen);
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
    }
  }

  return (
    <section className="flex h-full min-h-0 flex-col overflow-hidden bg-slate-900 text-slate-50">
      <header className="flex items-center justify-between gap-4 border-b border-slate-800 px-5 py-4">
        <div>
          <h2 className="text-xl font-bold">Screens</h2>
          <p className="mt-1 text-sm text-slate-400">
            Create display screens and double-click a card to activate it.
          </p>
        </div>

        <button
          type="button"
          onClick={handleAddScreenClick}
          className="rounded-xl bg-cyan-400 px-4 py-2 font-semibold text-slate-950 transition hover:bg-cyan-300"
        >
          Add Screen
        </button>
      </header>

      <div className="flex-1 overflow-auto p-5">
        <div className="space-y-8">
          {groupedScreens.map((group) => (
            <section key={group.id} className="space-y-3">
              <div className="flex items-end justify-between gap-4 border-b border-slate-800/80 pb-2">
                <div>
                  <h3 className="font-[family-name:var(--font-rajdhani)] text-2xl font-bold uppercase tracking-wide text-cyan-100">
                    {group.name}
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    {group.description}
                  </p>
                </div>

                <p className="shrink-0 font-[family-name:var(--font-rajdhani)] text-sm font-bold uppercase tracking-[0.22em] text-slate-600">
                  {screenTypeCounts[group.id]}{" "}
                  {screenTypeCounts[group.id] === 1 ? "Screen" : "Screens"}
                </p>
              </div>

              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                {sortScreensForSection(group.screens).map((screen) => (
                  <ScreenCard
                    key={screen.id}
                    screen={screen}
                    active={screen.id === activeScreenId}
                    builtIn={builtInScreenIds.has(screen.id)}
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
        onOpenChange={handleDialogOpenChange}
        onSubmit={handleSubmitScreen}
      />
    </section>
  );
}
