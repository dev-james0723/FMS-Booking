"use client";

import Link from "next/link";
import { BookingHistoryPanel } from "@/components/booking-history-panel";
import { useTranslation } from "@/lib/i18n/use-translation";

export function BookingHistoryPageMain() {
  const { t } = useTranslation();
  return (
    <main className="mx-auto max-w-3xl px-5 sm:px-4 py-12">
      <h1 className="font-serif text-3xl text-stone-900 dark:text-stone-50">{t("booking.historyPage.title")}</h1>
      <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">{t("booking.historyPage.note")}</p>
      <div className="mt-8">
        <BookingHistoryPanel />
      </div>
      <Link href="/booking" className="mt-10 inline-block text-sm text-stone-800 dark:text-stone-200 underline">
        {t("booking.historyPage.back")}
      </Link>
    </main>
  );
}
