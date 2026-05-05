"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  CountdownTimerState,
  TimerDigits,
  TimerDisplayTime,
} from "@/types/timer";

const MAX_TIMER_SECONDS = 99 * 60 + 59;

type TimerCommands = {
  setDurationMs: (durationMs: number) => void;
  start: () => void;
  pause: () => void;
  reset: () => void;
  finish: () => void;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function splitDigits(value: number): TimerDigits {
  const clampedValue = clamp(value, 0, 99);

  return {
    tens: Math.floor(clampedValue / 10),
    ones: clampedValue % 10,
  };
}

function formatTime(ms: number): TimerDisplayTime {
  const safeMs = Math.max(0, ms);
  const totalSeconds = Math.floor(safeMs / 1000);

  return {
    minutes: Math.floor(totalSeconds / 60),
    seconds: totalSeconds % 60,
    milliseconds: Math.floor(safeMs % 1000),
  };
}

function getSnapshotKey(timer: CountdownTimerState) {
  return [
    timer.status,
    timer.durationMs,
    timer.status === "running" ? timer.updatedAtServerMs : timer.remainingMs,
    timer.updatedAtServerMs,
  ].join(":");
}

function createRunningTimerFromLocalTarget(
  serverTimer: CountdownTimerState,
  localTargetEndTimeMs: number,
): CountdownTimerState {
  const remainingMs = Math.max(0, localTargetEndTimeMs - performance.now());

  return {
    ...serverTimer,
    status: remainingMs <= 0 ? "finished" : "running",
    remainingMs,
  };
}

export function useServerCountdownTimer(
  serverTimer: CountdownTimerState,
  timerCommands: TimerCommands,
  estimatedOneWayLatencyMs: number,
) {
  const localTargetEndTimeRef = useRef<number | null>(null);
  const lastSnapshotKeyRef = useRef<string | null>(null);

  const [derivedTimer, setDerivedTimer] =
    useState<CountdownTimerState>(serverTimer);

  const snapshotKey = useMemo(() => getSnapshotKey(serverTimer), [serverTimer]);

  useEffect(() => {
    if (lastSnapshotKeyRef.current === snapshotKey) {
      return;
    }

    lastSnapshotKeyRef.current = snapshotKey;

    if (serverTimer.status === "running") {
      const latencyCorrectedRemainingMs = Math.max(
        0,
        serverTimer.remainingMs - estimatedOneWayLatencyMs,
      );

      const localTargetEndTimeMs =
        performance.now() + latencyCorrectedRemainingMs;

      localTargetEndTimeRef.current = localTargetEndTimeMs;

      setDerivedTimer(
        createRunningTimerFromLocalTarget(serverTimer, localTargetEndTimeMs),
      );

      return;
    }

    localTargetEndTimeRef.current = null;
    setDerivedTimer(serverTimer);
  }, [serverTimer, snapshotKey, estimatedOneWayLatencyMs]);

  useEffect(() => {
    if (serverTimer.status !== "running") {
      return;
    }

    const interval = window.setInterval(() => {
      const localTargetEndTimeMs = localTargetEndTimeRef.current;

      if (localTargetEndTimeMs === null) {
        return;
      }

      setDerivedTimer(
        createRunningTimerFromLocalTarget(serverTimer, localTargetEndTimeMs),
      );
    }, 20);

    return () => {
      window.clearInterval(interval);
    };
  }, [serverTimer]);

  const displayedTime = useMemo(
    () => formatTime(derivedTimer.remainingMs),
    [derivedTimer.remainingMs],
  );

  const configuredTime = useMemo(
    () => formatTime(derivedTimer.durationMs),
    [derivedTimer.durationMs],
  );

  const configuredMinutesDigits = useMemo(
    () => splitDigits(configuredTime.minutes),
    [configuredTime.minutes],
  );

  const configuredSecondsDigits = useMemo(
    () => splitDigits(configuredTime.seconds),
    [configuredTime.seconds],
  );

  const canEditDuration = derivedTimer.status === "stopped";
  const canStart =
    derivedTimer.status !== "running" && derivedTimer.remainingMs > 0;
  const canPause = derivedTimer.status === "running";
  const canReset =
    derivedTimer.status === "running" ||
    derivedTimer.status === "paused" ||
    derivedTimer.status === "finished";

  const setDurationMs = useCallback(
    (durationMs: number) => {
      timerCommands.setDurationMs(durationMs);
    },
    [timerCommands],
  );

  const setDurationFromMinutesSeconds = useCallback(
    (minutes: number, seconds: number) => {
      if (!canEditDuration) {
        return;
      }

      const safeMinutes = clamp(minutes, 0, 99);
      const safeSeconds = clamp(seconds, 0, 59);
      const nextDurationMs = (safeMinutes * 60 + safeSeconds) * 1000;

      timerCommands.setDurationMs(nextDurationMs);
    },
    [canEditDuration, timerCommands],
  );

  const changeMinutes = useCallback(
    (delta: number) => {
      setDurationFromMinutesSeconds(
        configuredTime.minutes + delta,
        configuredTime.seconds,
      );
    },
    [
      configuredTime.minutes,
      configuredTime.seconds,
      setDurationFromMinutesSeconds,
    ],
  );

  const changeSeconds = useCallback(
    (delta: number) => {
      const totalSeconds =
        configuredTime.minutes * 60 + configuredTime.seconds + delta;

      const clampedTotalSeconds = clamp(totalSeconds, 0, MAX_TIMER_SECONDS);

      setDurationFromMinutesSeconds(
        Math.floor(clampedTotalSeconds / 60),
        clampedTotalSeconds % 60,
      );
    },
    [
      configuredTime.minutes,
      configuredTime.seconds,
      setDurationFromMinutesSeconds,
    ],
  );

  return {
    timer: derivedTimer,
    displayedTime,
    configuredTime,
    configuredMinutesDigits,
    configuredSecondsDigits,
    canEditDuration,
    canStart,
    canPause,
    canReset,
    changeMinutes,
    changeSeconds,
    setDurationMs,
    startTimer: timerCommands.start,
    pauseTimer: timerCommands.pause,
    resetTimer: timerCommands.reset,
    finishTimer: timerCommands.finish,
  };
}
