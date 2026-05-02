import type { ReactNode } from "react";

type DisplayLayoutProps = {
  children: ReactNode;
};

export default function DisplayLayout({ children }: DisplayLayoutProps) {
  return (
    <div className="h-screen w-screen overflow-hidden bg-black text-white">
      {children}
    </div>
  );
}
