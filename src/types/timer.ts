export type TimerStatus = "stopped" | "running" | "paused" | "finished";

export type CountdownTimerState = {
  status: TimerStatus;
  durationMs: number;
  remainingMs: number;
};

export type TimerDisplayTime = {
  minutes: number;
  seconds: number;
  milliseconds: number;
};

export type TimerDigits = {
  tens: number;
  ones: number;
};
