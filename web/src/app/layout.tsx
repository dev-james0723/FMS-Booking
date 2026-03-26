import type { Metadata } from "next";
import { Cormorant_Garamond, DM_Sans } from "next/font/google";
import "./globals.css";
import { SiteChrome } from "@/components/site-chrome";

/** Avoid Prisma at build time when DB is unavailable (CI / local build without Postgres). */
export const dynamic = "force-dynamic";

const display = Cormorant_Garamond({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "600"],
});

const sans = DM_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "D Festival × 幻樂空間｜限時免費琴室體驗申請",
  description:
    "D Festival 青年鋼琴藝術節與 Fantasia Music Space 幻樂空間聯合企劃 — 登記、預約申請與禮遇一站式平台。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-HK" className={`${display.variable} ${sans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[#faf8f5] font-sans text-stone-900">
        <SiteChrome>{children}</SiteChrome>
      </body>
    </html>
  );
}
