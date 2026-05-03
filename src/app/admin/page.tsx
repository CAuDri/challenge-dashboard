import { AdminHeader } from "@/components/admin/AdminHeader";
import { AdminWorkspace } from "@/components/admin/AdminWorkspace";
import { TimerControlBar } from "@/components/admin/TimerControlBar";
import { dashboardContentClassName } from "@/config/layout";

export default function AdminPage() {
  return (
    <main className="flex min-h-screen flex-col bg-slate-950 text-slate-50">
      <AdminHeader />

      <div className={dashboardContentClassName}>
        <TimerControlBar />
      </div>

      <div className={`${dashboardContentClassName} flex min-h-0 flex-1 py-6`}>
        <AdminWorkspace />
      </div>
    </main>
  );
}
