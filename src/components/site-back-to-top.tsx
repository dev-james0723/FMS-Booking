"use client";

import { useCallback } from "react";
import { useTranslation } from "@/lib/i18n/use-translation";

function ChevronUpIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M6 15l6-6 6 6" />
    </svg>
  );
}

export function SiteBackToTop() {
  const { t } = useTranslation();

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, []);

  return (
    <div className="border-t border-stone-200 bg-[color:var(--chrome-bg)] backdrop-blur-md dark:border-stone-800">
      <div className="mx-auto flex max-w-5xl justify-center px-5 py-3 sm:px-4">
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-full border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 transition hover:border-stone-400 hover:bg-stone-50 dark:border-stone-600 dark:text-stone-200 dark:hover:border-stone-500 dark:hover:bg-stone-800/80"
          onClick={scrollToTop}
        >
          <ChevronUpIcon className="h-4 w-4 shrink-0 opacity-80" />
          <span>{t("footer.backToTop")}</span>
        </button>
      </div>
    </div>
  );
}
