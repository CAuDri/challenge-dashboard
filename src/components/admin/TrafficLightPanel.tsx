"use client";

import {
  CircleOff,
  PlugZap,
  Power,
  RefreshCw,
  Thermometer,
} from "lucide-react";
import { useAdminState } from "@/providers/AdminStateProvider";
import {
  trafficLightColors,
  type TrafficLightColor,
  type TrafficLightReportedColor,
} from "@/types/traffic-light";

const colorLabels: Record<TrafficLightColor, string> = {
  red: "Red",
  yellow: "Yellow",
  green: "Green",
  off: "Off",
};

const colorClassNames: Record<TrafficLightColor, string> = {
  red: "border-rose-400/70 bg-rose-500 text-rose-50 shadow-[0_0_34px_rgba(244,63,94,0.72)]",
  yellow:
    "border-amber-300/70 bg-amber-300 text-amber-950 shadow-[0_0_34px_rgba(252,211,77,0.72)]",
  green:
    "border-emerald-300/70 bg-emerald-400 text-emerald-950 shadow-[0_0_34px_rgba(52,211,153,0.72)]",
  off: "border-slate-600 bg-slate-800 text-slate-300",
};

function formatTemperature(temperatureC: number | undefined) {
  return temperatureC === undefined ? "N/A" : `${temperatureC.toFixed(1)} °C`;
}

function formatLastSeen(lastSeenAtServerMs: number | undefined) {
  if (lastSeenAtServerMs === undefined) {
    return "Never";
  }

  const secondsAgo = Math.max(
    0,
    Math.round((Date.now() - lastSeenAtServerMs) / 1000),
  );

  if (secondsAgo < 2) {
    return "Just now";
  }

  return `${secondsAgo}s ago`;
}

function isLampActive(
  lampColor: TrafficLightColor,
  reportedColor: TrafficLightReportedColor,
) {
  return reportedColor === lampColor;
}

function VirtualTrafficLight({
  reportedColor,
}: {
  reportedColor: TrafficLightReportedColor;
}) {
  return (
    <div className="mx-auto w-full max-w-60">
      <div className="rounded-[1.75rem] border border-slate-700 bg-slate-950 p-4 shadow-xl">
        <div className="space-y-4 rounded-[1.25rem] border border-slate-800 bg-black p-4">
          {(["red", "yellow", "green"] as const).map((color) => {
            const active = isLampActive(color, reportedColor);

            return (
              <div
                key={color}
                className={`aspect-square rounded-full border-4 transition ${
                  active
                    ? colorClassNames[color]
                    : "border-slate-800 bg-slate-900 shadow-inner"
                }`}
              />
            );
          })}
        </div>

        <div className="mx-auto h-18 w-12 border-x border-slate-700 bg-slate-950" />
        <div className="h-4 rounded-full border border-slate-700 bg-slate-950" />
      </div>

      <p className="mt-4 text-center font-[family-name:var(--font-rajdhani)] text-2xl font-bold uppercase tracking-wide text-cyan-100">
        {reportedColor === "unknown" ? "Unknown" : colorLabels[reportedColor]}
      </p>
    </div>
  );
}

