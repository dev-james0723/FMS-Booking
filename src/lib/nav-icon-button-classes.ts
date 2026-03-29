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

const navDfestivalCtaVisual =
  "inline-flex min-h-[44px] items-center justify-center rounded-full border border-amber-600/35 bg-gradient-to-b from-[#c9a227] via-[#a67c1a] to-[#6b4e14] py-2 text-center font-semibold leading-snug text-white shadow-[0_6px_20px_rgba(107,78,20,0.35)] ring-1 ring-amber-300/40 transition hover:from-[#d4ae32] hover:via-[#b88922] hover:to-[#7a5a18] hover:ring-amber-200/50 dark:ring-amber-400/20 dark:hover:ring-amber-300/35";

/** Gold CTA for “About 2026 D Festival” — match register/login: min-h, px, rounded-full, full width in stacks. */
export const navDfestivalCtaClass = `${navDfestivalCtaVisual} w-full px-5 sm:px-4 text-sm`;

/** Narrow mobile drawer: smaller type + nowrap so long zh titles stay on one line. */
export const navDfestivalCtaMobileDrawerClass = `${navDfestivalCtaVisual} w-full whitespace-nowrap px-2.5 py-2 text-[11px] font-semibold leading-tight sm:px-3 sm:text-xs`;

/** Same look as `navDfestivalCtaClass` but tighter horizontal padding for the desktop “More” menu. */
export const navDfestivalCtaMenuClass = `${navDfestivalCtaVisual.replace(
  "inline-flex",
  "flex",
)} w-full max-w-none min-w-0 px-3 text-sm text-center`;

/** Same CTA for desktop header bar (inline pill; cap width so long copy wraps inside the pill, not into neighbors). */
export const navDfestivalCtaHeaderInlineClass = `${navDfestivalCtaVisual} w-auto max-w-[min(19rem,46vw)] shrink-0 px-3 text-xs sm:text-sm md:max-w-[min(22rem,40vw)]`;

const navFantasiaCtaVisual =
  "inline-flex min-h-[44px] items-center justify-center rounded-full border border-[#4a1520]/45 bg-gradient-to-b from-[#9a2d3e] via-[#722F37] to-[#511922] py-2 text-center font-semibold leading-snug text-white shadow-[0_6px_20px_rgba(81,25,34,0.42)] ring-1 ring-[#c97b86]/30 transition hover:from-[#a83447] hover:via-[#803542] hover:to-[#5c1f28] hover:ring-[#d4a0a8]/40 dark:ring-[#c97b86]/20 dark:hover:ring-[#d4a0a8]/30";

/** Burgundy CTA for “About Fantasia Music Space” — paired styling with D Festival gold CTA. */
export const navFantasiaCtaClass = `${navFantasiaCtaVisual} w-full px-5 sm:px-4 text-sm`;

/** Tighter padding for the desktop “More” menu (pairs with `navDfestivalCtaMenuClass`). */
export const navFantasiaCtaMenuClass = `${navFantasiaCtaVisual.replace(
  "inline-flex",
  "flex",
)} w-full max-w-none min-w-0 px-3 text-sm text-center`;

export const navFantasiaCtaHeaderInlineClass = `${navFantasiaCtaVisual} w-auto max-w-[min(13rem,42vw)] shrink-0 px-4 text-xs sm:text-sm`;
