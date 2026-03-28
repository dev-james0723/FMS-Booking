"use client";

import Image from "next/image";
import Link from "next/link";
import { BookingCountdown } from "@/components/booking-countdown";
import { BookingOpensCalendarReminder } from "@/components/booking-opens-calendar-reminder";
import { HomeEligibilityMemo } from "@/components/home-eligibility-memo";
import { HomePartnerLogos } from "@/components/home-partner-logos";
import { useSiteMe } from "@/lib/auth/use-site-me";
import {
  bookingNavLoginOpenSpaceClass,
  bookingNavLoginPianoClass,
} from "@/lib/booking-nav-login-button-classes";
import { withBasePath } from "@/lib/base-path";
import { useTranslation } from "@/lib/i18n/use-translation";

type Props = {
  bookingOpensAtIso: string | null;
  bookingOpensAtLabel: string | null;
  bookingLive: boolean;
  initialNowMs: number;
  venueAddressZh: string;
};

export function HomePageMain({
  bookingOpensAtIso,
  bookingOpensAtLabel,
  bookingLive,
  initialNowMs,
  venueAddressZh,
}: Props) {
  const { t, tr } = useTranslation();
  const { user: meUser, bookingHref } = useSiteMe();
  const campaignRange = t("campaign.dateRange");

  const bookSlotsBtnClass =
    "bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-stone-200";

  return (
    <main className="mx-auto max-w-5xl px-5 sm:px-4 pb-16 pt-6 sm:pt-8">
      <HomePartnerLogos />
      <p className="text-center text-sm uppercase tracking-[0.2em] text-stone-500 dark:text-stone-400">
        {t("home.tagline")}
      </p>
      <h1 className="mt-4 text-center font-serif text-4xl leading-tight text-stone-900 dark:text-stone-50 sm:text-5xl">
        {t("home.title")}
      </h1>
      <p className="mx-auto mt-6 max-w-2xl text-center text-stone-600 dark:text-stone-400">
        {tr("home.lead", { campaignRange })}
      </p>

      <HomeEligibilityMemo />

      <div className="mx-auto mt-12 max-w-lg space-y-6">
        <Link
          href="/register"
          className="block rounded-xl border border-emerald-950/25 bg-emerald-800 px-6 py-5 text-center text-sm font-medium text-white shadow-sm transition hover:bg-emerald-900 dark:border-emerald-950/40 dark:bg-emerald-800 dark:text-white dark:hover:bg-emerald-900"
        >
          {t("home.registerCta")}
        </Link>
        <BookingOpensCalendarReminder
          bookingOpensAtIso={bookingOpensAtIso}
          bookingLive={bookingLive}
          venueAddressZh={venueAddressZh}
        />
        <BookingCountdown
          bookingOpensAtIso={bookingOpensAtIso}
          bookingOpensAtLabel={bookingOpensAtLabel}
          initialNowMs={initialNowMs}
        />
      </div>

      <div className="mx-auto mt-10 flex w-full max-w-lg flex-col items-stretch justify-center gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-center">
        {meUser ? (
          <Link
            href={bookingHref}
            className={`w-full rounded-full px-8 py-3 text-center text-sm font-medium text-white transition sm:w-auto ${bookSlotsBtnClass}`}
          >
            {t("nav.bookingSlots")}
          </Link>
        ) : (
          <div
            className={`flex w-full flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-center${
              !bookingLive ? " pointer-events-none opacity-60" : ""
            }`}
          >
            <Link
              href="/login?next=/booking"
              className={`${bookingNavLoginPianoClass} w-full px-6 py-3 sm:w-auto sm:min-w-[12rem]`}
            >
              {t("nav.loginBookingPianoStudio")}
            </Link>
            <Link
              href="/login?next=/booking/open-space"
              className={`${bookingNavLoginOpenSpaceClass} w-full px-6 py-3 sm:w-auto sm:min-w-[12rem]`}
            >
              {t("nav.loginBookingOpenSpace")}
            </Link>
          </div>
        )}
      </div>
      {!bookingLive && !meUser && (
        <p className="mt-4 text-center text-xs text-stone-500 dark:text-stone-500">
          {t("home.loginDisabledHint")}
        </p>
      )}
      {!bookingLive && (
        <div className="mt-8 flex w-full justify-center px-2">
          <figure className="w-full max-w-lg">
            <Image
              src={withBasePath("/branding/hkfimm-ltd.png")}
              alt={t("home.sponsorLogoAlt")}
              width={2048}
              height={776}
              className="mx-auto block h-auto w-full max-h-28 object-contain object-center sm:max-h-32"
            />
            <figcaption className="mt-2 text-center text-[10px] leading-snug tracking-wide text-stone-500 dark:text-stone-500 sm:text-[11px]">
              {t("home.sponsorCaption")}
            </figcaption>
          </figure>
        </div>
      )}
    </main>
  );
}
