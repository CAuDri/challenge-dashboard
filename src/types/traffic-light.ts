import type { RunPhase } from "@/types/run";

export type TrafficLightColor = "off" | "red" | "yellow" | "green";

export type TrafficLightReportedColor = TrafficLightColor | "unknown";

export type TrafficLightConnectionStatus =
  | "idle"
  | "connecting"
  | "connected"
  | "disconnected";

export type TrafficLightTransportType = "http";

export type TrafficLightConfig = {
  transport: TrafficLightTransportType;
  host: string;
  autoConnect: boolean;
  syncWithRunControl: boolean;
  enabled: boolean;
  pollIntervalMs: number;
};

export type TrafficLightRuntime = {
  connectionStatus: TrafficLightConnectionStatus;
  reportedColor: TrafficLightReportedColor;
  expectedColor?: TrafficLightColor;
  temperatureC?: number;
  lastSeenAtServerMs?: number;
  lastError?: string;
};

export type TrafficLightState = {
  config: TrafficLightConfig;
  runtime: TrafficLightRuntime;
};

export type TrafficLightConfigPatch = Partial<TrafficLightConfig>;

export const trafficLightColors: TrafficLightColor[] = [
  "red",
  "yellow",
  "green",
  "off",
];

export function getTrafficLightColorForRunPhase(
  phase: RunPhase,
): TrafficLightColor | undefined {
  switch (phase) {
    case "preparation":
    case "ready":
      return "yellow";

    case "running":
      return "green";

    case "finish":
    case "standby":
      return "red";
  }
}
