"use client";

import Link from "next/link";
import { BookingCalendarOverviewPanel } from "@/components/booking-calendar-overview-panel";
import { useTranslation } from "@/lib/i18n/use-translation";

export function BookingCalendarPageMain() {
  const { t } = useTranslation();
  return (
    <main className="mx-auto max-w-3xl px-5 sm:px-4 py-12">
      <h1 className="font-serif text-3xl text-stone-900 dark:text-stone-50">{t("booking.calendarPage.title")}</h1>
      <p className="mt-3 text-sm text-stone-600 dark:text-stone-400">{t("booking.calendarPage.intro")}</p>
      <div className="mt-10">
        <BookingCalendarOverviewPanel />
      </div>
      <div className="mt-12 flex flex-wrap gap-4 text-sm">
        <Link href="/booking" className="text-stone-800 dark:text-stone-200 underline">
          {t("booking.calendarPage.backBooking")}
        </Link>
        <Link href="/booking/history" className="text-stone-600 dark:text-stone-400 underline">
          {t("booking.calendarPage.linkHistory")}
        </Link>
        <Link href="/account" className="text-stone-600 dark:text-stone-400 underline">
          {t("booking.calendarPage.linkAccount")}
        </Link>
      </div>
    </main>
  );
}
