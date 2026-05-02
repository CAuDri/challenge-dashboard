import Image from "next/image";
import { dashboardContentClassName } from "@/config/layout";

export function AdminHeader() {
  return (
    <header className="bg-slate-950 py-7 text-slate-50">
      <div className={`${dashboardContentClassName} flex items-center gap-10`}>
        <div className="relative ml-1 h-[7rem] w-[15rem] shrink-0">
          <Image
            src="/caudri_logo.svg"
            alt="CAuDri-Challenge Logo"
            fill
            priority
            className="object-contain"
          />
        </div>

        <div className="font-[family-name:var(--font-rajdhani)] leading-none">
          <p className="text-2xl font-semibold uppercase tracking-[0.38em] text-cyan-300">
            CAuDri-Challenge
          </p>

          <h1 className="mt-2 text-6xl font-bold leading-none">
            Competition Dashboard
          </h1>
        </div>
      </div>
    </header>
  );
}
