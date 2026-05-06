"use client";

import { CountdownTimerState } from "@/types/timer";
import { useAdminState } from "@/providers/AdminStateProvider";
import { dashboardGridClassName } from "@/config/layout";

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
        aria-label={`${label} increase`}
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
        aria-label={`${label} decrease`}
      >
        ▼
      </button>
    </div>
  );
}

export function TimerControlBar() {
  const { timer: countdownTimer, estimatedOneWayLatencyMs } = useAdminState();

  const {
    timer,
    displayedTime,
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
  } = countdownTimer;

  const primaryButtonLabel = timer.status === "running" ? "Pause" : "Start";
  const primaryButtonVariant = timer.status === "running" ? "pause" : "start";
  const primaryButtonDisabled =
    timer.status === "running" ? !canPause : !canStart;

  function handlePrimaryButton() {
    if (timer.status === "running") {
      pauseTimer();
      return;
    }

    startTimer();
  }

  function handleReset() {
    if (!canReset) {
      return;
    }

    if (timer.status === "running") {
      const confirmed = window.confirm(
        "The timer is currently running. Do you really want to reset it?",
      );

      if (!confirmed) {
        return;
      }
    }

    resetTimer();
  }

  return (
    <section className="w-full rounded-3xl border border-slate-800 bg-slate-900 p-5 text-slate-50 shadow-xl">
      <div className={dashboardGridClassName}>
        <div className="flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-950 p-5">
          <div>
            <p className="font-[family-name:var(--font-rajdhani)] text-lg font-bold uppercase tracking-[0.3em] text-cyan-300">
              Timer Control
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

        <div className="relative rounded-2xl border border-cyan-400/20 bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950/80 px-8 py-5 shadow-inner shadow-cyan-950/40">
          <p className="absolute right-5 top-4 font-[family-name:var(--font-rajdhani)] text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100/35">
            Latency ~{Math.round(estimatedOneWayLatencyMs)}ms
          </p>

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
                  label="Minute tens digit"
                  value={configuredMinutesDigits.tens}
                  disabled={!canEditDuration}
                  onIncrement={() => changeMinutes(10)}
                  onDecrement={() => changeMinutes(-10)}
                />

                <DigitStepper
                  label="Minute ones digit"
                  value={configuredMinutesDigits.ones}
                  disabled={!canEditDuration}
                  onIncrement={() => changeMinutes(1)}
                  onDecrement={() => changeMinutes(-1)}
                />

                <span className="flex justify-center font-mono text-5xl font-bold tabular-nums text-cyan-300/50">
                  :
                </span>

                <DigitStepper
                  label="Second tens digit"
                  value={configuredSecondsDigits.tens}
                  disabled={!canEditDuration}
                  onIncrement={() => changeSeconds(10)}
                  onDecrement={() => changeSeconds(-10)}
                />

                <DigitStepper
                  label="Second ones digit"
                  value={configuredSecondsDigits.ones}
                  disabled={!canEditDuration}
                  onIncrement={() => changeSeconds(1)}
                  onDecrement={() => changeSeconds(-1)}
                />
              </div>
            </div>

            <div className="flex min-w-0 flex-col items-center justify-center gap-2">
              <div className="flex items-baseline justify-center font-mono tabular-nums">
                <span className="inline-block w-[2ch] text-right text-7xl font-bold leading-none tracking-[-0.08em] text-cyan-100 2xl:text-8xl">
                  {displayedTime.minutes.toString().padStart(2, "0")}
                </span>

                <span className="inline-block w-[0.7ch] text-center text-7xl font-bold leading-none tracking-[-0.08em] text-cyan-300/70 2xl:text-8xl">
                  :
                </span>

                <span className="inline-block w-[2ch] text-left text-7xl font-bold leading-none tracking-[-0.08em] text-cyan-100 2xl:text-8xl">
                  {displayedTime.seconds.toString().padStart(2, "0")}
                </span>

                <span className="inline-block w-[4ch] text-left text-4xl font-semibold tracking-[-0.08em] text-cyan-200/75 2xl:text-5xl">
                  .{displayedTime.milliseconds.toString().padStart(3, "0")}
                </span>
              </div>

            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
