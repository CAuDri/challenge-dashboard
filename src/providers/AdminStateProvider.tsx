"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { demoScreens } from "@/config/demoScreens";
import { useDisplayStateSocket } from "@/hooks/useDisplayStateSocket";
import { useCountdownTimer } from "@/hooks/useCountdownTimer";
import type { ScreenDefinition, ScreenDraft } from "@/types/screen";
import {
  disciplines,
  type DisciplineId,
  type Team,
  type TeamDraft,
} from "@/types/team";
import {
  nextRunPhaseOrder,
  type CurrentRunState,
  type RunPhase,
} from "@/types/run";

type CountdownTimerController = ReturnType<typeof useCountdownTimer>;

type AdminStateContextValue = {
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
  advanceRunPhase: () => void;
  setPreparationDurationMs: (durationMs: number) => void;
  setRunDurationMs: (durationMs: number) => void;
  autoEndRunWhenTimerFinished: boolean;
  setAutoEndRunWhenTimerFinished: (enabled: boolean) => void;
  startCurrentRunTimer: () => void;
  endCurrentRun: () => void;
};

const AdminStateContext = createContext<AdminStateContextValue | null>(null);

type AdminStateProviderProps = {
  children: ReactNode;
};

function createEmptyScores(participatingDisciplines: DisciplineId[]) {
  return Object.fromEntries(
    participatingDisciplines.map((disciplineId) => [disciplineId, 0]),
  );
}

const initialTeams: Team[] = [
  {
    id: "demo-team-1",
    name: "CAuDri Team",
    logoScale: 1,
    teamColor: "#22d3ee",
    participatingDisciplines: disciplines.map((discipline) => discipline.id),
    scores: createEmptyScores(disciplines.map((discipline) => discipline.id)),
  },
];

