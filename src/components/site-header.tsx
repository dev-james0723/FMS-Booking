"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
  type TransitionEvent,
} from "react";
import { InfoMenuDropdown } from "@/components/info-menu-dropdown";
import { LanguageSwitchIcon } from "@/components/language-switch-icon";
import { ThemeToggle } from "@/components/theme-toggle";
import { useTranslation } from "@/lib/i18n/use-translation";
import {
  navDfestivalCtaMobileDrawerClass,
  navFantasiaCtaClass,
  navIconButtonMdHome,
} from "@/lib/nav-icon-button-classes";
import { bookingNavEntryLabel, useSiteMe } from "@/lib/auth/use-site-me";
import {
  bookingNavLoginOpenSpaceClass,
  bookingNavLoginOpenSpaceDrawerClass,
  bookingNavLoginPianoClass,
  bookingNavLoginPianoDrawerClass,
  navBookingPrimaryCtaMenuStudioClass,
} from "@/lib/booking-nav-login-button-classes";

const MOBILE_MAX_WIDTH_QUERY = "(max-width: 767px)";

const btnOutline =
  "inline-flex min-h-[44px] items-center justify-center rounded-full border border-stone-300 dark:border-stone-600 px-5 sm:px-4 py-2 text-sm text-stone-800 dark:text-stone-200 transition hover:border-stone-900 hover:bg-stone-50 dark:hover:border-stone-400 dark:hover:bg-stone-800";
/** Mobile main-menu drawer only: deep green CTA, white type. */
const btnRegisterMobileDrawer =
  "inline-flex min-h-[44px] w-full items-center justify-center rounded-full border border-emerald-950/80 bg-emerald-950 px-5 py-2 text-center text-sm font-semibold text-white shadow-[0_4px_18px_rgba(6,78,59,0.4)] ring-1 ring-emerald-800/50 transition hover:bg-emerald-900 hover:ring-emerald-700/55 active:bg-[#042f24] dark:border-emerald-900/90 dark:bg-emerald-950 dark:hover:bg-emerald-900";
const linkPlain =
  "inline-flex min-h-[44px] items-center text-sm text-stone-600 transition hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-50";

const REGISTRATION_BANNER_DISMISSED_KEY = "fms-registration-banner-dismissed";
const REGISTRATION_BANNER_STORE_EVENT = "fms-registration-banner-dismissed-change";

function readRegistrationBannerDismissedFromStorage(): boolean {
  try {
    return localStorage.getItem(REGISTRATION_BANNER_DISMISSED_KEY) === "1";
  } catch {
    return false;
  }
}

const CHROME_SCROLL_SHOW_TOP_PX = 40;
/** Min scrollY delta (px) per event to count as direction (scroll path; touch / scrollbar). */
const CHROME_SCROLL_DIRECTION_EPS = 1;
/** Ignore tiny wheel deltas (trackpad noise). */
const CHROME_WHEEL_INTENT_EPS = 0.5;
/** After hiding chrome, briefly ignore "scroll up" so layout/scroll-anchoring settle does not flash the bar back. */
const CHROME_POST_HIDE_IGNORE_SHOW_MS = 120;
/** Until ResizeObserver runs (SSR / first paint), reserve space so content is not covered. */
const CHROME_SHELL_HEIGHT_FALLBACK_PX = 104;

function CloseIconSm({ className }: { className?: string }) {
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
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}

function HomeIcon({ className }: { className?: string }) {
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
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 10v10a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V10" />
    </svg>
  );
}

