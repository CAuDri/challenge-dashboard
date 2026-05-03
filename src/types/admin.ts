export type AdminTabId = "teams" | "screens";

export type AdminTabDefinition = {
  id: AdminTabId;
  label: string;
  description: string;
};
