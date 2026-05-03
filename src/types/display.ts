import type { ScreenDefinition } from "@/types/screen";
import type { Team } from "@/types/team";

export type DisplayState = {
  activeScreenId: string;
  screens: ScreenDefinition[];
  teams: Team[];
};
