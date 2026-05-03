import type { Metadata } from "next";
import { Rajdhani, Geist } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const rajdhani = Rajdhani({
  variable: "--font-rajdhani",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: "CAuDri-Challenge Dashboard",
  description: "Competition dashboard for the CAuDri-Challenge",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" className={cn("font-sans", geist.variable)}>
      <body className={`${rajdhani.variable} antialiased`}>{children}</body>
    </html>
  );
}
