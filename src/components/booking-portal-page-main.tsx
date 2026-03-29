"use client";

import Image from "next/image";
import Link from "next/link";
import { BookingRequestPanel } from "@/components/booking-request-panel";
import { OpenSpaceVenueInfoCards } from "@/components/open-space-venue-info-cards";
import { useTranslation } from "@/lib/i18n/use-translation";
import { withBasePath } from "@/lib/base-path";

function StudioOpenSpaceAlternatePathCallout() {
  const { t } = useTranslation();
  return (
    <section
      aria-labelledby="studio-open-space-callout-title"
      className="rounded-lg border border-violet-200/80 bg-violet-50/60 px-4 py-4 dark:border-violet-800/40 dark:bg-violet-950/25"
    >
      <h2
        id="studio-open-space-callout-title"
        className="text-sm font-semibold tracking-tight text-violet-950 dark:text-violet-100"
      >
        {t("booking.portal.openSpaceCalloutTitle")}
      </h2>

      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-stretch">
        <div className="flex flex-1 flex-col justify-center rounded-lg border border-violet-300/70 bg-white/80 px-3 py-2.5 text-center shadow-sm dark:border-violet-700/50 dark:bg-violet-950/50">
          <span className="text-lg" aria-hidden>
            🎹
          </span>
          <span className="mt-1 text-xs font-semibold text-violet-950 dark:text-violet-50">
            {t("booking.portal.openSpacePoolStudioLabel")}
          </span>
          <span className="mt-0.5 text-[11px] leading-snug text-violet-800/85 dark:text-violet-300/90">
            {t("booking.portal.openSpacePoolStudioSub")}
          </span>
        </div>
        <div
          className="flex shrink-0 items-center justify-center sm:flex-col sm:justify-center sm:px-0.5"
          aria-hidden
        >
          <span className="rounded-full border border-violet-300/60 bg-violet-100/90 px-2.5 py-1 text-[10px] font-semibold text-violet-900 dark:border-violet-600/50 dark:bg-violet-900/40 dark:text-violet-200">
            {t("booking.portal.openSpacePoolDivider")}
          </span>
        </div>
        <div className="flex flex-1 flex-col justify-center rounded-lg border border-violet-300/70 bg-white/80 px-3 py-2.5 text-center shadow-sm dark:border-violet-700/50 dark:bg-violet-950/50">
          <span className="text-lg" aria-hidden>
            🎻
          </span>
          <span className="mt-1 text-xs font-semibold text-violet-950 dark:text-violet-50">
            {t("booking.portal.openSpacePoolOpenLabel")}
          </span>
          <span className="mt-0.5 text-[11px] leading-snug text-violet-800/85 dark:text-violet-300/90">
            {t("booking.portal.openSpacePoolOpenSub")}
          </span>
        </div>
      </div>
      <p className="mt-2 text-center text-[11px] leading-relaxed text-violet-900/90 dark:text-violet-300/90">
        {t("booking.portal.openSpacePoolCaption")}
      </p>

      <ol className="mt-3 list-none space-y-2 p-0">
        {(
          [
            "booking.portal.openSpaceFlowStep1",
            "booking.portal.openSpaceFlowStep2",
            "booking.portal.openSpaceFlowStep3",
          ] as const
        ).map((stepKey, index) => (
          <li key={stepKey} className="flex gap-2.5 text-xs leading-snug text-violet-900/95 dark:text-violet-200/95">
            <span
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-700 text-[11px] font-bold text-white dark:bg-violet-400 dark:text-violet-950"
              aria-hidden
            >
              {index + 1}
            </span>
            <span className="min-w-0 pt-0.5">{t(stepKey)}</span>
          </li>
        ))}
      </ol>

      <Link
        href={withBasePath("/booking/open-space")}
        className="mt-4 inline-flex w-full items-center justify-center rounded-lg bg-violet-700 px-4 py-2.5 text-center text-sm font-semibold text-white shadow-sm transition hover:bg-violet-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600 dark:bg-violet-500 dark:text-violet-950 dark:hover:bg-violet-400"
      >
        {t("booking.portal.linkOpenSpace")}
      </Link>

      <p className="mt-3 text-center text-[11px] leading-relaxed text-violet-900/85 dark:text-violet-300/85">
        {t("booking.portal.openSpaceQuotaPrefix")}
        <Link
          href={withBasePath("/account")}
          className="font-medium text-violet-950 underline decoration-violet-950/30 underline-offset-2 hover:decoration-violet-950 dark:text-violet-200 dark:decoration-violet-200/40"
        >
          {t("booking.portal.openSpaceQuotaLinkLabel")}
        </Link>
        {t("booking.portal.openSpaceQuotaSuffix")}
      </p>
    </section>
  );
}

