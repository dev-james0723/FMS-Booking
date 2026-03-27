/**
 * Shared nav icon buttons (home + theme toggle).
 * Light = original Demo scheme: transparent on chrome, stone border, stone-50 hover fill.
 * Dark = explicit near-black panel so the control reads on dark chrome (no reliance on html.dark for the toggle).
 */
export const navIconButtonMd = {
  light:
    "inline-flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-lg border border-stone-300 bg-transparent text-stone-800 shadow-none transition hover:border-stone-900 hover:bg-stone-50",
  dark: "inline-flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-lg border border-stone-600 bg-transparent text-stone-200 transition hover:border-stone-400 hover:bg-stone-900",
} as const;

export const navIconButtonSm = {
  light:
    "inline-flex h-9 w-9 items-center justify-center rounded-lg border border-stone-300 bg-transparent text-stone-800 transition hover:border-stone-900 hover:bg-stone-50",
  dark: "inline-flex h-9 w-9 items-center justify-center rounded-lg border border-stone-600 bg-transparent text-stone-200 transition hover:border-stone-400 hover:bg-stone-900",
} as const;

/** Home link: Demo light shell + Tailwind `dark:` when the document is in dark theme. */
export const navIconButtonMdHome = `${navIconButtonMd.light} dark:border-stone-600 dark:bg-transparent dark:text-stone-200 dark:hover:border-stone-400 dark:hover:bg-stone-900`;
export const navIconButtonSmHome = `${navIconButtonSm.light} dark:border-stone-600 dark:bg-transparent dark:text-stone-200 dark:hover:border-stone-400 dark:hover:bg-stone-900`;

/** Gold CTA for “About 2026 D Festival” — match register/login: min-h, px, rounded-full, full width in stacks. */
export const navDfestivalCtaClass =
  "inline-flex min-h-[44px] w-full items-center justify-center rounded-full border border-amber-600/35 bg-gradient-to-b from-[#c9a227] via-[#a67c1a] to-[#6b4e14] px-5 sm:px-4 py-2 text-center text-sm font-semibold leading-snug text-white shadow-[0_6px_20px_rgba(107,78,20,0.35)] ring-1 ring-amber-300/40 transition hover:from-[#d4ae32] hover:via-[#b88922] hover:to-[#7a5a18] hover:ring-amber-200/50 dark:ring-amber-400/20 dark:hover:ring-amber-300/35";
