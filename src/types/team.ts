export type DisciplineId = "freedrive" | "obstacle_evasion" | "navigation";

export type DisciplineDefinition = {
  id: DisciplineId;
  name: string;
};

export type TeamScoreMap = Partial<Record<DisciplineId, number>>;

export type Team = {
  id: string;
  name: string;
  logoUrl?: string;
  logoFileName?: string;
  logoScale?: number;
  participatingDisciplines: DisciplineId[];
  scores: TeamScoreMap;
};

export type TeamDraft = {
  name: string;
  logoUrl?: string;
  logoFileName?: string;
  logoScale?: number;
  participatingDisciplines: DisciplineId[];
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
