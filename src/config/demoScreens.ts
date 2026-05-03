import type { ScreenDefinition } from "@/types/screen";

export const demoScreens: ScreenDefinition[] = [
  {
    id: "fallback",
    name: "Fallback Image",
    description: "Default display if no other screen is active.",
    type: "image",
    thumbnailLabel: "Fallback",
  },
  {
    id: "scoreboard",
    name: "Scoreboard",
    description: "Dynamic overview of the current team ranking.",
    type: "scoreboard",
    thumbnailLabel: "Scores",
  },
  {
    id: "timer",
    name: "Lap Timer",
    description: "Timer with team and discipline information.",
    type: "timer",
    thumbnailLabel: "Timer",
  },
  {
    id: "presentation",
    name: "PDF Presentation",
    description: "Slideshow for welcome messages, rules or sponsors.",
    type: "pdf",
    thumbnailLabel: "PDF",
  },
  {
    id: "camera",
    name: "Camera Stream",
    description: "Live feed from a network or track camera.",
    type: "camera",
    thumbnailLabel: "Cam",
  },
];
