import Image from "next/image";

export function AdminHeader() {
  return (
    <header className="border-b border-slate-800 bg-slate-950 px-8 py-4 text-slate-50">
      <div className="mx-auto flex max-w-[1800px] items-center gap-5">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white p-2">
          <Image
            src="/caudri_logo.svg"
            alt="CAuDri Challenge Logo"
            width={44}
            height={44}
            priority
          />
        </div>

        <div>
          <p className="text-sm font-medium uppercase tracking-[0.35em] text-cyan-300">
            CAuDri Challenge
          </p>
          <h1 className="mt-1 text-3xl font-bold">Competition Dashboard</h1>
        </div>
      </div>
    </header>
  );
}
