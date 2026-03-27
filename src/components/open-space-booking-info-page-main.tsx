"use client";

import Image from "next/image";
import Link from "next/link";
import { OpenSpaceVenueInfoCards } from "@/components/open-space-venue-info-cards";
import { useTranslation } from "@/lib/i18n/use-translation";
import { withBasePath } from "@/lib/base-path";

export function OpenSpaceBookingInfoPageMain() {
  const { t } = useTranslation();

  return (
    <main className="mx-auto max-w-3xl px-5 sm:px-4 py-12">
      <h1 className="font-serif text-3xl text-stone-900 dark:text-stone-50">
        {t("booking.openSpacePortal.title")}
      </h1>
      <p className="mt-4 text-sm leading-relaxed text-stone-600 dark:text-stone-400">
        {t("booking.openSpace.infoPageLead")}
      </p>
      <div className="mt-8">
        <OpenSpaceVenueInfoCards />
      </div>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
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
      <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <Link
          href="/register?for=open-space"
          className="inline-flex min-h-12 items-center justify-center rounded-full border border-stone-800 bg-stone-900 px-6 py-3 text-center text-sm font-medium text-white hover:bg-stone-800 dark:border-stone-600 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-white"
        >
          {t("booking.openSpace.ctaRegister")}
        </Link>
        <Link
          href="/login?next=/booking/open-space"
          className="inline-flex min-h-12 items-center justify-center rounded-full border border-stone-300 px-6 py-3 text-center text-sm font-medium text-stone-800 hover:bg-stone-50 dark:border-stone-600 dark:text-stone-200 dark:hover:bg-stone-800"
        >
          {t("booking.openSpace.ctaBooking")}
        </Link>
      </div>
    </main>
  );
}
