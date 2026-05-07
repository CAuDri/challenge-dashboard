"use client";

import { createContext, useContext, type ReactNode } from "react";
import { createClientId } from "@/lib/createClientId";
import {
  useDisplayStateSocket,
  type RealtimeConnectionStatus,
} from "@/hooks/useDisplayStateSocket";
import { useServerCountdownTimer } from "@/hooks/useServerCountdownTimer";
import {
  disciplines,
  type DisciplineId,
  type Team,
  type TeamDraft,
  type TeamScoreMap,
} from "@/types/team";
import type { ScreenDefinition, ScreenDraft } from "@/types/screen";
import type { CurrentRunState, RunPhase } from "@/types/run";
import type {
  TrafficLightColor,
  TrafficLightConfigPatch,
  TrafficLightState,
} from "@/types/traffic-light";
import type {
  DisplayClientInfo,
  DisplayControlState,
  DisplayDiagnostics,
} from "@/types/display-client";

type CountdownTimerController = ReturnType<typeof useServerCountdownTimer>;

type AdminStateContextValue = {
  connectionStatus: RealtimeConnectionStatus;
  estimatedOneWayLatencyMs: number;

  timer: CountdownTimerController;

  teams: Team[];
  addTeam: (teamDraft: TeamDraft) => void;
  updateTeam: (teamId: string, teamDraft: TeamDraft) => void;
  deleteTeam: (teamId: string) => void;
  updateTeamScore: (
    teamId: string,
    disciplineId: DisciplineId,
    score: number,
  ) => void;

  screens: ScreenDefinition[];
  activeScreenId: string;
  addScreen: (screenDraft: ScreenDraft) => void;
  updateScreen: (screenId: string, screenDraft: ScreenDraft) => void;
  deleteScreen: (screenId: string) => void;
  activateScreen: (screenId: string) => void;

  currentRun: CurrentRunState;
  setCurrentRunTeamId: (teamId: string | undefined) => void;
  selectNextRunTeam: (direction: -1 | 1) => void;
  setCurrentRunDisciplineId: (disciplineId: DisciplineId | undefined) => void;
  setRunPhase: (phase: RunPhase) => void;
  setPreparationDurationMs: (durationMs: number) => void;
  setRunDurationMs: (durationMs: number) => void;
  startCurrentRunTimer: () => void;
  endCurrentRun: () => void;

  autoEndRunWhenTimerFinished: boolean;
  setAutoEndRunWhenTimerFinished: (enabled: boolean) => void;

  trafficLight: TrafficLightState;
  updateTrafficLightConfig: (patch: TrafficLightConfigPatch) => void;
  connectTrafficLight: () => void;
  commandTrafficLight: (color: TrafficLightColor) => void;

  displayClients: DisplayClientInfo[];
  displayControl: DisplayControlState;
  diagnostics: DisplayDiagnostics;
  setMainDisplayClientId: (clientId: string | undefined) => void;
  setDisplaySyncEnabled: (enabled: boolean) => void;
  reorderTeam: (teamId: string, direction: -1 | 1) => void;
};

const AdminStateContext = createContext<AdminStateContextValue | null>(null);

function createEmptyScores(
  participatingDisciplines: DisciplineId[],
): TeamScoreMap {
  return disciplines.reduce<TeamScoreMap>((scores, discipline) => {
    if (participatingDisciplines.includes(discipline.id)) {
      scores[discipline.id] = 0;
    }

    return scores;
  }, {});
}

type AdminStateProviderProps = {
  children: ReactNode;
};

