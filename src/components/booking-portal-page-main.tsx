"use client";

import Image from "next/image";
import Link from "next/link";
import { BookingRequestPanel } from "@/components/booking-request-panel";
import { OpenSpaceVenueInfoCards } from "@/components/open-space-venue-info-cards";
import { useTranslation } from "@/lib/i18n/use-translation";
import { withBasePath } from "@/lib/base-path";

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
        {isOpen ? t("booking.openSpacePortal.intro") : t("booking.portal.intro")}
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
        <BookingRequestPanel venueKind={venueKind} bookingPathPrefix={prefix} />
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
