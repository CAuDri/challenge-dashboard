import type { ScreenDefinition } from "@/types/screen";

export type DisplayState = {
  activeScreenId: string;
  screens: ScreenDefinition[];
};
