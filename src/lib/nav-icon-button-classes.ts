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
