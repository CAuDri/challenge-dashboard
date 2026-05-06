import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import type { DisplayState } from "../types/display";
import type { CurrentRunState } from "../types/run";
import type { ScreenDefinition } from "../types/screen";
import type { Team } from "../types/team";
import type { PersistedDashboardState } from "@/types/persistence";

const stateFilePath = resolve(
  process.env.DASHBOARD_STATE_FILE ?? ".data/dashboard-state.json",
);

let saveTimeout: NodeJS.Timeout | null = null;

function createPersistedStateFromDisplayState(
  displayState: DisplayState,
): PersistedDashboardState {
  return {
    activeScreenId: displayState.activeScreenId,
    screens: displayState.screens,
    teams: displayState.teams,
    currentRun: displayState.currentRun,
    autoEndRunWhenTimerFinished: displayState.autoEndRunWhenTimerFinished,
  };
}

function mergePersistedStateWithDefaults(
  persistedState: Partial<PersistedDashboardState>,
  defaultState: PersistedDashboardState,
): PersistedDashboardState {
  return {
    activeScreenId:
      typeof persistedState.activeScreenId === "string"
        ? persistedState.activeScreenId
        : defaultState.activeScreenId,

    screens: Array.isArray(persistedState.screens)
      ? persistedState.screens
      : defaultState.screens,

    teams: Array.isArray(persistedState.teams)
      ? persistedState.teams
      : defaultState.teams,

    currentRun: {
      ...defaultState.currentRun,
      ...(typeof persistedState.currentRun === "object" &&
      persistedState.currentRun !== null
        ? persistedState.currentRun
        : {}),

      // Safety reset after server restart.
      phase: "standby",
    },

    autoEndRunWhenTimerFinished:
      typeof persistedState.autoEndRunWhenTimerFinished === "boolean"
        ? persistedState.autoEndRunWhenTimerFinished
        : defaultState.autoEndRunWhenTimerFinished,
  };
}

export async function loadPersistedDashboardState(
  defaultState: PersistedDashboardState,
): Promise<PersistedDashboardState> {
  try {
    const fileContent = await readFile(stateFilePath, "utf8");
    const parsedState = JSON.parse(
      fileContent,
    ) as Partial<PersistedDashboardState>;

    return mergePersistedStateWithDefaults(parsedState, defaultState);
  } catch (error) {
    console.warn(
      `[state] no persisted state loaded, using defaults: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );

    return {
      ...defaultState,
      currentRun: {
        ...defaultState.currentRun,
        phase: "standby",
      },
    };
  }
}

export async function savePersistedDashboardState(
  displayState: DisplayState,
): Promise<void> {
  const persistedState = createPersistedStateFromDisplayState(displayState);

  await mkdir(dirname(stateFilePath), { recursive: true });

  await writeFile(
    stateFilePath,
    JSON.stringify(persistedState, null, 2),
    "utf8",
  );
}

export function savePersistedDashboardStateDebounced(
  displayState: DisplayState,
) {
  if (saveTimeout !== null) {
    clearTimeout(saveTimeout);
  }

  saveTimeout = setTimeout(() => {
    saveTimeout = null;

    savePersistedDashboardState(displayState).catch((error) => {
      console.error("[state] failed to save dashboard state", error);
    });
  }, 250);
}
