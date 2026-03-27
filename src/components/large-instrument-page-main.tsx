"use client";

import Link from "next/link";
import { withBasePath } from "@/lib/base-path";
import { useTranslation } from "@/lib/i18n/use-translation";

export function LargeInstrumentPageMain() {
  const { t } = useTranslation();
  return (
    <main className="mx-auto max-w-2xl px-5 sm:px-4 py-12">
      <h1 className="font-serif text-3xl text-stone-900 dark:text-stone-50">
        {t("largeInstrumentPage.title")}
      </h1>
      <p className="mt-4 text-sm text-stone-600 dark:text-stone-400">
        {t("largeInstrumentPage.intro")}
      </p>
      <p className="mt-8 text-sm leading-relaxed text-stone-700 dark:text-stone-300">
        {t("largeInstrumentPage.roomNote")}
      </p>
      <p className="mt-6 text-xs italic text-stone-500 dark:text-stone-400">
        {t("largeInstrumentPage.celloNote")}
      </p>
      <p className="mt-10">
        <Link
          href={withBasePath("/register?for=open-space")}
          className="text-sm font-medium text-amber-700 underline decoration-amber-700/70 underline-offset-2 hover:text-amber-600 dark:text-amber-400 dark:decoration-amber-400/80 dark:hover:text-amber-300"
        >
          {t("largeInstrumentPage.backToRegister")}
        </Link>
      </p>
    </main>
  );
}
