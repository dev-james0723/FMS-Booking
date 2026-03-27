"use client";

import Image from "next/image";
import Link from "next/link";
import { BookingCountdown } from "@/components/booking-countdown";
import { BookingOpensCalendarReminder } from "@/components/booking-opens-calendar-reminder";
import { HomePartnerLogos } from "@/components/home-partner-logos";
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
  const campaignRange = t("campaign.dateRange");

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

      <div className="mx-auto mt-12 max-w-lg space-y-6">
        <Link
          href="/register"
          className="block rounded-xl border border-stone-200 dark:border-stone-700 bg-surface px-6 py-5 text-center text-sm font-medium text-stone-900 dark:text-stone-50 shadow-sm transition hover:bg-stone-50 dark:hover:bg-stone-800"
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

      <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
        <Link
          href="/login?next=/booking"
          className={`w-full rounded-full px-8 py-3 text-center text-sm font-medium text-white transition sm:w-auto ${
            bookingLive
              ? "bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-stone-200"
              : "bg-stone-400 dark:bg-stone-600"
          }`}
        >
          {t("home.loginCta")}
        </Link>
      </div>
      {!bookingLive && (
        <>
          <p className="mt-4 text-center text-xs text-stone-500 dark:text-stone-500">
            {t("home.loginDisabledHint")}
          </p>
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
        </>
      )}
    </main>
  );
}
