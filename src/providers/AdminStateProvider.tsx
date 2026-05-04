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

  const { publishDisplayState } = useDisplayStateSocket();

  useEffect(() => {
    publishDisplayState({
      activeScreenId,
      screens,
      teams,
    });
  }, [activeScreenId, screens, teams, publishDisplayState]);

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
