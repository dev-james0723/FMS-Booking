import type { Metadata } from "next";
import { AboutEnBody } from "@/components/about-d-festival/about-en-body";
import { AboutDfestivalLocaleSwitch } from "@/components/about-d-festival/about-locale-switch";
import { AboutZhBody } from "@/components/about-d-festival/about-zh-body";
import { dFestivalElfsightClassFromEnv } from "@/lib/about-d-festival-env";

export const metadata: Metadata = {
  title: "關於 2026 D Festival 青年鋼琴家藝術節｜D Festival × 幻樂空間",
  description:
    "D Festival 的使命、願景與動態 — 圖庫、Instagram 及 2026 精華小本電子場刊。",
};

export default function AboutDFestivalPage() {
  const dFestivalElfsightClass = dFestivalElfsightClassFromEnv();

  return (
    <AboutDfestivalLocaleSwitch
      zh={<AboutZhBody dFestivalElfsightClass={dFestivalElfsightClass} />}
      en={<AboutEnBody dFestivalElfsightClass={dFestivalElfsightClass} />}
    />
  );
}
