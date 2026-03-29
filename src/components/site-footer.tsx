"use client";

import Image from "next/image";
import Link from "next/link";
import { LanguageSwitchIcon } from "@/components/language-switch-icon";
import { useSiteMe } from "@/lib/auth/use-site-me";
import { withBasePath } from "@/lib/base-path";
import { useTranslation } from "@/lib/i18n/use-translation";

const footerLinkClass =
  "text-sm text-stone-600 transition hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100";

const ATELIER_DESIGN_WHATSAPP_HREF = "https://wa.link/g5niw4";

export function SiteFooter() {
  const { t, tr, locale, toggleLocale } = useTranslation();
  const { user: meUser, bookingHref } = useSiteMe();

  const year = String(new Date().getFullYear());

  return (
    <footer className="border-t border-stone-200 bg-[color:var(--chrome-bg)] text-stone-600 backdrop-blur-md dark:border-stone-800 dark:text-stone-400">
      <div className="mx-auto max-w-5xl px-5 sm:px-4 py-10">
        <nav
          aria-label={t("footer.sitemapAria")}
          className="grid gap-10 sm:grid-cols-2 md:justify-items-center"
        >
          <div className="md:text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-stone-500 dark:text-stone-500">
              {t("footer.groupAccount")}
            </p>
            <ul className="mt-4 flex flex-col gap-2.5 md:items-center">
              <li>
                <Link href={withBasePath("/")} className={footerLinkClass}>
                  {t("footer.home")}
                </Link>
              </li>
              {meUser ? (
                <>
                  <li>
                    <Link href={withBasePath(bookingHref)} className={footerLinkClass}>
                      {t("nav.bookingSlots")}
                    </Link>
                  </li>
                  <li>
                    <Link href={withBasePath("/account")} className={footerLinkClass}>
                      {t("nav.myAccount")}
                    </Link>
                  </li>
                </>
              ) : (
                <>
                  <li>
                    <Link href={withBasePath("/register")} className={footerLinkClass}>
                      {t("nav.registerCta")}
                    </Link>
                  </li>
                  <li>
                    <Link
                      href={withBasePath("/login?next=/booking")}
                      className={`${footerLinkClass} font-medium text-blue-900 dark:text-blue-300`}
                    >
                      {t("nav.loginBookingPianoStudio")}
                    </Link>
                  </li>
                  <li>
                    <Link
                      href={withBasePath("/login?next=/booking/open-space")}
                      className={`${footerLinkClass} font-medium text-sky-700 dark:text-sky-400`}
                    >
                      {t("nav.loginBookingOpenSpace")}
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </div>
          <div className="md:text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-stone-500 dark:text-stone-500">
              {t("footer.groupInfo")}
            </p>
            <ul className="mt-4 flex flex-col gap-2.5 md:items-center">
              <li>
                <Link href={withBasePath("/about-d-festival")} className={footerLinkClass}>
                  {t("nav.aboutDfestival2026")}
                </Link>
              </li>
              <li>
                <Link href={withBasePath("/about-fantasia-music-space")} className={footerLinkClass}>
                  {t("nav.aboutFantasiaMusicSpace")}
                </Link>
              </li>
              <li>
                <Link href={withBasePath("/faq")} className={footerLinkClass}>
                  {t("nav.faq")}
                </Link>
              </li>
              <li>
                <Link href={withBasePath("/directions")} className={footerLinkClass}>
                  {t("nav.directions")}
                </Link>
              </li>
              <li>
                <Link href={withBasePath("/privacy")} className={footerLinkClass}>
                  {t("nav.privacyPolicy")}
                </Link>
              </li>
              <li>
                <Link href={withBasePath("/terms")} className={footerLinkClass}>
                  {t("nav.termsAndConditions")}
                </Link>
              </li>
              <li>
                <Link href={withBasePath("/contact")} className={footerLinkClass}>
                  {t("nav.contact")}
                </Link>
              </li>
            </ul>
          </div>
        </nav>
        <div className="mt-8 flex justify-center border-t border-stone-200 pt-8 dark:border-stone-800">
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-full border border-stone-300 px-4 py-2 text-sm text-stone-700 transition hover:border-stone-400 hover:bg-stone-50 dark:border-stone-600 dark:text-stone-200 dark:hover:border-stone-500 dark:hover:bg-stone-800/80"
            onClick={toggleLocale}
          >
            <LanguageSwitchIcon className="h-5 w-5 shrink-0 opacity-80" />
            <span>{locale === "zh-HK" ? t("nav.switchToEnglish") : t("nav.switchToZh")}</span>
          </button>
        </div>
      </div>
      <div className="border-t border-stone-200 py-6 text-center text-xs text-stone-500 dark:border-stone-800 dark:text-stone-400">
        <p>{tr("footer.line", { year })}</p>
        <div className="mt-5 flex flex-col items-center gap-3">
          <p className="text-[11px] font-medium tracking-wide text-[#9a7b3c] dark:text-[#cbb882]">
            {t("footer.designCredit")}
          </p>
          <p className="text-[11px]">
            <a
              href={ATELIER_DESIGN_WHATSAPP_HREF}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-blue-700 underline decoration-blue-700 underline-offset-2 transition hover:text-blue-800 dark:text-blue-400 dark:decoration-blue-400 dark:hover:text-blue-300"
            >
              {t("footer.designInquiry")}
            </a>
          </p>
          <Image
            src={withBasePath("/images/design-credit/atelier-fantasia-logo.png")}
            alt={t("footer.atelierFantasiaLogoAlt")}
            width={500}
            height={500}
            className="h-16 w-auto max-w-[7.5rem] opacity-95"
            sizes="120px"
          />
        </div>
      </div>
    </footer>
  );
}
