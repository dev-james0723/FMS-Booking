"use client";

import { useEffect, useState } from "react";
import { withBasePath } from "@/lib/base-path";
import {
  displayVenueLabel,
  formatSlotListLineForLocale,
} from "@/lib/booking-slot-display";
import { useTranslation } from "@/lib/i18n/use-translation";
import { bookingIdentityTypeLabelEn, bookingIdentityTypeLabelZh } from "@/lib/identity-labels";

type BookingRow = {
  id: string;
  status: string;
  requestedAt: string;
  bookingIdentityType: string;
  usesBonusSlot: boolean;
  slots: { startsAt: string; endsAt: string; venueLabel: string | null }[];
};

export function BookingHistoryPanel(props: { venueKind: "studio_room" | "open_space" }) {
  const { venueKind } = props;
  const { t, locale } = useTranslation();
  const [rows, setRows] = useState<BookingRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const q = new URLSearchParams({ venue: venueKind });
      const res = await fetch(withBasePath(`/api/v1/booking/history?${q}`));
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error?.message ?? t("booking.historyPanel.loadError"));
        return;
      }
      setRows(data.bookings ?? []);
    })();
  }, [t, venueKind]);

  if (error) {
    return <p className="text-sm text-red-700">{error}</p>;
  }

  if (rows.length === 0) {
    return (
      <p className="text-sm text-stone-500 dark:text-stone-500">{t("booking.historyPanel.empty")}</p>
    );
  }

  return (
    <ul className="space-y-4">
      {rows.map((r) => (
        <li
          key={r.id}
          className="rounded-xl border border-stone-200 dark:border-stone-700 bg-surface p-4 text-sm shadow-sm"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-mono text-xs text-stone-500 dark:text-stone-500">{r.id.slice(0, 8)}…</span>
            <span className="rounded-full bg-stone-100 dark:bg-stone-800 px-2 py-0.5 text-xs">
              {(() => {
                const path = `booking.status.${r.status}`;
                const label = t(path);
                return label === path ? r.status : label;
              })()}
            </span>
          </div>
          <p className="mt-2 text-xs text-stone-500 dark:text-stone-500">
            {t("booking.historyPanel.submittedAt")}
            {new Date(r.requestedAt).toLocaleString(locale === "en" ? "en-HK" : "zh-HK", {
              timeZone: "Asia/Hong_Kong",
            })}
            {r.usesBonusSlot ? ` · ${t("booking.historyPanel.bonusSlot")}` : ""}
            {" · "}
            {locale === "en"
              ? bookingIdentityTypeLabelEn(r.bookingIdentityType)
              : bookingIdentityTypeLabelZh(r.bookingIdentityType)}
          </p>
          <ul className="mt-3 space-y-1 text-stone-800 dark:text-stone-200">
            {r.slots.map((s, i) => (
              <li key={i}>
                {formatSlotListLineForLocale(s.startsAt, s.endsAt, locale)}
                {s.venueLabel != null && s.venueLabel !== ""
                  ? ` · ${displayVenueLabel(s.venueLabel, locale)}`
                  : ""}
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ul>
  );
}
