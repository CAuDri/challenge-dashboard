"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { CountdownTimerState } from "@/types/timer";
import { dashboardGridClassName } from "@/config/layout";

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
  };
}

function formatStatusLabel(status: CountdownTimerState["status"]) {
  return status.toUpperCase();
}

type TimerButtonProps = {
  children: React.ReactNode;
  disabled: boolean;
  variant: "start" | "pause" | "reset";
  onClick: () => void;
};

function TimerButton({
  children,
  disabled,
  variant,
  onClick,
}: TimerButtonProps) {
  const variantClassName = {
    start:
      "border-emerald-500/70 bg-emerald-700/80 text-emerald-50 hover:border-emerald-300 hover:bg-emerald-600",
    pause:
      "border-amber-500/70 bg-amber-700/80 text-amber-50 hover:border-amber-300 hover:bg-amber-600",
    reset:
      "border-rose-500/70 bg-rose-800/80 text-rose-50 hover:border-rose-300 hover:bg-rose-700",
  }[variant];

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`w-full rounded-xl border px-4 py-3 font-[family-name:var(--font-rajdhani)] text-xl font-bold uppercase tracking-wide transition disabled:cursor-not-allowed disabled:border-slate-800 disabled:bg-slate-900 disabled:text-slate-600 ${variantClassName}`}
    >
      {children}
    </button>
  );
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
    <div className="flex flex-col items-center gap-1.5">
      <button
        type="button"
        disabled={disabled}
        onClick={onIncrement}
        className="flex h-6 w-9 items-center justify-center rounded-md border border-cyan-400/30 bg-cyan-400/10 text-[10px] text-cyan-100 transition hover:border-cyan-300 hover:bg-cyan-400/20 disabled:pointer-events-none disabled:opacity-15"
        aria-label={`${label} erhöhen`}
      >
        ▲
      </button>

      <div className="flex h-16 w-12 items-center justify-center rounded-lg border border-cyan-400/20 bg-slate-950/70 font-mono text-5xl font-bold tabular-nums text-cyan-100 shadow-inner">
        {value}
      </div>

      <button
        type="button"
        disabled={disabled}
        onClick={onDecrement}
        className="flex h-6 w-9 items-center justify-center rounded-md border border-cyan-400/30 bg-cyan-400/10 text-[10px] text-cyan-100 transition hover:border-cyan-300 hover:bg-cyan-400/20 disabled:pointer-events-none disabled:opacity-15"
        aria-label={`${label} verringern`}
      >
        ▼
      </button>
    </div>
  );
}

