"use client";

import { useEffect } from "react";
import { LegalDocumentBody } from "@/components/legal/legal-document-body";
import { useTranslation } from "@/lib/i18n/use-translation";
import {
  privacyIntroEn,
  privacySectionsEn,
  privacyTitleEn,
} from "@/lib/legal/privacy-en";
import {
  privacyIntroZhHK,
  privacySectionsZhHK,
  privacyTitleZhHK,
} from "@/lib/legal/privacy-zh-hk";

export function PrivacyPageMain() {
  const { locale } = useTranslation();
  const isEn = locale === "en";

  useEffect(() => {
    document.title = isEn
      ? "Privacy policy | D Festival × Fantasia Music Space"
      : "私隱條例（私隱政策）｜D Festival × 幻樂空間";
  }, [isEn]);

  return (
    <main className="mx-auto max-w-3xl px-5 sm:px-4 py-12 pb-20">
      {isEn ? (
        <LegalDocumentBody title={privacyTitleEn} intro={privacyIntroEn} sections={privacySectionsEn} />
      ) : (
        <LegalDocumentBody
          title={privacyTitleZhHK}
          intro={privacyIntroZhHK}
          sections={privacySectionsZhHK}
        />
      )}
    </main>
  );
}
