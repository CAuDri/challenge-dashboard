"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAdminState } from "@/providers/AdminStateProvider";

type DisplayHealthDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function formatLastSeen(timestampMs: number) {
  const secondsAgo = Math.max(0, Math.round((Date.now() - timestampMs) / 1000));

  if (secondsAgo < 2) {
    return "Just now";
  }

  return `${secondsAgo}s ago`;
}

export function DisplayHealthDialog({
  open,
  onOpenChange,
}: DisplayHealthDialogProps) {
  const {
    displayClients,
    displayControl,
    setMainDisplayClientId,
    setDisplaySyncEnabled,
  } = useAdminState();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[86vh] overflow-auto border-slate-800 bg-slate-950 text-slate-50 sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle className="font-[family-name:var(--font-rajdhani)] text-3xl font-bold uppercase tracking-wide text-cyan-100">
            Display Health
          </DialogTitle>
        </DialogHeader>

        <section className="grid gap-4 rounded-2xl border border-slate-800 bg-slate-900 p-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
          <div>
            <p className="text-sm font-semibold text-slate-200">
              Shared display control
            </p>
            <p className="mt-1 text-sm text-slate-500">
              The selected main display publishes PDF pages and scoreboard
              reveals. Other displays follow that state.
            </p>
          </div>

          <label className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={displayControl.syncEnabled}
              onChange={(event) => setDisplaySyncEnabled(event.target.checked)}
              className="h-4 w-4 accent-cyan-400"
            />
            <span>Sync displays</span>
          </label>
        </section>

        <div className="grid gap-3">
          {displayClients.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/50 p-8 text-center text-slate-500">
              No display clients connected yet.
            </div>
          ) : (
            displayClients.map((client) => {
              const isMainDisplay =
                displayControl.mainDisplayClientId === client.id;

              return (
                <article
                  key={client.id}
                  className={`rounded-2xl border p-4 ${
                    isMainDisplay
                      ? "border-cyan-400/50 bg-cyan-400/10"
                      : "border-slate-800 bg-slate-900"
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-[family-name:var(--font-rajdhani)] text-2xl font-bold uppercase tracking-wide text-slate-50">
                          {client.name}
                        </h3>
                        <span
                          className={`rounded-full border px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${
                            client.status === "connected"
                              ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-100"
                              : "border-rose-400/40 bg-rose-500/10 text-rose-100"
                          }`}
                        >
                          {client.status}
                        </span>
                        {isMainDisplay && (
                          <span className="rounded-full border border-cyan-400/40 bg-cyan-400/10 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100">
                            Main
                          </span>
                        )}
                      </div>

                      <div className="mt-3 grid gap-2 text-sm text-slate-400 md:grid-cols-2">
                        <p>
                          <span className="text-slate-500">IP:</span>{" "}
                          {client.ipAddress ?? "Unknown"}
                        </p>
                        <p>
                          <span className="text-slate-500">Hostname:</span>{" "}
                          {client.hostname ?? "Unavailable"}
                        </p>
                        <p>
                          <span className="text-slate-500">Screen:</span>{" "}
                          {client.activeScreenName ?? "Unknown"}
                        </p>
                        <p>
                          <span className="text-slate-500">Last seen:</span>{" "}
                          {formatLastSeen(client.lastSeenAtServerMs)}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setMainDisplayClientId(isMainDisplay ? undefined : client.id)
                      }
                      className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-cyan-400/50 hover:text-cyan-100"
                    >
                      {isMainDisplay ? "Unset Main" : "Set Main"}
                    </button>
                  </div>

                  {client.userAgent && (
                    <p className="mt-3 truncate border-t border-slate-800 pt-3 text-xs text-slate-600">
                      {client.userAgent}
                    </p>
                  )}
                </article>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
