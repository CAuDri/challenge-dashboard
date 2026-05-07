import type { CurrentRunState } from "@/types/run";
import type { ScreenDefinition } from "@/types/screen";
import type { Team } from "@/types/team";
import type { CountdownTimerState } from "@/types/timer";
import type { TrafficLightState } from "@/types/traffic-light";
import type {
  DisplayClientInfo,
  DisplayControlState,
  DisplayDiagnostics,
} from "@/types/display-client";

export type DisplayState = {
  activeScreenId: string;
  screens: ScreenDefinition[];
  teams: Team[];
  currentRun: CurrentRunState;
  timer: CountdownTimerState;
  autoEndRunWhenTimerFinished: boolean;
  trafficLight: TrafficLightState;
  displayClients: DisplayClientInfo[];
  displayControl: DisplayControlState;
  diagnostics: DisplayDiagnostics;
};
