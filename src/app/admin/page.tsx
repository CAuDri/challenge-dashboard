import { ScreenTile } from "@/components/admin/ScreenTile";
import { demoScreens } from "@/config/demoScreens";

export default function AdminPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <header className="border-b border-slate-800 bg-slate-950/80 px-8 py-6">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.3em] text-cyan-300">
              CAuDri Challenge
            </p>

            <h1 className="mt-2 text-3xl font-bold">Admin Console</h1>
          </div>

          <button
            type="button"
            className="rounded-xl bg-cyan-400 px-4 py-2 font-semibold text-slate-950 transition hover:bg-cyan-300"
          >
            Add Screen
          </button>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-8 py-8">
        <div className="mb-6">
          <h2 className="text-xl font-semibold">Screens</h2>

          <p className="mt-1 text-sm text-slate-400">
            Später kann ein Screen per Doppelklick auf dem Display aktiviert
            werden. Aktuell ist dies nur das statische UI-Grundgerüst.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {demoScreens.map((screen) => (
            <ScreenTile key={screen.id} screen={screen} />
          ))}
        </div>
      </section>
    </main>
  );
}
