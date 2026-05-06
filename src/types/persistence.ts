import type { CurrentRunState } from "@/types/run";
import type { ScreenDefinition } from "@/types/screen";
import type { Team } from "@/types/team";

export type PersistedDashboardState = {
  activeScreenId: string;
  screens: ScreenDefinition[];
  teams: Team[];
  currentRun: CurrentRunState;
  autoEndRunWhenTimerFinished: boolean;
};
