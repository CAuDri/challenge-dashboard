import { ScreenTile } from "@/components/admin/ScreenTile";
import { demoScreens } from "@/config/demoScreens";

export function ScreenSelectionPanel() {
  return (
    <section className="flex h-full flex-col rounded-3xl border border-slate-800 bg-slate-900 text-slate-50 shadow-xl">
      <header className="flex items-center justify-between gap-4 border-b border-slate-800 px-5 py-4">
        <div>
          <h2 className="text-xl font-bold">Screens</h2>
          <p className="mt-1 text-sm text-slate-400">
            Doppelklick-Aktivierung folgt im nächsten Schritt.
          </p>
        </div>

        <button
          type="button"
          className="rounded-xl bg-cyan-400 px-4 py-2 font-semibold text-slate-950 transition hover:bg-cyan-300"
        >
          Add Screen
        </button>
      </header>

      <div className="flex-1 overflow-auto p-5">
        <div className="grid gap-5 lg:grid-cols-2 2xl:grid-cols-3">
          {demoScreens.map((screen) => (
            <ScreenTile key={screen.id} screen={screen} />
          ))}
        </div>
      </div>
    </section>
  );
}
