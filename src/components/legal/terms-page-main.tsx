"use client";

import { useEffect } from "react";
import { LegalDocumentBody } from "@/components/legal/legal-document-body";
import { useTranslation } from "@/lib/i18n/use-translation";
import { termsIntroEn, termsSectionsEn, termsTitleEn } from "@/lib/legal/terms-en";
import {
  termsIntroZhHK,
  termsSectionsZhHK,
  termsTitleZhHK,
} from "@/lib/legal/terms-zh-hk";

export function TermsPageMain() {
  const { locale } = useTranslation();
  const isEn = locale === "en";

  useEffect(() => {
    document.title = isEn
      ? "Terms & conditions | D Festival × Fantasia Music Space"
      : "條款與細則｜D Festival × 幻樂空間";
  }, [isEn]);

  return (
    <main className="mx-auto max-w-3xl px-5 sm:px-4 py-12 pb-20">
      {isEn ? (
        <LegalDocumentBody title={termsTitleEn} intro={termsIntroEn} sections={termsSectionsEn} />
      ) : (
        <LegalDocumentBody title={termsTitleZhHK} intro={termsIntroZhHK} sections={termsSectionsZhHK} />
      )}
    </main>
  );
}
