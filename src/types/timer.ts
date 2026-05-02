export type TimerStatus = "idle" | "running" | "paused" | "finished";

export type CountdownTimerState = {
  status: TimerStatus;
  durationMs: number;
  remainingMs: number;
};
