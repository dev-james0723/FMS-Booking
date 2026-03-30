"use client";

import Script from "next/script";
import { useTranslation } from "@/lib/i18n/use-translation";

/**
 * Elfsight Instagram feed — two specified D Festival posts for Story repost instructions.
 */
export function ElfsightDfestivalRepostWidget() {
  const { t } = useTranslation();
  return (
    <section className="mx-auto mt-10 max-w-lg text-left">
      <h2 className="font-serif text-lg text-stone-900 dark:text-stone-50">
        {t("reg.repostWidget.title")}
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-stone-600 dark:text-stone-400">
        {t("reg.repostWidget.body")}
      </p>
      <div className="mt-6 min-h-[200px] rounded-xl border border-stone-200 bg-stone-50 p-2 dark:border-stone-700 dark:bg-stone-900/60">
        <Script src="https://elfsightcdn.com/platform.js" strategy="lazyOnload" />
        <div
          className="elfsight-app-db1b3777-3935-4f51-b570-e49719b5bb33"
          data-elfsight-app-lazy
        />
      </div>
    </section>
  );
}
