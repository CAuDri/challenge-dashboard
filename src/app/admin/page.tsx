import { AdminHeader } from "@/components/admin/AdminHeader";
import { ScreenSelectionPanel } from "@/components/admin/ScreenSelectionPanel";
import { TeamScorePanel } from "@/components/admin/TeamScorePanel";
import { TimerControlBar } from "@/components/admin/TimerControlBar";
import {
  dashboardContentClassName,
  dashboardGridClassName,
} from "@/config/layout";

export default function AdminPage() {
  return (
    <main className="flex min-h-screen flex-col bg-slate-950 text-slate-50">
      <AdminHeader />

      <div className={dashboardContentClassName}>
        <TimerControlBar />
      </div>

      <div
        className={`${dashboardContentClassName} ${dashboardGridClassName} flex-1 overflow-hidden py-6`}
      >
        <TeamScorePanel />
        <ScreenSelectionPanel />
      </div>
    </main>
  );
}
