import { AdminHeader } from "@/components/admin/AdminHeader";
import { ScreenSelectionPanel } from "@/components/admin/ScreenSelectionPanel";
import { TeamScorePanel } from "@/components/admin/TeamScorePanel";
import { TimerControlBar } from "@/components/admin/TimerControlBar";

export default function AdminPage() {
  return (
    <main className="flex min-h-screen flex-col bg-slate-950 text-slate-50">
      <AdminHeader />

      <TimerControlBar />

      <div className="mx-auto grid w-full max-w-[1800px] flex-1 grid-cols-1 gap-6 overflow-hidden p-6 xl:grid-cols-[minmax(420px,1fr)_minmax(0,2fr)]">
        <TeamScorePanel />
        <ScreenSelectionPanel />
      </div>
    </main>
  );
}
