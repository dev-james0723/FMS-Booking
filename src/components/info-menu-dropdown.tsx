"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { LanguageSwitchIcon } from "@/components/language-switch-icon";
import { useTranslation } from "@/lib/i18n/use-translation";
import { navDfestivalCtaClass } from "@/lib/nav-icon-button-classes";

const panelClass =
  "absolute right-0 z-50 mt-1 min-w-[min(100vw-2rem,18rem)] rounded-xl border border-stone-200 bg-[color:var(--chrome-bg)] py-1 shadow-lg dark:border-stone-700";

const itemClass =
  "flex w-full items-center gap-2 px-5 sm:px-4 py-2.5 text-left text-sm text-stone-800 transition hover:bg-stone-100 dark:text-stone-200 dark:hover:bg-stone-800";

const triggerClass =
  "inline-flex min-h-[44px] items-center gap-0.5 rounded-full border border-transparent px-1 text-sm text-stone-600 transition hover:border-stone-200 hover:text-stone-900 dark:text-stone-400 dark:hover:border-stone-600 dark:hover:text-stone-50";

const dividerClass = "my-1 border-t border-stone-200 dark:border-stone-700";

export function InfoMenuDropdown() {
  const { t, locale, toggleLocale } = useTranslation();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        className={triggerClass}
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((v) => !v)}
      >
        <span>{t("nav.infoMenu")}</span>
        <svg
          className={`ml-0.5 h-4 w-4 shrink-0 opacity-60 transition ${open ? "rotate-180" : ""}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {open ? (
        <div className={panelClass} role="menu">
          <div className="px-2 py-1.5" role="none">
            <Link
              href="/about-d-festival"
              className={navDfestivalCtaClass}
              role="menuitem"
              onClick={() => setOpen(false)}
            >
              {t("nav.aboutDfestival2026")}
            </Link>
          </div>
          <Link
            href="/faq"
            className={itemClass}
            role="menuitem"
            onClick={() => setOpen(false)}
          >
            {t("nav.faq")}
          </Link>
          <div className={dividerClass} role="separator" />
          <button
            type="button"
            className={itemClass}
            role="menuitem"
            onClick={() => {
              toggleLocale();
              setOpen(false);
            }}
          >
            <LanguageSwitchIcon className="h-5 w-5 shrink-0 opacity-80" />
            <span>
              {locale === "zh-HK" ? t("nav.switchToEnglish") : t("nav.switchToZh")}
            </span>
          </button>
          <Link
            href="/privacy"
            className={itemClass}
            role="menuitem"
            onClick={() => setOpen(false)}
          >
            {t("nav.privacyPolicy")}
          </Link>
          <Link
            href="/terms"
            className={itemClass}
            role="menuitem"
            onClick={() => setOpen(false)}
          >
            {t("nav.termsAndConditions")}
          </Link>
          <Link
            href="/contact"
            className={itemClass}
            role="menuitem"
            onClick={() => setOpen(false)}
          >
            {t("nav.contact")}
          </Link>
        </div>
      ) : null}
    </div>
  );
}