export function TimerControlBar() {
  const [timer, setTimer] = useState<CountdownTimerState>({
    status: "stopped",
    durationMs: DEFAULT_DURATION_MS,
    remainingMs: DEFAULT_DURATION_MS,
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

  const configuredMinutesDigits = splitDigits(configuredTime.minutes);
  const configuredSecondsDigits = splitDigits(configuredTime.seconds);

  const canEditDuration = timer.status === "stopped";
  const canStart = timer.status !== "running" && timer.remainingMs > 0;
  const canPause = timer.status === "running";
  const canReset =
    timer.status === "running" ||
    timer.status === "paused" ||
    timer.status === "finished";

  const primaryButtonLabel = timer.status === "running" ? "Pause" : "Start";
  const primaryButtonVariant = timer.status === "running" ? "pause" : "start";
  const primaryButtonDisabled =
    timer.status === "running" ? !canPause : !canStart;

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
      configuredTime.minutes + delta,
      configuredTime.seconds,
    );
  }

  function changeSeconds(delta: number) {
    if (!canEditDuration) {
      return;
    }

    const totalSeconds =
      configuredTime.minutes * 60 + configuredTime.seconds + delta;

    const clampedTotalSeconds = clamp(totalSeconds, 0, 99 * 60 + 59);

    updateDurationFromMinutesSeconds(
      Math.floor(clampedTotalSeconds / 60),
      clampedTotalSeconds % 60,
    );
  }

  function handlePrimaryButton() {
    if (timer.status === "running") {
      handlePause();
      return;
    }

    handleStart();
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
      status: "stopped",
      remainingMs: currentTimer.durationMs,
    }));
  }

  return (
    <section className="w-full rounded-3xl border border-slate-800 bg-slate-900 p-5 text-slate-50 shadow-xl">
      <div className={dashboardGridClassName}>
        <div className="flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-950 p-5">
          <div>
            <p className="font-[family-name:var(--font-rajdhani)] text-lg font-bold uppercase tracking-[0.3em] text-cyan-300">
              Timersteuerung
            </p>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <TimerButton
              disabled={primaryButtonDisabled}
              variant={primaryButtonVariant}
              onClick={handlePrimaryButton}
            >
              {primaryButtonLabel}
            </TimerButton>

            <TimerButton
              disabled={!canReset}
              variant="reset"
              onClick={handleReset}
            >
              Reset
            </TimerButton>
          </div>

          <div className="mt-4 rounded-xl border border-slate-800 bg-slate-900 px-4 py-2 font-[family-name:var(--font-rajdhani)] text-lg uppercase tracking-wide text-slate-300">
            STATUS:{" "}
            <span className="font-bold text-cyan-200">
              {formatStatusLabel(timer.status)}
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-cyan-400/20 bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950/80 px-8 py-5 shadow-inner shadow-cyan-950/40">
          <div className="grid h-full items-center gap-8 2xl:grid-cols-[340px_minmax(0,1fr)]">
            <div
              className={`flex flex-col items-center justify-center rounded-2xl border border-cyan-400/10 bg-slate-950/35 px-4 py-3 transition ${
                canEditDuration ? "opacity-100" : "opacity-35"
              }`}
            >
              <div className="mb-1 grid w-[260px] grid-cols-[repeat(2,3rem)_1.5rem_repeat(2,3rem)] items-end gap-2">
                <div className="col-span-2 text-center font-[family-name:var(--font-rajdhani)] text-sm font-bold uppercase tracking-[0.25em] text-cyan-300">
                  Min
                </div>

                <div />

                <div className="col-span-2 text-center font-[family-name:var(--font-rajdhani)] text-sm font-bold uppercase tracking-[0.25em] text-cyan-300">
                  Sec
                </div>
              </div>

              <div className="grid w-[260px] grid-cols-[repeat(2,3rem)_1.5rem_repeat(2,3rem)] items-center gap-2">
                <DigitStepper
                  label="Minuten Zehnerstelle"
                  value={configuredMinutesDigits.tens}
                  disabled={!canEditDuration}
                  onIncrement={() => changeMinutes(10)}
                  onDecrement={() => changeMinutes(-10)}
                />

                <DigitStepper
                  label="Minuten Einerstelle"
                  value={configuredMinutesDigits.ones}
                  disabled={!canEditDuration}
                  onIncrement={() => changeMinutes(1)}
                  onDecrement={() => changeMinutes(-1)}
                />

                <span className="flex justify-center font-mono text-5xl font-bold tabular-nums text-cyan-300/50">
                  :
                </span>

                <DigitStepper
                  label="Sekunden Zehnerstelle"
                  value={configuredSecondsDigits.tens}
                  disabled={!canEditDuration}
                  onIncrement={() => changeSeconds(10)}
                  onDecrement={() => changeSeconds(-10)}
                />

                <DigitStepper
                  label="Sekunden Einerstelle"
                  value={configuredSecondsDigits.ones}
                  disabled={!canEditDuration}
                  onIncrement={() => changeSeconds(1)}
                  onDecrement={() => changeSeconds(-1)}
                />
              </div>
            </div>

            <div className="flex min-w-0 items-baseline justify-center font-mono tabular-nums">
              <span className="inline-block w-[2ch] text-right text-8xl font-bold leading-none  text-cyan-100 2xl:text-9xl">
                {displayedTime.minutes.toString().padStart(2, "0")}
              </span>

              <span className="inline-block w-[0.7ch] text-center text-8xl font-bold leading-none text-cyan-300/70 2xl:text-9xl">
                :
              </span>

              <span className="inline-block w-[2ch] text-left text-8xl font-bold leading-none text-cyan-100 2xl:text-9xl">
                {displayedTime.seconds.toString().padStart(2, "0")}
              </span>

              <span className="inline-block w-[4ch] text-left text-4xl font-semibold text-cyan-200/75 2xl:text-5xl">
                .{displayedTime.milliseconds.toString().padStart(3, "0")}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
