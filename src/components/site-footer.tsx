"use client";

import { useTranslation } from "@/lib/i18n/use-translation";

export function SiteFooter() {
  const { tr } = useTranslation();
  return (
    <footer className="border-t border-stone-200 bg-[color:var(--chrome-bg)] py-8 text-center text-xs text-stone-500 backdrop-blur-md dark:border-stone-800 dark:text-stone-400">
      {tr("footer.line", { year: String(new Date().getFullYear()) })}
    </footer>
  );
}