export function AdminStateProvider({ children }: AdminStateProviderProps) {
  const {
    displayState,
    updateDashboardState,
    setActiveScreen,
    timerCommands,
    estimatedOneWayLatencyMs,
    connectionStatus,
    updateTrafficLightConfig,
    connectTrafficLight,
    commandTrafficLight,
    setMainDisplayClientId,
    setDisplaySyncEnabled,
  } = useDisplayStateSocket();

  const timer = useServerCountdownTimer(
    displayState.timer,
    timerCommands,
    estimatedOneWayLatencyMs,
  );

  const teams = displayState.teams;
  const screens = displayState.screens;
  const activeScreenId = displayState.activeScreenId;
  const currentRun = displayState.currentRun;
  const autoEndRunWhenTimerFinished = displayState.autoEndRunWhenTimerFinished;
  const trafficLight = displayState.trafficLight;
  const displayClients = displayState.displayClients;
  const displayControl = displayState.displayControl;
  const diagnostics = displayState.diagnostics;

  function addTeam(teamDraft: TeamDraft) {
    const teamId = createClientId();

    const nextTeam: Team = {
      id: teamId,
      name: teamDraft.name,
      logoUrl: teamDraft.logoUrl,
      logoFileName: teamDraft.logoFileName,
      logoScale: teamDraft.logoScale ?? 1,
      teamColor: teamDraft.teamColor ?? "#22d3ee",
      participatingDisciplines: teamDraft.participatingDisciplines,
      scores: createEmptyScores(teamDraft.participatingDisciplines),
    };

    updateDashboardState({
      teams: [...teams, nextTeam],
    });
  }

  function updateTeam(teamId: string, teamDraft: TeamDraft) {
    updateDashboardState({
      teams: teams.map((team) => {
        if (team.id !== teamId) {
          return team;
        }

        const nextScores = createEmptyScores(
          teamDraft.participatingDisciplines,
        );

        for (const disciplineId of teamDraft.participatingDisciplines) {
          nextScores[disciplineId] = team.scores[disciplineId] ?? 0;
        }

        return {
          ...team,
          name: teamDraft.name,
          logoUrl: teamDraft.logoUrl,
          logoFileName: teamDraft.logoFileName,
          logoScale: teamDraft.logoScale ?? 1,
          teamColor: teamDraft.teamColor ?? "#22d3ee",
          participatingDisciplines: teamDraft.participatingDisciplines,
          scores: nextScores,
        };
      }),
    });
  }

  function deleteTeam(teamId: string) {
    updateDashboardState({
      teams: teams.filter((team) => team.id !== teamId),
      currentRun:
        currentRun.selectedTeamId === teamId
          ? {
              ...currentRun,
              selectedTeamId: undefined,
            }
          : currentRun,
    });
  }

  function reorderTeam(teamId: string, direction: -1 | 1) {
    const currentIndex = teams.findIndex((team) => team.id === teamId);

    if (currentIndex === -1) {
      return;
    }

    const nextIndex = currentIndex + direction;

    if (nextIndex < 0 || nextIndex >= teams.length) {
      return;
    }

    const nextTeams = [...teams];
    const [team] = nextTeams.splice(currentIndex, 1);
    nextTeams.splice(nextIndex, 0, team);

    updateDashboardState({
      teams: nextTeams,
    });
  }

  function updateTeamScore(
    teamId: string,
    disciplineId: DisciplineId,
    score: number,
  ) {
    updateDashboardState({
      teams: teams.map((team) =>
        team.id === teamId
          ? {
              ...team,
              scores: {
                ...team.scores,
                [disciplineId]: score,
              },
            }
          : team,
      ),
    });
  }

  function addScreen(screenDraft: ScreenDraft) {
    const nextScreen: ScreenDefinition = {
      id: createClientId(),
      name: screenDraft.name,
      description: screenDraft.description,
      type: screenDraft.type,
      config: screenDraft.config,
    };

    updateDashboardState({
      screens: [...screens, nextScreen],
    });
  }

  function updateScreen(screenId: string, screenDraft: ScreenDraft) {
    updateDashboardState({
      screens: screens.map((screen) =>
        screen.id === screenId
          ? {
              ...screen,
              name: screenDraft.name,
              description: screenDraft.description,
              type: screenDraft.type,
              config: screenDraft.config,
            }
          : screen,
      ),
    });
  }

  function deleteScreen(screenId: string) {
    const nextScreens = screens.filter((screen) => screen.id !== screenId);

    const fallbackScreenId =
      nextScreens.find((screen) => screen.id === "fallback")?.id ??
      nextScreens[0]?.id ??
      "fallback";

    updateDashboardState({
      screens: nextScreens,
      activeScreenId:
        activeScreenId === screenId ? fallbackScreenId : activeScreenId,
    });
  }

  function activateScreen(screenId: string) {
    setActiveScreen(screenId);
  }

  function setCurrentRunTeamId(teamId: string | undefined) {
    updateDashboardState({
      currentRun: {
        ...currentRun,
        selectedTeamId: teamId,
      },
    });
  }

  function selectNextRunTeam(direction: -1 | 1) {
    if (teams.length === 0) {
      setCurrentRunTeamId(undefined);
      return;
    }

    const currentIndex = teams.findIndex(
      (team) => team.id === currentRun.selectedTeamId,
    );

    const safeCurrentIndex = currentIndex === -1 ? 0 : currentIndex;
    const nextIndex =
      (safeCurrentIndex + direction + teams.length) % teams.length;

    setCurrentRunTeamId(teams[nextIndex].id);
  }

  function setCurrentRunDisciplineId(disciplineId: DisciplineId | undefined) {
    updateDashboardState({
      currentRun: {
        ...currentRun,
        selectedDisciplineId: disciplineId,
      },
    });
  }

  function setRunPhase(phase: RunPhase) {
    if (phase === "preparation") {
      timer.setDurationMs(currentRun.preparationDurationMs);
    }

    if (phase === "ready") {
      timer.setDurationMs(currentRun.runDurationMs);
    }

    if (phase === "running" && currentRun.phase !== "ready") {
      timer.setDurationMs(currentRun.runDurationMs);
    }

    updateDashboardState({
      currentRun: {
        ...currentRun,
        phase,
      },
    });
  }

  function setPreparationDurationMs(durationMs: number) {
    updateDashboardState({
      currentRun: {
        ...currentRun,
        preparationDurationMs: Math.max(0, Math.round(durationMs)),
      },
    });
  }

  function setRunDurationMs(durationMs: number) {
    updateDashboardState({
      currentRun: {
        ...currentRun,
        runDurationMs: Math.max(0, Math.round(durationMs)),
      },
    });
  }

  function startCurrentRunTimer() {
    if (currentRun.phase === "ready") {
      updateDashboardState({
        currentRun: {
          ...currentRun,
          phase: "running",
        },
      });
    }

    timer.startTimer();
  }

  function endCurrentRun() {
    timer.finishTimer();

    updateDashboardState({
      currentRun: {
        ...currentRun,
        phase: "finish",
      },
    });
  }

  function setAutoEndRunWhenTimerFinished(enabled: boolean) {
    updateDashboardState({
      autoEndRunWhenTimerFinished: enabled,
    });
  }

  return (
    <AdminStateContext.Provider
      value={{
        connectionStatus,
        estimatedOneWayLatencyMs,

        timer,

        teams,
        addTeam,
        updateTeam,
        deleteTeam,
        updateTeamScore,

        screens,
        activeScreenId,
        addScreen,
        updateScreen,
        deleteScreen,
        activateScreen,

        currentRun,
        setCurrentRunTeamId,
        selectNextRunTeam,
        setCurrentRunDisciplineId,
        setRunPhase,
        setPreparationDurationMs,
        setRunDurationMs,
        startCurrentRunTimer,
        endCurrentRun,

        autoEndRunWhenTimerFinished,
        setAutoEndRunWhenTimerFinished,

        trafficLight,
        updateTrafficLightConfig,
        connectTrafficLight,
        commandTrafficLight,

        displayClients,
        displayControl,
        diagnostics,
        setMainDisplayClientId,
        setDisplaySyncEnabled,
        reorderTeam,
      }}
    >
      {children}
    </AdminStateContext.Provider>
  );
}

export function useAdminState() {
  const context = useContext(AdminStateContext);

  if (!context) {
    throw new Error("useAdminState must be used within AdminStateProvider");
  }

  return context;
}
