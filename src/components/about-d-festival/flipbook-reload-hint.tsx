"use client";

import type { ReactNode } from "react";

function IconReload({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
      />
    </svg>
  );
}

export function FlipbookReloadHint({
  children,
  ariaLabel,
}: {
  children: ReactNode;
  ariaLabel: string;
}) {
  return (
    <button
      type="button"
      onClick={() => window.location.reload()}
      aria-label={ariaLabel}
      className="group mx-auto mt-5 flex w-full max-w-xl items-center gap-3 rounded-xl border border-stone-300/90 bg-stone-100/95 px-4 py-3 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.6),0_4px_14px_rgba(15,23,42,0.08)] ring-1 ring-black/[0.04] transition hover:border-amber-500/50 hover:bg-amber-50/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500/70 dark:border-stone-600 dark:bg-stone-900/70 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_4px_18px_rgba(0,0,0,0.35)] dark:ring-white/10 dark:hover:border-amber-500/40 dark:hover:bg-stone-800/90"
    >
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-stone-300/80 bg-white text-stone-600 shadow-sm dark:border-stone-600 dark:bg-stone-800 dark:text-amber-200/90"
        aria-hidden
      >
        <IconReload className="h-5 w-5 transition group-hover:rotate-[-12deg]" />
      </span>
      <span className="text-[13px] leading-snug text-stone-700 dark:text-stone-200 sm:text-sm">
        {children}
      </span>
    </button>
  );
}
