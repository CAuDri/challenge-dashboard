import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-slate-50">
      <section className="w-full max-w-xl rounded-3xl border border-slate-800 bg-slate-900 p-8 shadow-2xl">
        <p className="text-sm font-medium uppercase tracking-[0.3em] text-cyan-300">
          CAuDri-Challenge
        </p>

        <h1 className="mt-4 text-3xl font-bold">Dashboard</h1>

        <p className="mt-3 text-slate-400">
          Lokale Webapp zur Steuerung von Display, Screens, Timer und
          Punktetabelle.
        </p>

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <Link
            href="/admin"
            className="rounded-xl bg-cyan-400 px-4 py-3 text-center font-semibold text-slate-950 transition hover:bg-cyan-300"
          >
            Admin öffnen
          </Link>

          <Link
            href="/display"
            className="rounded-xl border border-slate-700 px-4 py-3 text-center font-semibold text-slate-100 transition hover:border-cyan-400"
          >
            Display öffnen
          </Link>
        </div>
      </section>
    </main>
  );
}
