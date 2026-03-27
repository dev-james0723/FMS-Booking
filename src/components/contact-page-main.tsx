"use client";

import { useTranslation } from "@/lib/i18n/use-translation";

export function ContactPageMain() {
  const { t } = useTranslation();
  return (
    <main className="mx-auto max-w-2xl px-5 sm:px-4 py-12">
      <h1 className="font-serif text-3xl text-stone-900 dark:text-stone-50">{t("contact.title")}</h1>
      <p className="mt-4 text-sm text-stone-600 dark:text-stone-400">{t("contact.body")}</p>
    </main>
  );
}
