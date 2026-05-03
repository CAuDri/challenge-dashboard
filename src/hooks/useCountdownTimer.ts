"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  CountdownTimerState,
  TimerDigits,
  TimerDisplayTime,
} from "@/types/timer";

const DEFAULT_DURATION_MS = 3 * 60 * 1000;
const TIMER_UPDATE_INTERVAL_MS = 20;
const MAX_TIMER_SECONDS = 99 * 60 + 59;

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
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const milliseconds = Math.floor(safeMs % 1000);

  return {
    minutes,
    seconds,
    milliseconds,
  };
}

export function useCountdownTimer(initialDurationMs = DEFAULT_DURATION_MS) {
  const [timer, setTimer] = useState<CountdownTimerState>({
    status: "stopped",
    durationMs: initialDurationMs,
    remainingMs: initialDurationMs,
  });

  const intervalRef = useRef<number | null>(null);
  const targetEndTimeRef = useRef<number | null>(null);

  const displayedTime = useMemo(
    () => formatTime(timer.remainingMs),
    [timer.remainingMs],
  );

  const configuredTime = useMemo(
    () => formatTime(timer.durationMs),
    [timer.durationMs],
  );

  const configuredMinutesDigits = useMemo(
    () => splitDigits(configuredTime.minutes),
    [configuredTime.minutes],
  );

  const configuredSecondsDigits = useMemo(
    () => splitDigits(configuredTime.seconds),
    [configuredTime.seconds],
  );

  const canEditDuration = timer.status === "stopped";
  const canStart = timer.status !== "running" && timer.remainingMs > 0;
  const canPause = timer.status === "running";
  const canReset =
    timer.status === "running" ||
    timer.status === "paused" ||
    timer.status === "finished";

  useEffect(() => {
    if (timer.status !== "running") {
      return;
    }

    intervalRef.current = window.setInterval(() => {
      if (targetEndTimeRef.current === null) {
        return;
      }

      const nextRemainingMs = Math.max(
        0,
        targetEndTimeRef.current - performance.now(),
      );

      setTimer((currentTimer) => {
        if (currentTimer.status !== "running") {
          return currentTimer;
        }

        if (nextRemainingMs <= 0) {
          targetEndTimeRef.current = null;

          return {
            ...currentTimer,
            status: "finished",
            remainingMs: 0,
          };
        }

        return {
          ...currentTimer,
          remainingMs: nextRemainingMs,
        };
      });
    }, TIMER_UPDATE_INTERVAL_MS);

    return () => {
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [timer.status]);

  const setDurationFromMinutesSeconds = useCallback(
    (minutes: number, seconds: number) => {
      setTimer((currentTimer) => {
        if (currentTimer.status !== "stopped") {
          return currentTimer;
        }

        const safeMinutes = clamp(minutes, 0, 99);
        const safeSeconds = clamp(seconds, 0, 59);
        const nextDurationMs = (safeMinutes * 60 + safeSeconds) * 1000;

        return {
          ...currentTimer,
          durationMs: nextDurationMs,
          remainingMs: nextDurationMs,
        };
      });
    },
    [],
  );

  const changeMinutes = useCallback(
    (delta: number) => {
      if (!canEditDuration) {
        return;
      }

      setDurationFromMinutesSeconds(
        configuredTime.minutes + delta,
        configuredTime.seconds,
      );
    },
    [
      canEditDuration,
      configuredTime.minutes,
      configuredTime.seconds,
      setDurationFromMinutesSeconds,
    ],
  );

  const changeSeconds = useCallback(
    (delta: number) => {
      if (!canEditDuration) {
        return;
      }

      const totalSeconds =
        configuredTime.minutes * 60 + configuredTime.seconds + delta;

      const clampedTotalSeconds = clamp(totalSeconds, 0, MAX_TIMER_SECONDS);

      setDurationFromMinutesSeconds(
        Math.floor(clampedTotalSeconds / 60),
        clampedTotalSeconds % 60,
      );
    },
    [
      canEditDuration,
      configuredTime.minutes,
      configuredTime.seconds,
      setDurationFromMinutesSeconds,
    ],
  );

  const startTimer = useCallback(() => {
    setTimer((currentTimer) => {
      if (currentTimer.status === "running" || currentTimer.remainingMs <= 0) {
        return currentTimer;
      }

      targetEndTimeRef.current = performance.now() + currentTimer.remainingMs;

      return {
        ...currentTimer,
        status: "running",
      };
    });
  }, []);

  const pauseTimer = useCallback(() => {
    setTimer((currentTimer) => {
      if (currentTimer.status !== "running") {
        return currentTimer;
      }

      const remainingMs =
        targetEndTimeRef.current === null
          ? currentTimer.remainingMs
          : Math.max(0, targetEndTimeRef.current - performance.now());

      targetEndTimeRef.current = null;

      return {
        ...currentTimer,
        status: "paused",
        remainingMs,
      };
    });
  }, []);

  const resetTimer = useCallback(() => {
    targetEndTimeRef.current = null;

    setTimer((currentTimer) => ({
      ...currentTimer,
      status: "stopped",
      remainingMs: currentTimer.durationMs,
    }));
  }, []);

  return {
    timer,
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
    startTimer,
    pauseTimer,
    resetTimer,
  };
}
