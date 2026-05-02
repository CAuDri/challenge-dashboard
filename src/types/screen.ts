export type ScreenType = "image" | "pdf" | "camera" | "timer" | "scoreboard";

export type ScreenDefinition = {
  id: string;
  name: string;
  description: string;
  type: ScreenType;
  thumbnailLabel: string;
};
