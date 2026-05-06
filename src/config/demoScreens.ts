import type { ScreenDefinition } from "@/types/screen";

export const demoScreens: ScreenDefinition[] = [
  {
    id: "fallback",
    name: "Fallback Image",
    description: "Default display if no other screen is active.",
    type: "image",
  },
  {
    id: "timer-simple",
    name: "Simple Timer",
    description: "Fullscreen timer without additional run information.",
    type: "timer",
    config: {
      timer: {
        layout: "timer_only",
        showHeader: false,
        showLogo: false,
        showTeam: false,
        showDiscipline: false,
        showPhase: false,
        showCustomTitle: false,
        customTitle: "",
        showInfoText: false,
        infoText: "",
        useTeamColorAccent: false,
        timerScale: 1,
        showMilliseconds: "never",
      },
    },
  },
  {
    id: "timer-run-info",
    name: "Run Timer",
    description: "Timer screen with current team, discipline and run phase.",
    type: "timer",
    config: {
      timer: {
        layout: "run_info",
        showHeader: true,
        showLogo: true,
        showTeam: true,
        showDiscipline: true,
        showPhase: true,
        showCustomTitle: false,
        customTitle: "",
        showInfoText: false,
        infoText: "",
        useTeamColorAccent: true,
        timerScale: 1,
        showMilliseconds: "during_running",
      },
    },
  },
  {
    id: "scoreboard-freedrive",
    name: "Freedrive Course Results",
    description: "Manual reveal scoreboard for the Freedrive Course.",
    type: "scoreboard",
    config: {
      scoreboard: {
        disciplineId: "freedrive",
        revealMode: "manual",
      },
    },
  },
  {
    id: "scoreboard-obstacle-evasion",
    name: "Obstacle Evasion Course Results",
    description: "Manual reveal scoreboard for the Obstacle Evasion Course.",
    type: "scoreboard",
    config: {
      scoreboard: {
        disciplineId: "obstacle_evasion",
        revealMode: "manual",
      },
    },
  },
  {
    id: "scoreboard-navigation",
    name: "Navigation Course Results",
    description: "Manual reveal scoreboard for the Navigation Course.",
    type: "scoreboard",
    config: {
      scoreboard: {
        disciplineId: "navigation",
        revealMode: "manual",
      },
    },
  },
  {
    id: "presentation",
    name: "PDF Presentation",
    description: "Slideshow for welcome messages, rules or sponsors.",
    type: "pdf",
  },
  {
    id: "camera",
    name: "Camera Stream",
    description: "Live feed from a network or track camera.",
    type: "camera",
  },
];