export function TrafficLightPanel() {
  const {
    trafficLight,
    updateTrafficLightConfig,
    connectTrafficLight,
    commandTrafficLight,
  } = useAdminState();

  const { config, runtime } = trafficLight;
  const manualControlDisabled = config.syncWithRunControl || !config.enabled;
  const hasMismatch =
    config.syncWithRunControl &&
    config.enabled &&
    runtime.expectedColor !== undefined &&
    runtime.reportedColor !== "unknown" &&
    runtime.reportedColor !== runtime.expectedColor;

  return (
    <section className="flex h-full min-h-0 flex-col overflow-hidden bg-slate-900 text-slate-50">
      <header className="flex items-center justify-between gap-4 border-b border-slate-800 px-5 py-4">
        <div>
          <h2 className="text-xl font-bold">Traffic Light</h2>
          <p className="mt-1 text-sm text-slate-400">
            Configure the physical signal, monitor its telemetry, and control
            it manually when run sync is disabled.
          </p>
        </div>

        <div
          className={`rounded-full border px-4 py-2 text-sm font-semibold ${
            runtime.connectionStatus === "connected"
              ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-100"
              : runtime.connectionStatus === "connecting"
                ? "border-amber-400/40 bg-amber-500/10 text-amber-100"
                : "border-rose-400/40 bg-rose-500/10 text-rose-100"
          }`}
        >
          {runtime.connectionStatus}
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-auto p-5">
        <section className="rounded-3xl border border-slate-800 bg-slate-950/50 p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="font-[family-name:var(--font-rajdhani)] text-2xl font-bold uppercase tracking-wide text-cyan-100">
                Manual Control
              </h3>
              {manualControlDisabled && (
                <p className="mt-1 text-sm text-slate-500">
                  Manual color control is disabled while sync or the global
                  off override is active.
                </p>
              )}
            </div>

            {!config.enabled && (
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-950 px-4 py-2 text-sm font-semibold text-slate-300">
                <CircleOff className="size-4" />
                Forced off
              </div>
            )}
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {trafficLightColors.map((color) => {
              const active = runtime.reportedColor === color;

              return (
                <button
                  key={color}
                  type="button"
                  disabled={manualControlDisabled}
                  onClick={() => commandTrafficLight(color)}
                  className={`min-h-24 rounded-3xl border px-5 py-4 font-[family-name:var(--font-rajdhani)] text-2xl font-bold uppercase tracking-wide transition disabled:cursor-not-allowed disabled:opacity-35 ${
                    active
                      ? colorClassNames[color]
                      : "border-slate-800 bg-slate-950 text-slate-300 hover:border-cyan-400/50 hover:text-cyan-100"
                  }`}
                >
                  {color === "off" && (
                    <Power className="mx-auto mb-2 size-5 opacity-80" />
                  )}
                  {colorLabels[color]}
                </button>
              );
            })}
          </div>
        </section>

        <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(260px,0.62fr)_minmax(460px,1.08fr)_minmax(320px,0.8fr)]">
          <section className="rounded-3xl border border-slate-800 bg-slate-950/50 p-5">
            <VirtualTrafficLight reportedColor={runtime.reportedColor} />
          </section>

          <section className="rounded-3xl border border-slate-800 bg-slate-950/50 p-5">
            <h3 className="font-[family-name:var(--font-rajdhani)] text-2xl font-bold uppercase tracking-wide text-cyan-100">
              Connection
            </h3>

            <div className="mt-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
                  Hostname or IP Address
                </span>
                <input
                  type="text"
                  value={config.host}
                  onChange={(event) =>
                    updateTrafficLightConfig({ host: event.target.value })
                  }
                  className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-slate-50 outline-none transition focus:border-cyan-400"
                  placeholder="caudri-traffic-light"
                />
              </label>

              <button
                type="button"
                onClick={connectTrafficLight}
                className="inline-flex h-[50px] items-center justify-center gap-2 rounded-xl border border-slate-600 bg-slate-800 px-5 font-semibold text-slate-100 transition hover:border-slate-500 hover:bg-slate-700"
              >
                <PlugZap className="size-4" />
                Connect
              </button>
            </div>

            <div className="mt-5 grid gap-3">
              <button
                type="button"
                onClick={() =>
                  updateTrafficLightConfig({ enabled: !config.enabled })
                }
                className={`flex min-h-16 items-center justify-between gap-4 rounded-2xl border px-4 py-3 text-left transition ${
                  config.enabled
                    ? "border-emerald-400/25 bg-slate-900 text-slate-100 hover:border-emerald-400/45"
                    : "border-rose-400/45 bg-rose-500/10 text-rose-100 hover:border-rose-400/65"
                }`}
              >
                <span>
                  <span className="block text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
                    Global Override
                  </span>
                  <span className="mt-1 block font-[family-name:var(--font-rajdhani)] text-2xl font-bold uppercase tracking-wide">
                    {config.enabled ? "Enabled" : "Forced Off"}
                  </span>
                  <span className="mt-0.5 block text-xs text-slate-400">
                    {config.enabled
                      ? "Normal traffic light control is allowed."
                      : "The physical light is held off."}
                  </span>
                </span>

                <span
                  className={`flex h-9 w-17 shrink-0 items-center rounded-full border p-1 transition ${
                    config.enabled
                      ? "justify-end border-emerald-300/50 bg-emerald-400/20"
                      : "justify-start border-rose-300/50 bg-rose-400/20"
                  }`}
                >
                  <span className="size-6 rounded-full bg-slate-50 shadow-lg" />
                </span>
              </button>

              <label className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900 px-4 py-4 text-sm text-slate-300">
                <input
                  type="checkbox"
                  checked={config.autoConnect}
                  onChange={(event) =>
                    updateTrafficLightConfig({
                      autoConnect: event.target.checked,
                    })
                  }
                  className="h-4 w-4 accent-cyan-400"
                />
                <span className="font-medium text-slate-200">
                  Auto-connect and poll
                </span>
              </label>

              <label className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900 px-4 py-4 text-sm text-slate-300">
                <input
                  type="checkbox"
                  checked={config.syncWithRunControl}
                  onChange={(event) =>
                    updateTrafficLightConfig({
                      syncWithRunControl: event.target.checked,
                    })
                  }
                  className="h-4 w-4 accent-cyan-400"
                />
                <span className="font-medium text-slate-200">
                  Sync with run control
                </span>
              </label>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-800 bg-slate-950/50 p-5">
            <h3 className="font-[family-name:var(--font-rajdhani)] text-2xl font-bold uppercase tracking-wide text-cyan-100">
              Telemetry
            </h3>

            <div className="mt-4 grid gap-3">
              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
                  Current Light
                </p>
                <p className="mt-1 font-[family-name:var(--font-rajdhani)] text-3xl font-bold uppercase text-slate-50">
                  {runtime.reportedColor}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
                  <Thermometer className="size-4" />
                  Temperature
                </p>
                <p className="mt-1 font-mono text-2xl font-bold text-cyan-100">
                  {formatTemperature(runtime.temperatureC)}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
                  <RefreshCw className="size-4" />
                  Last Connected
                </p>
                <p className="mt-1 font-mono text-xl font-bold text-slate-100">
                  {formatLastSeen(runtime.lastSeenAtServerMs)}
                </p>
              </div>

              {hasMismatch && (
                <div className="rounded-2xl border border-amber-400/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
                  Physical state differs from expected state. The server will
                  correct it while sync is active.
                </div>
              )}

              {runtime.lastError && (
                <div className="rounded-2xl border border-rose-400/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
                  {runtime.lastError}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </section>
  );
}
