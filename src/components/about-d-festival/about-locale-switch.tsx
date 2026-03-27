"use client";

import { useEffect, type ReactNode } from "react";
import { useTranslation } from "@/lib/i18n/use-translation";

export function AboutDfestivalLocaleSwitch({
  zh,
  en,
}: {
  zh: ReactNode;
  en: ReactNode;
}) {
  const { locale } = useTranslation();

  useEffect(() => {
    document.title =
      locale === "en"
        ? "About 2026 D Festival Young Pianist Program | D Festival × Fantasia Music Space"
        : "關於 2026 D Festival 青年鋼琴家藝術節｜D Festival × 幻樂空間";
  }, [locale]);

  return <>{locale === "en" ? en : zh}</>;
}
