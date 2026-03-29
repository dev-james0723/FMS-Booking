"use client";

import { useEffect, type ReactNode } from "react";
import { useTranslation } from "@/lib/i18n/use-translation";

export function FantasiaMusicSpaceLocaleSwitch({
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
        ? "About Fantasia Music Space | D Festival × Fantasia Music Space"
        : "關於幻樂空間 Fantasia Music Space｜D Festival × 幻樂空間";
  }, [locale]);

  return <>{locale === "en" ? en : zh}</>;
}
