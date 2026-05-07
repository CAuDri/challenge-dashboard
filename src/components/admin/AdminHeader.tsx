"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { dashboardContentClassName } from "@/config/layout";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Activity,
  Download,
  ExternalLink,
  Menu,
  MonitorCheck,
  RotateCcw,
  Upload,
} from "lucide-react";
import {
  exportDashboardBackup,
  importDashboardBackup,
  resetDashboardState,
} from "@/lib/realtime/dashboardBackup";
import { useAdminState } from "@/providers/AdminStateProvider";
import type { RealtimeConnectionStatus } from "@/hooks/useDisplayStateSocket";
import { DisplayHealthDialog } from "@/components/admin/DisplayHealthDialog";
import { DiagnosticsDialog } from "@/components/admin/DiagnosticsDialog";
import type { TrafficLightState } from "@/types/traffic-light";

type HeaderStatusTone = "emerald" | "amber" | "rose" | "slate";

function HeaderStatusRow({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: HeaderStatusTone;
}) {
  const toneConfig = {
    emerald: "bg-emerald-300 text-emerald-100",
    amber: "bg-amber-200 text-amber-100",
    rose: "bg-rose-300 text-rose-100",
    slate: "bg-slate-500 text-slate-400",
  } satisfies Record<HeaderStatusTone, string>;

  const [dotClassName, textClassName] = toneConfig[tone].split(" ");

  return (
    <div
      className={`flex items-center justify-between gap-5 font-[family-name:var(--font-rajdhani)] text-[0.7rem] font-bold uppercase leading-none tracking-[0.16em] ${textClassName}`}
    >
      <span className="flex items-center gap-2 text-slate-500">
        <span
          className={`size-1.5 rounded-full shadow-[0_0_8px_currentColor] ${dotClassName}`}
        />
        {label}
      </span>
      <span>{value}</span>
    </div>
  );
}

function getServerStatus(status: RealtimeConnectionStatus) {
  const statusConfig = {
    connected: {
      value: "Connected",
      tone: "emerald",
    },
    reconnecting: {
      value: "Reconnecting",
      tone: "amber",
    },
    disconnected: {
      value: "Disconnected",
      tone: "rose",
    },
  } satisfies Record<
    RealtimeConnectionStatus,
    {
      value: string;
      tone: HeaderStatusTone;
    }
  >;

  return statusConfig[status];
}

function getTrafficLightStatus(trafficLight: TrafficLightState) {
  const isTrafficLightActive =
    trafficLight.config.enabled &&
    (trafficLight.config.autoConnect ||
      trafficLight.config.syncWithRunControl);

  if (!isTrafficLightActive) {
    return {
      value: "Disabled",
      tone: "slate" as const,
    };
  }

  switch (trafficLight.runtime.connectionStatus) {
    case "connected":
      return {
        value: "Connected",
        tone: "emerald" as const,
      };

    case "connecting":
      return {
        value: "Connecting",
        tone: "amber" as const,
      };

    case "disconnected":
      return {
        value: "Disconnected",
        tone: "rose" as const,
      };

    case "idle":
      return {
        value: "Idle",
        tone: "slate" as const,
      };
  }
}

function HeaderStatusPanel({
  connectionStatus,
  trafficLight,
}: {
  connectionStatus: RealtimeConnectionStatus;
  trafficLight: TrafficLightState;
}) {
  const serverStatus = getServerStatus(connectionStatus);
  const trafficLightStatus = getTrafficLightStatus(trafficLight);

  return (
    <div className="grid w-full gap-2 rounded-lg border border-slate-800 bg-slate-900/70 px-3 py-2 shadow-inner shadow-black/20">
      <HeaderStatusRow
        label="Server"
        value={serverStatus.value}
        tone={serverStatus.tone}
      />
      <HeaderStatusRow
        label="Traffic Light"
        value={trafficLightStatus.value}
        tone={trafficLightStatus.tone}
      />
    </div>
  );
}

