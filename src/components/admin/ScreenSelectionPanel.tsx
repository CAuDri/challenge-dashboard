"use client";

import { useState } from "react";
import { ScreenCard } from "@/components/admin/ScreenCard";
import { ScreenFormDialog } from "@/components/admin/ScreenFormDialog";
import { useAdminState } from "@/providers/AdminStateProvider";
import type { ScreenDefinition, ScreenDraft } from "@/types/screen";

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
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {screens.map((screen) => (
            <ScreenCard
              key={screen.id}
              screen={screen}
              active={screen.id === activeScreenId}
              onActivate={activateScreen}
              onEdit={handleEditScreen}
              onDelete={deleteScreen}
            />
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
