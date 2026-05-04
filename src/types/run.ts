import type { DisciplineId } from "@/types/team";

export type RunPhase =
  | "standby"
  | "preparation"
  | "ready"
  | "running"
  | "finish";

export type CurrentRunState = {
  selectedTeamId?: string;
  selectedDisciplineId?: DisciplineId;
  phase: RunPhase;
  preparationDurationMs: number;
  runDurationMs: number;
};

export const runPhaseLabels: Record<RunPhase, string> = {
  standby: "Stand-By",
  preparation: "Preparation",
  ready: "Ready",
  running: "Go!",
  finish: "Finish",
};

export const nextRunPhaseOrder: RunPhase[] = [
  "standby",
  "preparation",
  "ready",
  "finish",
];
