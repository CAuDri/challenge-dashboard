"use client";

import { ScreenSelectionPanel } from "@/components/admin/ScreenSelectionPanel";
import { TeamScorePanel } from "@/components/admin/TeamScorePanel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RunControlPanel } from "@/components/admin/RunControlPanel";
import { TrafficLightPanel } from "@/components/admin/TrafficLightPanel";

const tabTriggerClassName =
  "h-14 rounded-b-none rounded-t-2xl border border-b-0 border-slate-800 bg-slate-950 px-8 font-[family-name:var(--font-rajdhani)] text-xl font-bold uppercase tracking-wide text-slate-500 shadow-none transition " +
  "hover:border-cyan-400/40 hover:bg-slate-900 hover:text-cyan-100 " +
  "data-[state=active]:z-10 data-[state=active]:border-b-slate-900 data-[state=active]:bg-slate-900 data-[state=active]:text-cyan-100 data-[state=active]:shadow-none";

export function AdminWorkspace() {
  return (
    <Tabs
      defaultValue="teams"
      className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 text-slate-50 shadow-xl"
    >
      <div className="relative h-20 border-b border-slate-800 bg-slate-950/40 px-5">
        <TabsList className="absolute bottom-[+12px] left-5 h-14 gap-2 rounded-none bg-transparent p-0">
          <TabsTrigger value="teams" className={tabTriggerClassName}>
            Teams
          </TabsTrigger>

          <TabsTrigger value="screens" className={tabTriggerClassName}>
            Screens
          </TabsTrigger>

          <TabsTrigger value="run-control" className={tabTriggerClassName}>
            Run Control
          </TabsTrigger>

          <TabsTrigger value="traffic-light" className={tabTriggerClassName}>
            Traffic Light
          </TabsTrigger>
        </TabsList>

        <div className="hidden h-full items-center justify-end font-[family-name:var(--font-rajdhani)] text-sm font-semibold uppercase tracking-[0.3em] text-slate-600 md:flex">
          Admin Workspace
        </div>
      </div>

      <TabsContent
        value="teams"
        className="m-0 min-h-0 flex-1 data-[state=inactive]:hidden"
      >
        <TeamScorePanel />
      </TabsContent>

      <TabsContent
        value="screens"
        className="m-0 min-h-0 flex-1 data-[state=inactive]:hidden"
      >
        <ScreenSelectionPanel />
      </TabsContent>

      <TabsContent
        value="run-control"
        className="m-0 min-h-0 flex-1 data-[state=inactive]:hidden"
      >
        <RunControlPanel />
      </TabsContent>

      <TabsContent
        value="traffic-light"
        className="m-0 min-h-0 flex-1 data-[state=inactive]:hidden"
      >
        <TrafficLightPanel />
      </TabsContent>
    </Tabs>
  );
}
