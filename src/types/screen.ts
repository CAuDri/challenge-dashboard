import type { DisciplineId } from "@/types/team";

export type ScreenType = "image" | "pdf" | "camera" | "timer" | "scoreboard";

export type TimerMillisecondsMode = "always" | "during_running" | "never";

export type ImageScreenConfig = {
  imageUrl?: string;
  imageFileName?: string;
};

export type ScoreboardScreenConfig = {
  disciplineId: DisciplineId;
  revealMode: "manual";
};

export type ScreenConfig = {
  image?: ImageScreenConfig;
  scoreboard?: ScoreboardScreenConfig;
  timer?: TimerScreenConfig;
};

export type ScreenDefinition = {
  id: string;
  name: string;
  description: string;
  type: ScreenType;
  config?: ScreenConfig;
};

export type ScreenDraft = {
  name: string;
  description: string;
  type: ScreenType;
  config?: ScreenConfig;
};

export type ScreenTypeDefinition = {
  id: ScreenType;
  name: string;
  description: string;
};

export type TimerScreenLayout = "timer_only" | "run_info";

export type TimerScreenConfig = {
  layout: TimerScreenLayout;

  showHeader: boolean;
  showLogo: boolean;
  showTeam: boolean;
  showDiscipline: boolean;
  showPhase: boolean;

  showCustomTitle: boolean;
  customTitle?: string;

  showInfoText: boolean;
  infoText?: string;

  useTeamColorAccent: boolean;

  timerScale: number;
  showMilliseconds: TimerMillisecondsMode;
};

export const screenTypes: ScreenTypeDefinition[] = [
  {
    id: "image",
    name: "Image",
    description: "Static image or fallback slide.",
  },
  {
    id: "pdf",
    name: "PDF Presentation",
    description: "Presentation or slideshow controlled by the speaker.",
  },
  {
    id: "camera",
    name: "Camera Stream",
    description: "Network camera or track camera feed.",
  },
  {
    id: "timer",
    name: "Timer",
    description: "Countdown display with current team and discipline info.",
  },
  {
    id: "scoreboard",
    name: "Scoreboard",
    description: "Discipline-specific award reveal screen.",
  },
];
