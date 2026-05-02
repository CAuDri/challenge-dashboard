export type DisciplineId = "freedrive" | "obstacle_evasion" | "navigation";

export type DisciplineDefinition = {
  id: DisciplineId;
  name: string;
};

export type TeamScoreMap = Record<DisciplineId, number>;

export type Team = {
  id: string;
  name: string;
  logoUrl?: string;
  participatingDisciplines: DisciplineId[];
  scores: TeamScoreMap;
};

export const disciplines: DisciplineDefinition[] = [
  {
    id: "freedrive",
    name: "Freedrive Course",
  },
  {
    id: "obstacle_evasion",
    name: "Obstacle Evasion Course",
  },
  {
    id: "navigation",
    name: "Navigation Course",
  },
];
