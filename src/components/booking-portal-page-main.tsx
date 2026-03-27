"use client";

import Link from "next/link";
import { BookingRequestPanel } from "@/components/booking-request-panel";
import { useTranslation } from "@/lib/i18n/use-translation";

export function BookingPortalPageMain() {
  const { t } = useTranslation();
  return (
    <main className="mx-auto max-w-3xl px-5 sm:px-4 py-12">
      <h1 className="font-serif text-3xl text-stone-900 dark:text-stone-50">{t("booking.portal.title")}</h1>
      <p className="mt-3 text-sm text-stone-600 dark:text-stone-400">{t("booking.portal.intro")}</p>
      <div className="mt-10">
        <BookingRequestPanel />
      </div>
      <div className="mt-12 flex flex-wrap gap-4 text-sm">
        <Link href="/booking/calendar" className="text-stone-800 dark:text-stone-200 underline">
          {t("booking.portal.linkCalendar")}
        </Link>
        <Link href="/booking/history" className="text-stone-800 dark:text-stone-200 underline">
          {t("booking.portal.linkHistory")}
        </Link>
        <Link href="/account" className="text-stone-600 dark:text-stone-400 underline">
          {t("booking.portal.linkAccount")}
        </Link>
        <Link href="/" className="text-stone-600 dark:text-stone-400 underline">
          {t("booking.portal.linkHome")}
        </Link>
      </div>
    </main>
  );
}