function UserIcon({ className }: { className?: string }) {
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
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function MobileNavZipItem({
  index,
  className = "",
  children,
}: {
  index: number;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={`mobile-nav-zip-item ${className}`}
      style={{ "--zip-index": index } as CSSProperties & { "--zip-index": number }}
    >
      {children}
    </div>
  );
}

function MobileMenuHamburgerGlyph({ open }: { open: boolean }) {
  return open ? (
    <svg
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <path d="M6 18L18 6M6 6l12 12" />
    </svg>
  ) : (
    <svg
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

export function SiteHeader() {
  const pathname = usePathname();
  const { t, locale, toggleLocale } = useTranslation();
  const homeAriaLabel = t("nav.homeAria");
  const [menuOpen, setMenuOpen] = useState(false);
  const { user: meUser, bookingHref } = useSiteMe();

  const [registrationBannerDismissed, setRegistrationBannerDismissed] = useState(false);

  const shellRef = useRef<HTMLDivElement>(null);
  const mobileDrawerCloseRef = useRef<HTMLButtonElement>(null);
  const [shellHeight, setShellHeight] = useState(0);
  const [shellReady, setShellReady] = useState(false);
  const [chromeHiddenByScroll, setChromeHiddenByScroll] = useState(false);
  const lastScrollY = useRef(0);
  const ignoreShowChromeUntil = useRef(0);
  const [reduceScrollChromeMotion, setReduceScrollChromeMotion] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  /** Overlay mounted (includes exit animation after menuOpen false). */
  const [mobileDrawerPresent, setMobileDrawerPresent] = useState(false);
  /** Entered state: backdrop + panel visible (slide / fade). */
  const [mobileDrawerEntered, setMobileDrawerEntered] = useState(false);

  useLayoutEffect(() => {
    const mq = window.matchMedia(MOBILE_MAX_WIDTH_QUERY);
    const sync = () => setIsMobile(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useLayoutEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduceScrollChromeMotion(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (!isMobile) {
      queueMicrotask(() => {
        setMobileDrawerPresent(false);
        setMobileDrawerEntered(false);
      });
      return;
    }

    if (reduceScrollChromeMotion) {
      queueMicrotask(() => {
        setMobileDrawerPresent(menuOpen);
        setMobileDrawerEntered(menuOpen);
      });
      return;
    }

    let raf1 = 0;
    let raf2 = 0;
    if (menuOpen) {
      queueMicrotask(() => setMobileDrawerPresent(true));
      raf1 = requestAnimationFrame(() => {
        raf2 = requestAnimationFrame(() => setMobileDrawerEntered(true));
      });
    } else {
      queueMicrotask(() => setMobileDrawerEntered(false));
    }

    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, [isMobile, menuOpen, reduceScrollChromeMotion]);

  /** If transitionend is missed, unmount overlay after close animation budget. */
  useEffect(() => {
    if (!isMobile || reduceScrollChromeMotion || menuOpen || !mobileDrawerPresent) return;
    const t = window.setTimeout(() => setMobileDrawerPresent(false), 420);
    return () => window.clearTimeout(t);
  }, [isMobile, menuOpen, mobileDrawerPresent, reduceScrollChromeMotion]);

  useEffect(() => {
    lastScrollY.current = Math.max(0, window.scrollY);
    ignoreShowChromeUntil.current = 0;
    queueMicrotask(() => {
      setChromeHiddenByScroll(false);
      setMenuOpen(false);
      setMobileDrawerPresent(false);
      setMobileDrawerEntered(false);
    });
  }, [pathname]);

  useLayoutEffect(() => {
    const el = shellRef.current;
    if (!el) return;
    const apply = () => {
      setShellHeight(Math.round(el.getBoundingClientRect().height));
      setShellReady(true);
    };
    const ro = new ResizeObserver(apply);
    ro.observe(el);
    apply();
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (reduceScrollChromeMotion) return;

    const applyChromeTop = (y: number) => {
      setChromeHiddenByScroll(false);
      lastScrollY.current = y;
      ignoreShowChromeUntil.current = 0;
    };

    const applyScrollChrome = () => {
      if (menuOpen || mobileDrawerPresent) return;
      const y = Math.max(0, window.scrollY);
      if (y < CHROME_SCROLL_SHOW_TOP_PX) {
        applyChromeTop(y);
        return;
      }
      const delta = y - lastScrollY.current;
      lastScrollY.current = y;
      if (Math.abs(delta) < CHROME_SCROLL_DIRECTION_EPS) return;

      const nextHidden = delta > 0;
      const now = performance.now();
      setChromeHiddenByScroll((prevHidden) => {
        if (nextHidden === prevHidden) return prevHidden;
        if (nextHidden) {
          ignoreShowChromeUntil.current = now + CHROME_POST_HIDE_IGNORE_SHOW_MS;
          return true;
        }
        if (now < ignoreShowChromeUntil.current) return prevHidden;
        ignoreShowChromeUntil.current = 0;
        return false;
      });
    };

    /** Wheel fires before scrollY updates — use deltaY for immediate hide/show on trackpad / mouse wheel. */
    const onWheel = (e: WheelEvent) => {
      if (menuOpen || mobileDrawerPresent) return;
      if (e.ctrlKey) return;
      const y = Math.max(0, window.scrollY);
      if (y < CHROME_SCROLL_SHOW_TOP_PX) {
        applyChromeTop(y);
        return;
      }
      const dy = e.deltaY;
      if (Math.abs(dy) < CHROME_WHEEL_INTENT_EPS) return;
      const now = performance.now();
      if (dy > 0) {
        setChromeHiddenByScroll((prev) => {
          if (prev) return prev;
          ignoreShowChromeUntil.current = now + CHROME_POST_HIDE_IGNORE_SHOW_MS;
          return true;
        });
      } else {
        setChromeHiddenByScroll((prev) => {
          if (!prev) return prev;
          if (now < ignoreShowChromeUntil.current) return prev;
          ignoreShowChromeUntil.current = 0;
          return false;
        });
      }
    };

    const onScroll = () => {
      if (menuOpen || mobileDrawerPresent) return;
      applyScrollChrome();
    };

    window.addEventListener("wheel", onWheel, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("scroll", onScroll);
    };
  }, [menuOpen, mobileDrawerPresent, reduceScrollChromeMotion]);

  /** Top chrome translated away — independent of mobile menu (FAB opens overlay while hidden). */
  const chromeCollapsed = chromeHiddenByScroll;

  useLayoutEffect(() => {
    if (!isMobile || !mobileDrawerEntered) return;
    mobileDrawerCloseRef.current?.focus();
  }, [isMobile, mobileDrawerEntered]);

  useEffect(() => {
    if (!isMobile || !mobileDrawerPresent) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isMobile, mobileDrawerPresent]);

  useEffect(() => {
    if (!isMobile || !mobileDrawerPresent) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isMobile, mobileDrawerPresent]);

  function onMobileDrawerPanelTransitionEnd(e: TransitionEvent<HTMLDivElement>) {
    if (reduceScrollChromeMotion) return;
    if (e.propertyName !== "transform") return;
    if (!menuOpen) setMobileDrawerPresent(false);
  }

  useEffect(() => {
    const sync = () => setRegistrationBannerDismissed(readRegistrationBannerDismissedFromStorage());
    queueMicrotask(sync);
    window.addEventListener("storage", sync);
    window.addEventListener(REGISTRATION_BANNER_STORE_EVENT, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(REGISTRATION_BANNER_STORE_EVENT, sync);
    };
  }, []);

  function dismissRegistrationBanner() {
    try {
      localStorage.setItem(REGISTRATION_BANNER_DISMISSED_KEY, "1");
    } catch {
      /* ignore */
    }
    window.dispatchEvent(new Event(REGISTRATION_BANNER_STORE_EVENT));
  }

  const showMobileFloatingMenuButton = isMobile && chromeCollapsed && !mobileDrawerPresent;

  function closeMobileMenu() {
    setMenuOpen(false);
  }

  return (
    <>
      <div
        aria-hidden
        className={`shrink-0 overflow-hidden transition-[height] duration-300 ease-out motion-reduce:transition-none ${
          chromeCollapsed ? "pointer-events-none" : ""
        }`}
        style={{
          overflowAnchor: "none",
          height: chromeCollapsed
            ? 0
            : shellReady
              ? shellHeight
              : CHROME_SHELL_HEIGHT_FALLBACK_PX,
        }}
      />
      <div
        ref={shellRef}
        className={`fixed inset-x-0 top-0 z-50 motion-safe:transition-transform motion-safe:duration-300 motion-safe:ease-out ${
          chromeCollapsed ? "-translate-y-full" : "translate-y-0"
        }`}
      >
        <header className="relative z-20 border-b border-stone-200/90 bg-[color:var(--chrome-bg)] backdrop-blur-md backdrop-saturate-150 dark:border-stone-800/90">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-3 px-5 sm:px-4 py-3 md:gap-x-5 md:gap-y-2.5 md:py-3.5 lg:max-w-7xl lg:gap-x-6 lg:py-4">
            <Link
              href="/"
              className="min-w-0 shrink font-serif text-base leading-tight tracking-tight text-stone-900 dark:text-stone-50 sm:text-lg md:shrink-0"
            >
              <span className="block truncate sm:whitespace-normal">{t("brand.festivalLine")}</span>
            </Link>

            <nav
              className="hidden min-w-0 flex-1 flex-wrap items-center justify-end gap-x-2.5 gap-y-2 md:flex md:gap-x-3 md:gap-y-2 lg:gap-x-3.5"
              aria-label={t("nav.mainNavDesktop")}
            >
              <div className="flex min-w-0 flex-wrap items-center justify-end gap-x-2.5 gap-y-2 md:gap-x-3 md:gap-y-2 lg:gap-x-3.5">
                {!meUser && (
                  <>
                    <Link href="/register" className={`${btnOutline} shrink-0`}>
                      {t("nav.registerCta")}
                    </Link>
                    <div className="flex shrink-0 flex-wrap items-center gap-2">
                      <Link href="/login?next=/booking" className={bookingNavLoginPianoClass}>
                        {t("nav.loginBookingPianoStudio")}
                      </Link>
                      <Link
                        href="/login?next=/booking/open-space"
                        className={bookingNavLoginOpenSpaceClass}
                      >
                        {t("nav.loginBookingOpenSpace")}
                      </Link>
                    </div>
                  </>
                )}
                <InfoMenuDropdown />
                {meUser && (
                  <Link
                    href="/account"
                    className="inline-flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-lg border border-violet-300 bg-violet-50 text-violet-900 transition hover:border-violet-500 hover:bg-violet-100 dark:border-violet-500/60 dark:bg-violet-950/50 dark:text-violet-100 dark:hover:border-violet-400 dark:hover:bg-violet-900/60"
                    aria-label={t("nav.myAccount")}
                  >
                    <UserIcon className="h-5 w-5" />
                  </Link>
                )}
                <ThemeToggle />
                <Link href="/" className={navIconButtonMdHome} aria-label={homeAriaLabel}>
                  <HomeIcon className="h-5 w-5" />
                </Link>
              </div>
            </nav>

            <div className="flex shrink-0 items-center gap-1.5 md:hidden">
              {meUser && (
                <Link
                  href="/account"
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-violet-300 bg-violet-50 text-violet-900 transition hover:border-violet-500 hover:bg-violet-100 dark:border-violet-500/60 dark:bg-violet-950/50 dark:text-violet-100 dark:hover:border-violet-400 dark:hover:bg-violet-900/60"
                  aria-label={t("nav.myAccount")}
                >
                  <UserIcon className="h-4 w-4" />
                </Link>
              )}
              <button
                type="button"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-stone-300 dark:border-stone-600 text-stone-800 dark:text-stone-200 dark:hover:bg-stone-800"
                aria-expanded={mobileDrawerPresent}
                aria-controls="site-mobile-nav-drawer"
                onClick={() => setMenuOpen((o) => !o)}
              >
                <span className="sr-only">
                  {mobileDrawerPresent ? t("nav.closeMenu") : t("nav.openMenu")}
                </span>
                <MobileMenuHamburgerGlyph open={mobileDrawerPresent} />
              </button>
            </div>
          </div>
        </header>

        {registrationBannerDismissed ? (
          <div
            className="h-px w-full shrink-0 bg-black/40 dark:bg-white/35"
            aria-hidden
          />
        ) : (
          <div
            className="relative z-10 border-b border-[#2a1845]/85 bg-gradient-to-r from-[#3d2463]/88 via-[#4a2d75]/88 to-[#3d2463]/88 px-5 py-2 pr-10 text-center text-[11px] font-medium leading-tight text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-md backdrop-saturate-150 sm:px-4 sm:pr-11 sm:text-xs sm:leading-snug"
            role="note"
          >
            <p className="mx-auto max-w-3xl">
              {t("banner.registrationNote")}
            </p>
            <button
              type="button"
              onClick={dismissRegistrationBanner}
              className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-white/90 transition hover:bg-white/15 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/80 sm:right-3"
              aria-label={t("banner.dismiss")}
            >
              <CloseIconSm className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      {isMobile && mobileDrawerPresent ? (
        <div className="fixed inset-0 z-[60] md:hidden">
          <button
            type="button"
            className={`absolute inset-0 bg-black/32 motion-safe:transition-opacity motion-safe:duration-300 motion-safe:ease-out ${
              mobileDrawerEntered ? "opacity-100" : "opacity-0"
            } motion-reduce:transition-none`}
            aria-label={t("nav.closeMenu")}
            onClick={closeMobileMenu}
          />
          <div
            id="site-mobile-nav-drawer"
            role="dialog"
            aria-modal="true"
            aria-labelledby="site-mobile-nav-title"
            data-mobile-nav={mobileDrawerEntered ? "open" : "closed"}
            data-mobile-nav-panel=""
            className={`absolute inset-y-0 right-0 flex w-[min(100vw,20rem)] flex-col border-l border-stone-200/70 bg-white/55 shadow-2xl backdrop-blur-2xl backdrop-saturate-150 will-change-transform dark:border-stone-600/60 dark:bg-stone-950/55 motion-safe:transition-transform motion-safe:duration-300 motion-safe:ease-[cubic-bezier(0.32,0.72,0,1)] motion-reduce:transition-none ${
              mobileDrawerEntered ? "translate-x-0" : "translate-x-full"
            }`}
            style={{
              paddingBottom: "max(1rem, env(safe-area-inset-bottom))",
              paddingTop: "env(safe-area-inset-top)",
            }}
            onClick={(e) => e.stopPropagation()}
            onTransitionEnd={onMobileDrawerPanelTransitionEnd}
          >
            <div className="flex shrink-0 items-center justify-between gap-2 border-b border-stone-200/80 bg-white/28 px-4 py-3 dark:border-stone-700/80 dark:bg-stone-950/25">
              <h2 id="site-mobile-nav-title" className="text-sm font-semibold text-stone-900 dark:text-stone-50">
                {t("nav.mainNavMobile")}
              </h2>
              <button
                ref={mobileDrawerCloseRef}
                type="button"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-stone-300 text-stone-800 transition hover:bg-stone-100 dark:border-stone-600 dark:text-stone-200 dark:hover:bg-stone-800"
                aria-label={t("nav.closeMenu")}
                onClick={closeMobileMenu}
              >
                <MobileMenuHamburgerGlyph open />
              </button>
            </div>
            <nav
              className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-4 pt-3"
              aria-label={t("nav.mainNavMobile")}
            >
              <div className="flex max-w-5xl flex-col gap-2">
                <MobileNavZipItem index={0}>
                  <div className="grid w-full grid-cols-2 gap-2">
                    <div className="aspect-square min-h-0 min-w-0">
                      <Link
                        href="/"
                        className="flex h-full w-full min-h-0 flex-col items-center justify-center gap-1 rounded-lg border border-stone-900 bg-transparent px-1 py-2 text-stone-800 transition hover:bg-stone-50 dark:border-stone-300 dark:text-stone-200 dark:hover:bg-stone-900/50"
                        onClick={closeMobileMenu}
                        aria-label={homeAriaLabel}
                      >
                        <HomeIcon className="h-5 w-5 shrink-0" />
                        <span className="max-w-full truncate px-0.5 text-center text-[10px] font-medium leading-tight">
                          {t("footer.home")}
                        </span>
                      </Link>
                    </div>
                    <div className="aspect-square min-h-0 min-w-0">
                      <ThemeToggle
                        drawerSquareLabels={{
                          light: t("nav.themeCurrentLight"),
                          dark: t("nav.themeCurrentDark"),
                        }}
                      />
                    </div>
                  </div>
                </MobileNavZipItem>
                {!meUser && (
                  <>
                    <MobileNavZipItem index={1}>
                      <Link
                        href="/register"
                        className={`${btnRegisterMobileDrawer} text-center`}
                        onClick={closeMobileMenu}
                      >
                        {t("nav.registerCta")}
                      </Link>
                    </MobileNavZipItem>
                    <MobileNavZipItem index={2}>
                      <Link
                        href="/login?next=/booking"
                        className={`${bookingNavLoginPianoDrawerClass} text-center`}
                        onClick={closeMobileMenu}
                      >
                        {t("nav.loginBookingPianoStudio")}
                      </Link>
                    </MobileNavZipItem>
                    <MobileNavZipItem index={3}>
                      <Link
                        href="/login?next=/booking/open-space"
                        className={`${bookingNavLoginOpenSpaceDrawerClass} text-center`}
                        onClick={closeMobileMenu}
                      >
                        {t("nav.loginBookingOpenSpace")}
                      </Link>
                    </MobileNavZipItem>
                    <MobileNavZipItem index={4}>
                      <Link
                        href="/about-d-festival"
                        className={`${navDfestivalCtaMobileDrawerClass} text-center`}
                        onClick={closeMobileMenu}
                      >
                        {t("nav.aboutDfestival2026")}
                      </Link>
                    </MobileNavZipItem>
                    <MobileNavZipItem index={5}>
                      <Link
                        href="/about-fantasia-music-space"
                        className={`${navFantasiaCtaClass} text-center`}
                        onClick={closeMobileMenu}
                      >
                        {t("nav.aboutFantasiaMusicSpace")}
                      </Link>
                    </MobileNavZipItem>
                    <MobileNavZipItem index={6} className="my-1 border-t border-stone-100 pt-2 dark:border-stone-800">
                      <button
                        type="button"
                        className={`${linkPlain} w-full justify-center gap-2 py-2`}
                        onClick={() => {
                          toggleLocale();
                          closeMobileMenu();
                        }}
                      >
                        <LanguageSwitchIcon className="h-5 w-5 shrink-0 opacity-80" />
                        {locale === "zh-HK" ? t("nav.switchToEnglish") : t("nav.switchToZh")}
                      </button>
                    </MobileNavZipItem>
                    <MobileNavZipItem index={7}>
                      <Link
                        href="/faq"
                        className={`${linkPlain} w-full justify-center py-2`}
                        onClick={closeMobileMenu}
                      >
                        {t("nav.faq")}
                      </Link>
                    </MobileNavZipItem>
                    <MobileNavZipItem index={8}>
                      <Link
                        href="/directions"
                        className={`${linkPlain} w-full justify-center py-2`}
                        onClick={closeMobileMenu}
                      >
                        {t("nav.directions")}
                      </Link>
                    </MobileNavZipItem>
                    <MobileNavZipItem index={9}>
                      <Link
                        href="/open-space-booking"
                        className={`${linkPlain} w-full justify-center py-2`}
                        onClick={closeMobileMenu}
                      >
                        {t("nav.openSpaceBookingInfo")}
                      </Link>
                    </MobileNavZipItem>
                    <MobileNavZipItem index={10}>
                      <Link
                        href="/privacy"
                        className={`${linkPlain} w-full justify-center py-2`}
                        onClick={closeMobileMenu}
                      >
                        {t("nav.privacyPolicy")}
                      </Link>
                    </MobileNavZipItem>
                    <MobileNavZipItem index={11}>
                      <Link
                        href="/terms"
                        className={`${linkPlain} w-full justify-center py-2`}
                        onClick={closeMobileMenu}
                      >
                        {t("nav.termsAndConditions")}
                      </Link>
                    </MobileNavZipItem>
                    <MobileNavZipItem index={12}>
                      <Link
                        href="/contact"
                        className={`${linkPlain} w-full justify-center py-2`}
                        onClick={closeMobileMenu}
                      >
                        {t("nav.contact")}
                      </Link>
                    </MobileNavZipItem>
                  </>
                )}
                {meUser && (
                  <>
                    <MobileNavZipItem index={1}>
                      <Link
                        href={bookingHref}
                        className={`${navBookingPrimaryCtaMenuStudioClass} text-center`}
                        onClick={closeMobileMenu}
                      >
                        {bookingNavEntryLabel(meUser, t)}
                      </Link>
                    </MobileNavZipItem>
                    <MobileNavZipItem index={2}>
                      <Link
                        href="/account"
                        className={`${bookingNavLoginPianoDrawerClass} text-center`}
                        onClick={closeMobileMenu}
                      >
                        {t("nav.myAccount")}
                      </Link>
                    </MobileNavZipItem>
                    <MobileNavZipItem index={3}>
                      <Link
                        href="/about-d-festival"
                        className={`${navDfestivalCtaMobileDrawerClass} text-center`}
                        onClick={closeMobileMenu}
                      >
                        {t("nav.aboutDfestival2026")}
                      </Link>
                    </MobileNavZipItem>
                    <MobileNavZipItem index={4}>
                      <Link
                        href="/about-fantasia-music-space"
                        className={`${navFantasiaCtaClass} text-center`}
                        onClick={closeMobileMenu}
                      >
                        {t("nav.aboutFantasiaMusicSpace")}
                      </Link>
                    </MobileNavZipItem>
                    <MobileNavZipItem index={5} className="my-1 border-t border-stone-100 pt-2 dark:border-stone-800">
                      <button
                        type="button"
                        className={`${linkPlain} w-full justify-center gap-2 py-2`}
                        onClick={() => {
                          toggleLocale();
                          closeMobileMenu();
                        }}
                      >
                        <LanguageSwitchIcon className="h-5 w-5 shrink-0 opacity-80" />
                        {locale === "zh-HK" ? t("nav.switchToEnglish") : t("nav.switchToZh")}
                      </button>
                    </MobileNavZipItem>
                    <MobileNavZipItem index={6}>
                      <Link
                        href="/faq"
                        className={`${linkPlain} w-full justify-center py-2`}
                        onClick={closeMobileMenu}
                      >
                        {t("nav.faq")}
                      </Link>
                    </MobileNavZipItem>
                    <MobileNavZipItem index={7}>
                      <Link
                        href="/directions"
                        className={`${linkPlain} w-full justify-center py-2`}
                        onClick={closeMobileMenu}
                      >
                        {t("nav.directions")}
                      </Link>
                    </MobileNavZipItem>
                    <MobileNavZipItem index={8}>
                      <Link
                        href="/open-space-booking"
                        className={`${linkPlain} w-full justify-center py-2`}
                        onClick={closeMobileMenu}
                      >
                        {t("nav.openSpaceBookingInfo")}
                      </Link>
                    </MobileNavZipItem>
                    <MobileNavZipItem index={9}>
                      <Link
                        href="/privacy"
                        className={`${linkPlain} w-full justify-center py-2`}
                        onClick={closeMobileMenu}
                      >
                        {t("nav.privacyPolicy")}
                      </Link>
                    </MobileNavZipItem>
                    <MobileNavZipItem index={10}>
                      <Link
                        href="/terms"
                        className={`${linkPlain} w-full justify-center py-2`}
                        onClick={closeMobileMenu}
                      >
                        {t("nav.termsAndConditions")}
                      </Link>
                    </MobileNavZipItem>
                    <MobileNavZipItem index={11}>
                      <Link
                        href="/contact"
                        className={`${linkPlain} w-full justify-center py-2`}
                        onClick={closeMobileMenu}
                      >
                        {t("nav.contact")}
                      </Link>
                    </MobileNavZipItem>
                  </>
                )}
              </div>
            </nav>
          </div>
        </div>
      ) : null}

      {showMobileFloatingMenuButton ? (
        <button
          type="button"
          className="fixed z-[60] flex h-14 w-14 items-center justify-center rounded-full border border-stone-300 bg-[color:var(--chrome-bg)] text-stone-800 shadow-lg backdrop-blur-md dark:border-stone-600 dark:text-stone-200 md:hidden motion-safe:transition-transform motion-safe:duration-200 hover:scale-105 active:scale-95"
          style={{
            right: "max(1rem, env(safe-area-inset-right))",
            bottom: "max(1rem, env(safe-area-inset-bottom))",
          }}
          aria-haspopup="dialog"
          aria-label={t("nav.openMenu")}
          onClick={() => setMenuOpen(true)}
        >
          <MobileMenuHamburgerGlyph open={false} />
        </button>
      ) : null}
    </>
  );
}