export function AdminStateProvider({ children }: AdminStateProviderProps) {
  const timer = useCountdownTimer();

  const [teams, setTeams] = useState<Team[]>(initialTeams);

  const [screens, setScreens] = useState<ScreenDefinition[]>(demoScreens);
  const [activeScreenId, setActiveScreenId] = useState("fallback");

  const [currentRun, setCurrentRun] = useState<CurrentRunState>({
    selectedTeamId: initialTeams[0]?.id,
    selectedDisciplineId: "freedrive",
    phase: "standby",
    preparationDurationMs: 30 * 1000,
    runDurationMs: 3 * 60 * 1000,
  });

  const [autoEndRunWhenTimerFinished, setAutoEndRunWhenTimerFinished] =
    useState(false);

  const { publishDisplayState } = useDisplayStateSocket();

  useEffect(() => {
    publishDisplayState({
      activeScreenId,
      screens,
      teams,
      currentRun,
      timer: timer.timer,
    });
  }, [
    activeScreenId,
    screens,
    teams,
    currentRun,
    timer.timer,
    publishDisplayState,
  ]);

  function addTeam(teamDraft: TeamDraft) {
    const teamId = crypto.randomUUID();

    setTeams((currentTeams) => [
      ...currentTeams,
      {
        id: teamId,
        name: teamDraft.name,
        logoUrl: teamDraft.logoUrl,
        logoFileName: teamDraft.logoFileName,
        logoScale: teamDraft.logoScale ?? 1,
        teamColor: teamDraft.teamColor,
        participatingDisciplines: teamDraft.participatingDisciplines,
        scores: createEmptyScores(teamDraft.participatingDisciplines),
      },
    ]);
  }

  function updateTeam(teamId: string, teamDraft: TeamDraft) {
    setTeams((currentTeams) =>
      currentTeams.map((team) => {
        if (team.id !== teamId) {
          return team;
        }

        const nextScores = { ...team.scores };

        for (const disciplineId of teamDraft.participatingDisciplines) {
          nextScores[disciplineId] ??= 0;
        }

        for (const disciplineId of Object.keys(nextScores) as DisciplineId[]) {
          if (!teamDraft.participatingDisciplines.includes(disciplineId)) {
            delete nextScores[disciplineId];
          }
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
    );
  }

  function deleteTeam(teamId: string) {
    setTeams((currentTeams) =>
      currentTeams.filter((team) => team.id !== teamId),
    );
  }

  function updateTeamScore(
    teamId: string,
    disciplineId: DisciplineId,
    score: number,
  ) {
    setTeams((currentTeams) =>
      currentTeams.map((team) =>
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
    );
  }

  function addScreen(screenDraft: ScreenDraft) {
    const screenId = crypto.randomUUID();

    setScreens((currentScreens) => [
      ...currentScreens,
      {
        id: screenId,
        name: screenDraft.name,
        description: screenDraft.description,
        type: screenDraft.type,
        thumbnailLabel: screenDraft.thumbnailLabel,
        config: screenDraft.config,
      },
    ]);
  }

  function updateScreen(screenId: string, screenDraft: ScreenDraft) {
    setScreens((currentScreens) =>
      currentScreens.map((screen) =>
        screen.id === screenId
          ? {
              ...screen,
              name: screenDraft.name,
              description: screenDraft.description,
              type: screenDraft.type,
              thumbnailLabel: screenDraft.thumbnailLabel,
              config: screenDraft.config,
            }
          : screen,
      ),
    );
  }

  function deleteScreen(screenId: string) {
    setScreens((currentScreens) =>
      currentScreens.filter((screen) => screen.id !== screenId),
    );

    setActiveScreenId((currentActiveScreenId) =>
      currentActiveScreenId === screenId ? "fallback" : currentActiveScreenId,
    );
  }

  function activateScreen(screenId: string) {
    setActiveScreenId(screenId);
  }

  function setCurrentRunTeamId(teamId: string | undefined) {
    setCurrentRun((currentRunState) => ({
      ...currentRunState,
      selectedTeamId: teamId,
    }));
  }

  function selectNextRunTeam(direction: -1 | 1) {
    setCurrentRun((currentRunState) => {
      if (teams.length === 0) {
        return {
          ...currentRunState,
          selectedTeamId: undefined,
        };
      }

      const currentIndex = teams.findIndex(
        (team) => team.id === currentRunState.selectedTeamId,
      );

      const safeCurrentIndex = currentIndex === -1 ? 0 : currentIndex;
      const nextIndex =
        (safeCurrentIndex + direction + teams.length) % teams.length;

      return {
        ...currentRunState,
        selectedTeamId: teams[nextIndex].id,
      };
    });
  }

  function setCurrentRunDisciplineId(disciplineId: DisciplineId | undefined) {
    setCurrentRun((currentRunState) => ({
      ...currentRunState,
      selectedDisciplineId: disciplineId,
    }));
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

    setCurrentRun((currentRunState) => ({
      ...currentRunState,
      phase,
    }));
  }

  function advanceRunPhase() {
    const currentIndex = nextRunPhaseOrder.indexOf(currentRun.phase);
    const safeCurrentIndex = currentIndex === -1 ? 0 : currentIndex;
    const nextPhase =
      nextRunPhaseOrder[(safeCurrentIndex + 1) % nextRunPhaseOrder.length];

    setRunPhase(nextPhase);
  }

  function setPreparationDurationMs(durationMs: number) {
    setCurrentRun((currentRunState) => ({
      ...currentRunState,
      preparationDurationMs: Math.max(0, Math.round(durationMs)),
    }));
  }

  function setRunDurationMs(durationMs: number) {
    setCurrentRun((currentRunState) => ({
      ...currentRunState,
      runDurationMs: Math.max(0, Math.round(durationMs)),
    }));
  }

  function startCurrentRunTimer() {
    if (currentRun.phase === "ready") {
      setCurrentRun((currentRunState) => ({
        ...currentRunState,
        phase: "running",
      }));
    }

    timer.startTimer();
  }

  function endCurrentRun() {
    timer.pauseTimer();

    setCurrentRun((currentRunState) => ({
      ...currentRunState,
      phase: "finish",
    }));
  }

  useEffect(() => {
    if (
      autoEndRunWhenTimerFinished &&
      currentRun.phase === "running" &&
      timer.timer.status === "finished"
    ) {
      setCurrentRun((currentRunState) => ({
        ...currentRunState,
        phase: "finish",
      }));
    }
  }, [autoEndRunWhenTimerFinished, currentRun.phase, timer.timer.status]);

  return (
    <AdminStateContext.Provider
      value={{
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
        advanceRunPhase,
        setPreparationDurationMs,
        setRunDurationMs,
        autoEndRunWhenTimerFinished,
        setAutoEndRunWhenTimerFinished,
        startCurrentRunTimer,
        endCurrentRun,
      }}
    >
      {children}
    </AdminStateContext.Provider>
  );
}

export function useAdminState() {
  const context = useContext(AdminStateContext);

  if (context === null) {
    throw new Error("useAdminState must be used within AdminStateProvider");
  }

  return context;
}
