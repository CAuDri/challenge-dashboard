export type DisplayClientStatus = "connected" | "disconnected";

export type DisplayClientInfo = {
  id: string;
  socketId: string;
  name: string;
  status: DisplayClientStatus;
  ipAddress?: string;
  hostname?: string;
  userAgent?: string;
  activeScreenId?: string;
  activeScreenName?: string;
  activeScreenType?: string;
  connectedAtServerMs: number;
  lastSeenAtServerMs: number;
  disconnectedAtServerMs?: number;
};

export type DisplayPdfRuntimeState = {
  page: number;
  pageCount: number;
  updatedByClientId?: string;
  updatedAtServerMs: number;
};

export type DisplayScoreboardRuntimeState = {
  revealedCount: number;
  totalCount: number;
  updatedByClientId?: string;
  updatedAtServerMs: number;
};

export type DisplayControlState = {
  syncEnabled: boolean;
  mainDisplayClientId?: string;
  pdfPages: Record<string, DisplayPdfRuntimeState>;
  scoreboardReveals: Record<string, DisplayScoreboardRuntimeState>;
};

export type DisplayDiagnostics = {
  serverNowMs: number;
  activeScreenId: string;
  timerStatus: string;
  currentRunPhase: string;
  displayClientCount: number;
  connectedDisplayClientCount: number;
};
