export type TimerStatus = "stopped" | "running" | "paused" | "finished";

export type CountdownTimerState = {
  status: TimerStatus;
  durationMs: number;
  remainingMs: number;

  /**
   * Monotonic server timestamp when this timer state was last changed.
   * Based on performance.now() on the realtime server.
   */
  updatedAtServerMs?: number;

  /**
   * Monotonic server timestamp when this timer should reach zero.
   * Only relevant while status === "running".
   */
  targetEndTimeServerMs?: number;

  /**
   * Official server timestamp when the timer was started/resumed.
   */
  startedAtServerMs?: number;

  /**
   * Official server timestamp when the timer was paused.
   */
  pausedAtServerMs?: number;

  /**
   * Official server timestamp when the timer was finished/stopped.
   */
  finishedAtServerMs?: number;
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
