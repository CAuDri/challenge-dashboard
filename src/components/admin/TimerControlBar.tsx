"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { CountdownTimerState } from "@/types/timer";

const DEFAULT_DURATION_MS = 3 * 60 * 1000;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function splitDigits(value: number) {
  const clampedValue = clamp(value, 0, 99);

  return {
    tens: Math.floor(clampedValue / 10),
    ones: clampedValue % 10,
  };
}

function formatTime(ms: number) {
  const safeMs = Math.max(0, ms);
  const totalSeconds = Math.floor(safeMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const milliseconds = Math.floor(safeMs % 1000);

  return {
    minutes,
    seconds,
    milliseconds,
    label: `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}.${milliseconds.toString().padStart(3, "0")}`,
  };
}

type DigitStepperProps = {
  label: string;
  value: number;
  disabled: boolean;
  onIncrement: () => void;
  onDecrement: () => void;
};

function DigitStepper({
  label,
  value,
  disabled,
  onIncrement,
  onDecrement,
}: DigitStepperProps) {
  return (
    <div className="flex flex-col items-center gap-1">
      <button
        type="button"
        disabled={disabled}
        onClick={onIncrement}
        className="flex h-7 w-9 items-center justify-center rounded-lg border border-slate-700 bg-slate-800 text-slate-200 transition hover:border-cyan-400 hover:text-cyan-200 disabled:cursor-not-allowed disabled:opacity-30"
        aria-label={`${label} erhöhen`}
      >
        ▲
      </button>

      <div className="flex h-12 w-9 items-center justify-center rounded-lg border border-slate-700 bg-slate-950 text-3xl font-bold tabular-nums text-slate-50">
        {value}
      </div>

      <button
        type="button"
        disabled={disabled}
        onClick={onDecrement}
        className="flex h-7 w-9 items-center justify-center rounded-lg border border-slate-700 bg-slate-800 text-slate-200 transition hover:border-cyan-400 hover:text-cyan-200 disabled:cursor-not-allowed disabled:opacity-30"
        aria-label={`${label} verringern`}
      >
        ▼
      </button>
    </div>
  );
}

export function TimerControlBar() {
  const [timer, setTimer] = useState<CountdownTimerState>({
    status: "idle",
    durationMs: DEFAULT_DURATION_MS,
    remainingMs: DEFAULT_DURATION_MS,
  });

  const intervalRef = useRef<number | null>(null);
  const targetEndTimeRef = useRef<number | null>(null);

  const displayedTime = useMemo(
    () => formatTime(timer.remainingMs),
    [timer.remainingMs],
  );

  const minutesDigits = splitDigits(displayedTime.minutes);
  const secondsDigits = splitDigits(displayedTime.seconds);

  const canEditDuration = timer.status === "idle";
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
    }, 20);

    return () => {
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [timer.status]);

  function updateDurationFromMinutesSeconds(minutes: number, seconds: number) {
    const safeMinutes = clamp(minutes, 0, 99);
    const safeSeconds = clamp(seconds, 0, 59);
    const nextDurationMs = (safeMinutes * 60 + safeSeconds) * 1000;

    setTimer((currentTimer) => ({
      ...currentTimer,
      durationMs: nextDurationMs,
      remainingMs: nextDurationMs,
    }));
  }

  function changeMinutes(delta: number) {
    if (!canEditDuration) {
      return;
    }

    updateDurationFromMinutesSeconds(
      displayedTime.minutes + delta,
      displayedTime.seconds,
    );
  }

  function changeSeconds(delta: number) {
    if (!canEditDuration) {
      return;
    }

    const totalSeconds =
      displayedTime.minutes * 60 + displayedTime.seconds + delta;

    const clampedTotalSeconds = clamp(totalSeconds, 0, 99 * 60 + 59);

    updateDurationFromMinutesSeconds(
      Math.floor(clampedTotalSeconds / 60),
      clampedTotalSeconds % 60,
    );
  }

  function handleDirectMinutesInput(value: string) {
    if (!canEditDuration) {
      return;
    }

    const parsedMinutes = Number.parseInt(value, 10);

    if (Number.isNaN(parsedMinutes)) {
      updateDurationFromMinutesSeconds(0, displayedTime.seconds);
      return;
    }

    updateDurationFromMinutesSeconds(parsedMinutes, displayedTime.seconds);
  }

  function handleDirectSecondsInput(value: string) {
    if (!canEditDuration) {
      return;
    }

    const parsedSeconds = Number.parseInt(value, 10);

    if (Number.isNaN(parsedSeconds)) {
      updateDurationFromMinutesSeconds(displayedTime.minutes, 0);
      return;
    }

    updateDurationFromMinutesSeconds(displayedTime.minutes, parsedSeconds);
  }

  function handleStart() {
    if (!canStart) {
      return;
    }

    targetEndTimeRef.current = performance.now() + timer.remainingMs;

    setTimer((currentTimer) => ({
      ...currentTimer,
      status: "running",
    }));
  }

  function handlePause() {
    if (!canPause) {
      return;
    }

    targetEndTimeRef.current = null;

    setTimer((currentTimer) => ({
      ...currentTimer,
      status: "paused",
    }));
  }

  function handleReset() {
    if (!canReset) {
      return;
    }

    if (timer.status === "running") {
      const confirmed = window.confirm(
        "Der Timer läuft aktuell. Wirklich zurücksetzen?",
      );

      if (!confirmed) {
        return;
      }
    }

    targetEndTimeRef.current = null;

    setTimer((currentTimer) => ({
      ...currentTimer,
      status: "idle",
      remainingMs: currentTimer.durationMs,
    }));
  }

  return (
    <section className="border-b border-slate-800 bg-slate-900 px-8 py-4 text-slate-50">
      <div className="mx-auto flex max-w-[1800px] items-center justify-between gap-8">
        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled={!canStart}
            onClick={handleStart}
            className="rounded-xl bg-emerald-400 px-5 py-3 font-bold text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-30"
          >
            Start
          </button>

          <button
            type="button"
            disabled={!canPause}
            onClick={handlePause}
            className="rounded-xl bg-amber-300 px-5 py-3 font-bold text-slate-950 transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-30"
          >
            Pause
          </button>

          <button
            type="button"
            disabled={!canReset}
            onClick={handleReset}
            className="rounded-xl bg-rose-500 px-5 py-3 font-bold text-white transition hover:bg-rose-400 disabled:cursor-not-allowed disabled:opacity-30"
          >
            Reset
          </button>

          <div className="ml-4 rounded-xl border border-slate-700 bg-slate-950 px-4 py-2">
            <p className="text-xs uppercase tracking-[0.25em] text-slate-500">
              Status
            </p>
            <p className="mt-1 text-sm font-semibold text-cyan-200">
              {timer.status}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-5">
          <div className="hidden text-right xl:block">
            <p className="text-xs uppercase tracking-[0.25em] text-slate-500">
              Countdown
            </p>
            <p className="mt-1 text-sm text-slate-400">
              Zeit kann nur im Reset-State geändert werden.
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-950 p-3">
            <DigitStepper
              label="Minuten Zehnerstelle"
              value={minutesDigits.tens}
              disabled={!canEditDuration}
              onIncrement={() => changeMinutes(10)}
              onDecrement={() => changeMinutes(-10)}
            />
            <DigitStepper
              label="Minuten Einerstelle"
              value={minutesDigits.ones}
              disabled={!canEditDuration}
              onIncrement={() => changeMinutes(1)}
              onDecrement={() => changeMinutes(-1)}
            />

            <span className="mx-1 text-4xl font-bold text-slate-500">:</span>

            <DigitStepper
              label="Sekunden Zehnerstelle"
              value={secondsDigits.tens}
              disabled={!canEditDuration}
              onIncrement={() => changeSeconds(10)}
              onDecrement={() => changeSeconds(-10)}
            />
            <DigitStepper
              label="Sekunden Einerstelle"
              value={secondsDigits.ones}
              disabled={!canEditDuration}
              onIncrement={() => changeSeconds(1)}
              onDecrement={() => changeSeconds(-1)}
            />

            <div className="ml-4 flex items-end gap-2">
              <label className="flex flex-col gap-1">
                <span className="text-xs text-slate-500">Min</span>
                <input
                  type="number"
                  min={0}
                  max={99}
                  disabled={!canEditDuration}
                  value={displayedTime.minutes}
                  onChange={(event) =>
                    handleDirectMinutesInput(event.target.value)
                  }
                  className="w-20 rounded-lg border border-slate-700 bg-slate-900 px-2 py-2 text-center text-lg font-bold tabular-nums text-slate-50 disabled:cursor-not-allowed disabled:opacity-30"
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs text-slate-500">Sec</span>
                <input
                  type="number"
                  min={0}
                  max={59}
                  disabled={!canEditDuration}
                  value={displayedTime.seconds}
                  onChange={(event) =>
                    handleDirectSecondsInput(event.target.value)
                  }
                  className="w-20 rounded-lg border border-slate-700 bg-slate-900 px-2 py-2 text-center text-lg font-bold tabular-nums text-slate-50 disabled:cursor-not-allowed disabled:opacity-30"
                />
              </label>
            </div>

            <div className="ml-4 min-w-48 text-right">
              <p className="font-mono text-5xl font-black tabular-nums text-cyan-200">
                {displayedTime.label}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
