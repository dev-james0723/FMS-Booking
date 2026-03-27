"use client";

import Link from "next/link";
import { useEffect, useState, useSyncExternalStore, type CSSProperties, type ReactNode } from "react";
import { InfoMenuDropdown } from "@/components/info-menu-dropdown";
import { LanguageSwitchIcon } from "@/components/language-switch-icon";
import { ThemeToggle } from "@/components/theme-toggle";
import { useTranslation } from "@/lib/i18n/use-translation";
import { navDfestivalCtaClass, navIconButtonMdHome, navIconButtonSmHome } from "@/lib/nav-icon-button-classes";
import { withBasePath } from "@/lib/base-path";

const btnOutline =
  "inline-flex min-h-[44px] items-center justify-center rounded-full border border-stone-300 dark:border-stone-600 px-5 sm:px-4 py-2 text-sm text-stone-800 dark:text-stone-200 transition hover:border-stone-900 hover:bg-stone-50 dark:hover:border-stone-400 dark:hover:bg-stone-800";
const btnSolid =
  "inline-flex min-h-[44px] items-center justify-center rounded-full bg-stone-900 px-5 sm:px-4 py-2 text-sm text-white transition hover:bg-stone-800";
const linkPlain =
  "inline-flex min-h-[44px] items-center text-sm text-stone-600 dark:text-stone-400 transition hover:text-stone-900 dark:text-stone-50";

const REGISTRATION_BANNER_DISMISSED_KEY = "fms-registration-banner-dismissed";
const REGISTRATION_BANNER_STORE_EVENT = "fms-registration-banner-dismissed-change";

function readRegistrationBannerDismissedFromStorage(): boolean {
  try {
    return localStorage.getItem(REGISTRATION_BANNER_DISMISSED_KEY) === "1";
  } catch {
    return false;
  }
}

function subscribeRegistrationBannerDismissed(onStoreChange: () => void) {
  const handler = () => onStoreChange();
  window.addEventListener("storage", handler);
  window.addEventListener(REGISTRATION_BANNER_STORE_EVENT, handler);
  return () => {
    window.removeEventListener("storage", handler);
    window.removeEventListener(REGISTRATION_BANNER_STORE_EVENT, handler);
  };
}

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

type MePayload = { user?: { email: string; bookingVenueKind?: string } } | null;

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

