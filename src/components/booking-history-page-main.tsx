"use client";

import Link from "next/link";
import { BookingHistoryPanel } from "@/components/booking-history-panel";
import { useTranslation } from "@/lib/i18n/use-translation";

export function BookingHistoryPageMain(props: {
  venueKind: "studio_room" | "open_space";
  bookingPathPrefix: string;
  googleCalendarOAuthReady: boolean;
  googleCalendarLinked: boolean;
}) {
  const { venueKind, bookingPathPrefix, googleCalendarOAuthReady, googleCalendarLinked } = props;
  const { t } = useTranslation();
  const historyTitleKey =
    venueKind === "studio_room"
      ? "booking.historyPage.titleStudioRoom"
      : "booking.historyPage.titleOpenSpace";
  return (
    <main className="mx-auto max-w-3xl px-5 sm:px-4 py-12">
      <BookingHistoryPanel
        pageHeading={t(historyTitleKey)}
        venueKind={venueKind}
        googleCalendarOAuthReady={googleCalendarOAuthReady}
        googleCalendarLinked={googleCalendarLinked}
      />
      <Link
        href={bookingPathPrefix}
        className="mt-10 inline-block text-sm text-stone-800 dark:text-stone-200 underline"
      >
        {t("booking.historyPage.back")}
      </Link>
    </main>
  );
}
