export type TimerStatus = "stopped" | "running" | "paused" | "finished";

export type CountdownTimerState = {
  status: TimerStatus;
  durationMs: number;
  remainingMs: number;
};