export function SiteHeader() {
  const { t, locale, toggleLocale } = useTranslation();
  const homeAriaLabel = t("nav.homeAria");
  const [menuOpen, setMenuOpen] = useState(false);
  const [me, setMe] = useState<MePayload | undefined>(undefined);
  const bookingHref =
    me?.user?.bookingVenueKind === "open_space" ? "/booking/open-space" : "/booking";

  const registrationBannerDismissed = useSyncExternalStore(
    subscribeRegistrationBannerDismissed,
    readRegistrationBannerDismissedFromStorage,
    () => false,
  );

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const res = await fetch(withBasePath("/api/v1/me"), { credentials: "same-origin" });
      if (cancelled) return;
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        setMe(data?.user ? { user: data.user } : null);
      } else {
        setMe(null);
      }
    })();
    return () => {
      cancelled = true;
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

  return (
    <>
      <header className="border-b border-stone-200 bg-[color:var(--chrome-bg)] backdrop-blur-md dark:border-stone-800">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-5 sm:px-4 py-3 md:gap-4 md:py-4">
          <Link
            href="/"
            className="min-w-0 shrink font-serif text-base leading-tight tracking-tight text-stone-900 dark:text-stone-50 sm:text-lg"
          >
            <span className="block truncate sm:whitespace-normal">{t("brand.festivalLine")}</span>
          </Link>

          <nav
            className="hidden md:flex md:items-center md:gap-3"
            aria-label={t("nav.mainNavDesktop")}
          >
            {!me?.user && (
              <>
                <Link href="/register" className={btnOutline}>
                  {t("nav.registerCta")}
                </Link>
                <Link href="/login?next=/account" className={btnSolid}>
                  {t("nav.loginBooking")}
                </Link>
              </>
            )}
            {me?.user && (
              <div className="flex flex-col items-center gap-1">
                <Link
                  href="/account"
                  className="inline-flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-lg border border-violet-300 bg-violet-50 text-violet-900 transition hover:border-violet-500 hover:bg-violet-100 dark:border-violet-500/60 dark:bg-violet-950/50 dark:text-violet-100 dark:hover:border-violet-400 dark:hover:bg-violet-900/60"
                  aria-label={t("nav.myAccount")}
                >
                  <UserIcon className="h-5 w-5" />
                </Link>
                <Link
                  href={bookingHref}
                  className="text-center text-[11px] font-medium leading-tight text-violet-800 underline decoration-violet-400 underline-offset-2 hover:text-violet-950 dark:text-violet-300 dark:decoration-violet-500 dark:hover:text-violet-100"
                >
                  {t("nav.bookingSlots")}
                </Link>
              </div>
            )}
            <InfoMenuDropdown />
            <ThemeToggle />
            <Link href="/" className={navIconButtonMdHome} aria-label={homeAriaLabel}>
              <HomeIcon className="h-5 w-5" />
            </Link>
          </nav>

          <div className="flex shrink-0 items-center gap-1.5 md:hidden">
            {me?.user && (
              <Link
                href="/account"
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-violet-300 bg-violet-50 text-violet-900 transition hover:border-violet-500 hover:bg-violet-100 dark:border-violet-500/60 dark:bg-violet-950/50 dark:text-violet-100 dark:hover:border-violet-400 dark:hover:bg-violet-900/60"
                aria-label={t("nav.myAccount")}
              >
                <UserIcon className="h-4 w-4" />
              </Link>
            )}
            <ThemeToggle size="sm" />
            <Link href="/" className={navIconButtonSmHome} aria-label={homeAriaLabel}>
              <HomeIcon className="h-4 w-4" />
            </Link>
            <button
              type="button"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-stone-300 dark:border-stone-600 text-stone-800 dark:text-stone-200 dark:hover:bg-stone-800"
              aria-expanded={menuOpen}
              aria-controls="site-mobile-nav"
              onClick={() => setMenuOpen((o) => !o)}
            >
              <span className="sr-only">{menuOpen ? t("nav.closeMenu") : t("nav.openMenu")}</span>
              {menuOpen ? (
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
              )}
            </button>
          </div>
        </div>

        <div
          id="site-mobile-nav"
          data-mobile-nav={menuOpen ? "open" : "closed"}
          data-mobile-nav-panel=""
          aria-hidden={!menuOpen}
          className={`grid border-t border-stone-200 bg-surface transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] dark:border-stone-800 md:hidden ${
            menuOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
          }`}
        >
          <div className="min-h-0 overflow-hidden" inert={!menuOpen}>
            <nav
              className="mx-auto flex max-w-5xl flex-col gap-2 px-5 sm:px-4 py-3"
              aria-label={t("nav.mainNavMobile")}
            >
              {!me?.user && (
                <>
                  <MobileNavZipItem index={0}>
                    <Link
                      href="/register"
                      className={`${btnOutline} w-full text-center`}
                      onClick={() => setMenuOpen(false)}
                    >
                      {t("nav.registerCta")}
                    </Link>
                  </MobileNavZipItem>
                  <MobileNavZipItem index={1}>
                    <Link
                      href="/login?next=/account"
                      className={`${btnSolid} w-full text-center`}
                      onClick={() => setMenuOpen(false)}
                    >
                      {t("nav.loginBooking")}
                    </Link>
                  </MobileNavZipItem>
                  <MobileNavZipItem index={2}>
                    <Link
                      href="/about-d-festival"
                      className={`${navDfestivalCtaClass} text-center`}
                      onClick={() => setMenuOpen(false)}
                    >
                      {t("nav.aboutDfestival2026")}
                    </Link>
                  </MobileNavZipItem>
                  <MobileNavZipItem index={3} className="my-1 border-t border-stone-100 pt-2 dark:border-stone-800">
                    <Link
                      href="/faq"
                      className={`${linkPlain} w-full justify-center py-2`}
                      onClick={() => setMenuOpen(false)}
                    >
                      {t("nav.faq")}
                    </Link>
                  </MobileNavZipItem>
                  <MobileNavZipItem index={4}>
                    <Link
                      href="/open-space-booking"
                      className={`${linkPlain} w-full justify-center py-2`}
                      onClick={() => setMenuOpen(false)}
                    >
                      {t("nav.openSpaceBookingInfo")}
                    </Link>
                  </MobileNavZipItem>
                  <MobileNavZipItem index={5}>
                    <button
                      type="button"
                      className={`${linkPlain} w-full justify-center gap-2 py-2`}
                      onClick={() => {
                        toggleLocale();
                        setMenuOpen(false);
                      }}
                    >
                      <LanguageSwitchIcon className="h-5 w-5 shrink-0 opacity-80" />
                      {locale === "zh-HK" ? t("nav.switchToEnglish") : t("nav.switchToZh")}
                    </button>
                  </MobileNavZipItem>
                  <MobileNavZipItem index={6}>
                    <Link
                      href="/privacy"
                      className={`${linkPlain} w-full justify-center py-2`}
                      onClick={() => setMenuOpen(false)}
                    >
                      {t("nav.privacyPolicy")}
                    </Link>
                  </MobileNavZipItem>
                  <MobileNavZipItem index={7}>
                    <Link
                      href="/terms"
                      className={`${linkPlain} w-full justify-center py-2`}
                      onClick={() => setMenuOpen(false)}
                    >
                      {t("nav.termsAndConditions")}
                    </Link>
                  </MobileNavZipItem>
                  <MobileNavZipItem index={8}>
                    <Link
                      href="/contact"
                      className={`${linkPlain} w-full justify-center py-2`}
                      onClick={() => setMenuOpen(false)}
                    >
                      {t("nav.contact")}
                    </Link>
                  </MobileNavZipItem>
                </>
              )}
              {me?.user && (
                <>
                  <MobileNavZipItem index={0}>
                    <Link
                      href={bookingHref}
                      className={`${btnSolid} w-full text-center`}
                      onClick={() => setMenuOpen(false)}
                    >
                      {t("nav.bookingSlots")}
                    </Link>
                  </MobileNavZipItem>
                  <MobileNavZipItem index={1}>
                    <Link
                      href="/account"
                      className={`${btnOutline} w-full text-center`}
                      onClick={() => setMenuOpen(false)}
                    >
                      {t("nav.myAccount")}
                    </Link>
                  </MobileNavZipItem>
                  <MobileNavZipItem index={2}>
                    <Link
                      href="/about-d-festival"
                      className={`${navDfestivalCtaClass} text-center`}
                      onClick={() => setMenuOpen(false)}
                    >
                      {t("nav.aboutDfestival2026")}
                    </Link>
                  </MobileNavZipItem>
                  <MobileNavZipItem index={3} className="my-1 border-t border-stone-100 pt-2 dark:border-stone-800">
                    <Link
                      href="/faq"
                      className={`${linkPlain} w-full justify-center py-2`}
                      onClick={() => setMenuOpen(false)}
                    >
                      {t("nav.faq")}
                    </Link>
                  </MobileNavZipItem>
                  <MobileNavZipItem index={4}>
                    <Link
                      href="/open-space-booking"
                      className={`${linkPlain} w-full justify-center py-2`}
                      onClick={() => setMenuOpen(false)}
                    >
                      {t("nav.openSpaceBookingInfo")}
                    </Link>
                  </MobileNavZipItem>
                  <MobileNavZipItem index={5}>
                    <button
                      type="button"
                      className={`${linkPlain} w-full justify-center gap-2 py-2`}
                      onClick={() => {
                        toggleLocale();
                        setMenuOpen(false);
                      }}
                    >
                      <LanguageSwitchIcon className="h-5 w-5 shrink-0 opacity-80" />
                      {locale === "zh-HK" ? t("nav.switchToEnglish") : t("nav.switchToZh")}
                    </button>
                  </MobileNavZipItem>
                  <MobileNavZipItem index={6}>
                    <Link
                      href="/privacy"
                      className={`${linkPlain} w-full justify-center py-2`}
                      onClick={() => setMenuOpen(false)}
                    >
                      {t("nav.privacyPolicy")}
                    </Link>
                  </MobileNavZipItem>
                  <MobileNavZipItem index={7}>
                    <Link
                      href="/terms"
                      className={`${linkPlain} w-full justify-center py-2`}
                      onClick={() => setMenuOpen(false)}
                    >
                      {t("nav.termsAndConditions")}
                    </Link>
                  </MobileNavZipItem>
                  <MobileNavZipItem index={8}>
                    <Link
                      href="/contact"
                      className={`${linkPlain} w-full justify-center py-2`}
                      onClick={() => setMenuOpen(false)}
                    >
                      {t("nav.contact")}
                    </Link>
                  </MobileNavZipItem>
                </>
              )}
            </nav>
          </div>
        </div>
      </header>

      {registrationBannerDismissed ? (
        <div
          className="h-px w-full shrink-0 bg-black dark:bg-white"
          aria-hidden
        />
      ) : (
        <div
          className="relative border-b border-[#2a1845] bg-gradient-to-r from-[#3d2463] via-[#4a2d75] to-[#3d2463] px-5 sm:px-4 py-2 pr-10 text-center text-[11px] font-medium leading-tight text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] sm:pr-11 sm:text-xs sm:leading-snug"
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
    </>
  );
}
