"use client";

import Link from "next/link";
import { BookingCalendarOverviewPanel } from "@/components/booking-calendar-overview-panel";
import { useTranslation } from "@/lib/i18n/use-translation";

export function BookingCalendarPageMain(props: {
  title: string;
  intro: string;
  venueKind: "studio_room" | "open_space";
  bookingPathPrefix: string;
}) {
  const { t } = useTranslation();
  const { bookingPathPrefix } = props;
  return (
    <main className="mx-auto max-w-3xl px-5 sm:px-4 py-12">
      <h1 className="font-serif text-3xl text-stone-900 dark:text-stone-50">{props.title}</h1>
      {props.intro.trim() ? (
        <p className="mt-3 text-sm text-stone-600 dark:text-stone-400">{props.intro}</p>
      ) : null}
      <div className={props.intro.trim() ? "mt-10" : "mt-8"}>
        <BookingCalendarOverviewPanel
          venueKind={props.venueKind}
          bookingPathPrefix={bookingPathPrefix}
        />
      </div>
      <div className="mt-12 flex flex-wrap gap-4 text-sm">
        <Link href={bookingPathPrefix} className="text-stone-800 dark:text-stone-200 underline">
          {t("booking.calendarPage.backBooking")}
        </Link>
        <Link href={`${bookingPathPrefix}/history`} className="text-stone-600 dark:text-stone-400 underline">
          {t("booking.calendarPage.linkHistory")}
        </Link>
        <Link href="/account" className="text-stone-600 dark:text-stone-400 underline">
          {t("booking.calendarPage.linkAccount")}
        </Link>
      </div>
    </main>
  );
}
