"use client";

import { useEffect } from "react";
import { useTranslation } from "@/lib/i18n/use-translation";
import { FaqEnContent } from "@/components/faq/faq-en-content";
import { FaqZhContent } from "@/components/faq/faq-zh-content";

export function FaqView() {
  const { locale } = useTranslation();

  useEffect(() => {
    document.title =
      locale === "en"
        ? "FAQ | D Festival × Fantasia Music Space"
        : "常見問題（FAQ）｜D Festival × 幻樂空間";
  }, [locale]);

  return locale === "en" ? <FaqEnContent /> : <FaqZhContent />;
}
