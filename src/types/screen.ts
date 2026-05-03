export type ScreenType = "image" | "pdf" | "camera" | "timer" | "scoreboard";

export type ScreenDefinition = {
  id: string;
  name: string;
  description: string;
  type: ScreenType;
  thumbnailLabel: string;
};

export type ScreenDraft = {
  name: string;
  description: string;
  type: ScreenType;
  thumbnailLabel: string;
};

export type ScreenTypeDefinition = {
  id: ScreenType;
  name: string;
  description: string;
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
    description: "Dynamic ranking and score table.",
  },
];
