/** Shared styles for piano studio vs open-space booking login CTAs (header, home, etc.). */

/** Same structure for every coloured nav CTA: 1px border + soft tint glow (blur/spread unified). */
const ctaShadowEmerald = "shadow-[0_4px_16px_rgba(6,78,59,0.26)]";
const ctaShadowBlue = "shadow-[0_4px_16px_rgba(30,58,138,0.33)]";
const ctaShadowSky = "shadow-[0_4px_16px_rgba(14,165,233,0.28)]";

const emeraldCtaShell = `rounded-full border border-emerald-500/40 bg-emerald-950 text-white ${ctaShadowEmerald} transition hover:border-emerald-400/50 hover:bg-emerald-900 active:bg-[#042f24] dark:border-emerald-500/35 dark:bg-emerald-950 dark:hover:border-emerald-400/45 dark:hover:bg-emerald-900`;

/** Logged-in booking CTA in desktop 「更多」menu — deep green (piano studio registration channel). */
export const navBookingPrimaryCtaMenuStudioClass =
  `flex min-h-[44px] w-full items-center justify-center ${emeraldCtaShell} px-3 py-2 text-center text-sm font-semibold`;

/**
 * Mobile drawer stack: same emerald chrome as `navBookingPrimaryCtaMenuStudioClass`, shared type scale with other drawer pills.
 */
export const navEmeraldDrawerStackClass =
  `inline-flex min-h-[44px] w-full items-center justify-center ${emeraldCtaShell} px-4 py-2 text-center text-xs font-semibold leading-snug sm:text-sm`;

const pianoCtaShell = `rounded-full border border-blue-700/55 bg-blue-900 text-white ${ctaShadowBlue} transition hover:bg-blue-950 dark:border-blue-600/50 dark:bg-blue-950 dark:hover:bg-blue-900`;

const openSpaceCtaShell = `rounded-full border border-sky-700/45 bg-sky-400 text-blue-950 ${ctaShadowSky} transition hover:bg-sky-300 dark:border-sky-600/40 dark:bg-sky-500 dark:text-sky-950 dark:hover:bg-sky-400`;

export const bookingNavLoginPianoClass =
  `inline-flex min-h-[44px] min-w-0 flex-1 items-center justify-center ${pianoCtaShell} px-2 py-2 text-center text-xs font-semibold leading-snug sm:px-3 sm:text-sm md:flex-none md:px-4`;

export const bookingNavLoginOpenSpaceClass =
  `inline-flex min-h-[44px] min-w-0 flex-1 items-center justify-center ${openSpaceCtaShell} px-2 py-2 text-center text-xs font-semibold leading-snug sm:px-3 sm:text-sm md:flex-none md:px-4`;

/** Full-width stacked row (mobile main-menu drawer). */
export const bookingNavLoginPianoDrawerClass =
  `inline-flex min-h-[44px] w-full items-center justify-center ${pianoCtaShell} px-4 py-2 text-center text-xs font-semibold leading-snug sm:text-sm`;

export const bookingNavLoginOpenSpaceDrawerClass =
  `inline-flex min-h-[44px] w-full items-center justify-center ${openSpaceCtaShell} px-4 py-2 text-center text-xs font-semibold leading-snug sm:text-sm`;

/** Open-space registration channel — pairs with sky login CTAs. */
export const navBookingPrimaryCtaMenuOpenSpaceClass =
  "flex min-h-[44px] w-full items-center justify-center rounded-full border border-sky-700/45 bg-sky-400 px-3 py-2 text-center text-sm font-semibold text-blue-950 shadow-[0_4px_16px_rgba(14,165,233,0.28)] transition hover:bg-sky-300 dark:border-sky-600/40 dark:bg-sky-500 dark:text-sky-950 dark:hover:bg-sky-400";