export function AdminHeader() {
  const importInputRef = useRef<HTMLInputElement>(null);
  const { connectionStatus, trafficLight } = useAdminState();
  const [displayHealthOpen, setDisplayHealthOpen] = useState(false);
  const [diagnosticsOpen, setDiagnosticsOpen] = useState(false);

  async function handleExportBackup() {
    try {
      await exportDashboardBackup();
    } catch (error) {
      console.error(error);
      window.alert("Failed to export dashboard backup.");
    }
  }

  async function handleImportBackup(file: File | undefined) {
    if (!file) {
      return;
    }

    const confirmed = window.confirm(
      "Import this dashboard backup? Current teams, screens and run settings will be replaced.",
    );

    if (!confirmed) {
      return;
    }

    try {
      await importDashboardBackup(file);
    } catch (error) {
      console.error(error);
      window.alert("Failed to import dashboard backup.");
    } finally {
      if (importInputRef.current) {
        importInputRef.current.value = "";
      }
    }
  }

  async function handleResetDashboardState() {
    const confirmed = window.confirm(
      "Reset the dashboard state? Teams, scores and custom screens will be replaced with defaults.",
    );

    if (!confirmed) {
      return;
    }

    try {
      await resetDashboardState();
    } catch (error) {
      console.error(error);
      window.alert("Failed to reset dashboard state.");
    }
  }

  return (
    <header className="bg-slate-950 py-7 text-slate-50">
      <div className={`${dashboardContentClassName} flex items-center gap-10`}>
        <div className="relative ml-1 h-[7rem] w-[15rem] shrink-0">
          <Image
            src="/caudri_logo.svg"
            alt="CAuDri-Challenge Logo"
            fill
            priority
            className="object-contain"
          />
        </div>

        <div className="font-[family-name:var(--font-rajdhani)] leading-none">
          <p className="text-2xl font-semibold uppercase tracking-[0.38em] text-cyan-300">
            CAuDri-Challenge
          </p>

          <h1 className="mb-[-0.16em] mt-2 text-6xl font-bold leading-none">
            Competition Dashboard
          </h1>
        </div>

        <div className="ml-auto flex flex-col items-stretch gap-2">
          <div className="flex items-center justify-end gap-3">
            <Button
              asChild
              className="h-13 gap-2.5 border-cyan-400/30 bg-cyan-400/10 px-5 font-[family-name:var(--font-rajdhani)] text-lg font-bold uppercase tracking-wide text-cyan-100 hover:bg-cyan-400/20"
            >
              <a href="/display" target="_blank" rel="noreferrer">
                Open Display
                <ExternalLink className="size-5" />
              </a>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="size-13 border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800 hover:text-cyan-100"
                  aria-label="Open dashboard menu"
                >
                  <Menu className="size-6" />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                align="end"
                className="w-64 border border-slate-700 bg-slate-900 p-2 text-slate-100"
              >
                <DropdownMenuLabel className="font-[family-name:var(--font-rajdhani)] text-sm font-bold uppercase tracking-[0.22em] text-slate-400">
                  Dashboard
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-slate-700" />

                <DropdownMenuItem
                  className="gap-3 px-3 py-2 text-sm focus:bg-slate-800 focus:text-cyan-100"
                  onSelect={(event) => {
                    event.preventDefault();
                    setDisplayHealthOpen(true);
                  }}
                >
                  <MonitorCheck className="size-4 text-cyan-300" />
                  Display Health
                </DropdownMenuItem>

                <DropdownMenuItem
                  className="gap-3 px-3 py-2 text-sm focus:bg-slate-800 focus:text-cyan-100"
                  onSelect={(event) => {
                    event.preventDefault();
                    setDiagnosticsOpen(true);
                  }}
                >
                  <Activity className="size-4 text-cyan-300" />
                  Diagnostics
                </DropdownMenuItem>

                <DropdownMenuSeparator className="bg-slate-700" />

                <DropdownMenuItem
                  className="gap-3 px-3 py-2 text-sm focus:bg-slate-800 focus:text-cyan-100"
                  onSelect={(event) => {
                    event.preventDefault();
                    void handleExportBackup();
                  }}
                >
                  <Upload className="size-4 text-cyan-300" />
                  Export State
                </DropdownMenuItem>

                <DropdownMenuItem
                  className="gap-3 px-3 py-2 text-sm focus:bg-slate-800 focus:text-cyan-100"
                  onSelect={(event) => {
                    event.preventDefault();
                    importInputRef.current?.click();
                  }}
                >
                  <Download className="size-4 text-cyan-300" />
                  Import State
                </DropdownMenuItem>

                <DropdownMenuSeparator className="bg-slate-700" />

                <DropdownMenuItem
                  variant="destructive"
                  className="gap-3 px-3 py-2 text-sm text-red-300 focus:bg-red-950/70 focus:text-red-200"
                  onSelect={(event) => {
                    event.preventDefault();
                    void handleResetDashboardState();
                  }}
                >
                  <RotateCcw className="size-4" />
                  Reset Dashboard State
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <HeaderStatusPanel
            connectionStatus={connectionStatus}
            trafficLight={trafficLight}
          />

          <input
            ref={importInputRef}
            type="file"
            accept=".zip,application/zip"
            className="hidden"
            onChange={(event) => {
              void handleImportBackup(event.target.files?.[0]);
            }}
          />
        </div>
      </div>

      <DisplayHealthDialog
        open={displayHealthOpen}
        onOpenChange={setDisplayHealthOpen}
      />
      <DiagnosticsDialog
        open={diagnosticsOpen}
        onOpenChange={setDiagnosticsOpen}
      />
    </header>
  );
}