export type BookingPortalVariant = "studio" | "open_space";

export function BookingPortalPageMain({ variant = "studio" }: { variant?: BookingPortalVariant }) {
  const { t } = useTranslation();
  const isOpen = variant === "open_space";
  const venueKind = isOpen ? "open_space" : "studio_room";
  const prefix = isOpen ? "/booking/open-space" : "/booking";

  return (
    <main className="mx-auto max-w-3xl px-5 sm:px-4 py-12">
      <h1 className="font-serif text-3xl text-stone-900 dark:text-stone-50">
        {isOpen ? t("booking.openSpacePortal.title") : t("booking.portal.title")}
      </h1>
      <p className="mt-3 text-sm text-stone-600 dark:text-stone-400">
        {isOpen ? (
          t("booking.openSpacePortal.intro")
        ) : (
          <>
            {t("booking.portal.introBeforeQuotaLink")}
            <Link
              href={`${withBasePath("/faq")}#user-types`}
              className="font-medium text-[#B8860B] underline decoration-[#B8860B] underline-offset-2 hover:text-[#9A7209] hover:decoration-[#9A7209] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B8860B]"
            >
              {t("booking.portal.introQuotaLinkLabel")}
            </Link>
            {t("booking.portal.introAfterQuotaLink")}
          </>
        )}
      </p>
      {isOpen ? (
        <div className="mt-6 space-y-4">
          <OpenSpaceVenueInfoCards compact />
          <div className="grid gap-4 sm:grid-cols-2">
            <figure className="overflow-hidden rounded-xl border border-stone-200 dark:border-stone-700">
              <Image
                src={withBasePath("/open-space/entrance.png")}
                alt={t("booking.openSpacePortal.imageEntranceAlt")}
                width={1200}
                height={900}
                className="h-auto w-full object-cover"
              />
            </figure>
            <figure className="overflow-hidden rounded-xl border border-stone-200 dark:border-stone-700">
              <Image
                src={withBasePath("/open-space/corridor.png")}
                alt={t("booking.openSpacePortal.imageCorridorAlt")}
                width={1200}
                height={900}
                className="h-auto w-full object-cover"
              />
            </figure>
          </div>
        </div>
      ) : null}
      <div className="mt-10">
        <BookingRequestPanel
          venueKind={venueKind}
          bookingPathPrefix={prefix}
          studioAlternatePathCallout={!isOpen ? <StudioOpenSpaceAlternatePathCallout /> : undefined}
        />
      </div>
      <div className="mt-12 flex flex-wrap gap-4 text-sm">
        <Link href={`${prefix}/calendar`} className="text-stone-800 dark:text-stone-200 underline">
          {isOpen ? t("booking.openSpacePortal.linkCalendar") : t("booking.portal.linkCalendar")}
        </Link>
        <Link href={`${prefix}/history`} className="text-stone-800 dark:text-stone-200 underline">
          {isOpen ? t("booking.openSpacePortal.linkHistory") : t("booking.portal.linkHistory")}
        </Link>
        <Link href="/account" className="text-stone-600 dark:text-stone-400 underline">
          {isOpen ? t("booking.openSpacePortal.linkAccount") : t("booking.portal.linkAccount")}
        </Link>
        <Link href="/" className="text-stone-600 dark:text-stone-400 underline">
          {isOpen ? t("booking.openSpacePortal.linkHome") : t("booking.portal.linkHome")}
        </Link>
      </div>
    </main>
  );
}
