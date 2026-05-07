"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAdminState } from "@/providers/AdminStateProvider";

type DiagnosticsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function JsonBlock({ value }: { value: unknown }) {
  return (
    <pre className="max-h-[46vh] overflow-auto rounded-2xl border border-slate-800 bg-slate-950 p-4 text-xs leading-5 text-slate-300">
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}

export function DiagnosticsDialog({
  open,
  onOpenChange,
}: DiagnosticsDialogProps) {
  const {
    connectionStatus,
    timer,
    currentRun,
    activeScreenId,
    screens,
    teams,
    trafficLight,
    displayClients,
    displayControl,
    diagnostics,
  } = useAdminState();

  const diagnosticPayload = {
    connectionStatus,
    diagnostics,
    activeScreenId,
    activeScreen: screens.find((screen) => screen.id === activeScreenId),
    currentRun,
    timer: timer.timer,
    teams: teams.map((team) => ({
      id: team.id,
      name: team.name,
      participatingDisciplines: team.participatingDisciplines,
      scores: team.scores,
    })),
    trafficLight,
    displayClients,
    displayControl,
  };

  async function copyDiagnostics() {
    await navigator.clipboard.writeText(
      JSON.stringify(diagnosticPayload, null, 2),
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[86vh] overflow-auto border-slate-800 bg-slate-950 text-slate-50 sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle className="font-[family-name:var(--font-rajdhani)] text-3xl font-bold uppercase tracking-wide text-cyan-100">
            Diagnostics
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 md:grid-cols-4">
          {[
            ["Server", connectionStatus],
            ["Phase", currentRun.phase],
            ["Timer", timer.timer.status],
            ["Displays", diagnostics.connectedDisplayClientCount.toString()],
          ].map(([label, value]) => (
            <div
              key={label}
              className="rounded-2xl border border-slate-800 bg-slate-900 p-4"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
                {label}
              </p>
              <p className="mt-1 truncate font-[family-name:var(--font-rajdhani)] text-2xl font-bold uppercase text-slate-50">
                {value}
              </p>
            </div>
          ))}
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => {
              void copyDiagnostics();
            }}
            className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-cyan-400/50 hover:text-cyan-100"
          >
            Copy Diagnostics JSON
          </button>
        </div>

        <JsonBlock value={diagnosticPayload} />
      </DialogContent>
    </Dialog>
  );
}
