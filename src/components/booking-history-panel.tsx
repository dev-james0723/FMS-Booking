"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { withBasePath } from "@/lib/base-path";
import { BOOKING_SELF_SERVICE_CUTOFF_MS } from "@/lib/booking/booking-self-service-policy";
import { mergeConsecutiveSlots } from "@/lib/booking/merge-slots";
import { BookingHistoryMergedBands } from "@/components/booking-history-merged-bands";
import {
  BookingContactOrganizerModal,
  UserBookingCancelModal,
  UserBookingRescheduleModal,
  type SelfServiceSlot,
} from "@/components/booking-user-self-service-modals";
import { useTranslation } from "@/lib/i18n/use-translation";
import type { Locale } from "@/lib/i18n/types";
import { bookingIdentityTypeLabelEn, bookingIdentityTypeLabelZh } from "@/lib/identity-labels";
import { HK_TZ } from "@/lib/time";

type BookingRow = {
  id: string;
  status: string;
  /** Staff or user changed slots after submission (BookingStatusLog). */
  hasStaffReschedule?: boolean;
  hasReschedule?: boolean;
  requestedAt: string;
  bookingIdentityType: string;
  usesBonusSlot: boolean;
  slots: { id: string; startsAt: string; endsAt: string; venueLabel: string | null }[];
};

type HistorySituationFilter = "" | "cancelled" | "rescheduled" | "confirmed";

type HistoryStatusBucket = HistorySituationFilter | "other";

function historyStatusBucket(row: BookingRow): HistoryStatusBucket {
  if (row.status === "cancelled") return "cancelled";
  if (row.hasReschedule || row.hasStaffReschedule) return "rescheduled";
  if (row.status === "pending" || row.status === "approved") return "confirmed";
  return "other";
}

function canSelfServiceBooking(row: BookingRow): boolean {
  if (!["pending", "approved", "waitlisted"].includes(row.status)) return false;
  return row.slots.length > 0;
}

function bookingRowWithinCutoff(row: BookingRow): boolean {
  const now = Date.now();
  for (const s of row.slots) {
    if (new Date(s.startsAt).getTime() - now < BOOKING_SELF_SERVICE_CUTOFF_MS) return true;
  }
  return false;
}

function historyStatusBadge(
  row: BookingRow,
  t: (path: string) => string
): { text: string; className: string } {
  const bucket = historyStatusBucket(row);
  if (bucket === "cancelled") {
    return {
      text: t("booking.status.cancelled"),
      className:
        "border-red-400/90 bg-red-100 text-red-950 dark:border-red-700 dark:bg-red-950/55 dark:text-red-50",
    };
  }
  if (bucket === "rescheduled") {
    return {
      text: t("booking.status.rescheduled"),
      className:
        "border-amber-400/90 bg-amber-100 text-amber-950 dark:border-amber-600 dark:bg-amber-950/45 dark:text-amber-50",
    };
  }
  if (bucket === "confirmed") {
    return {
      text: t("booking.status.approved"),
      className:
        "border-emerald-400/90 bg-emerald-100 text-emerald-950 dark:border-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-50",
    };
  }
  const key = `booking.status.${row.status}`;
  const lbl = t(key);
  return {
    text: lbl === key ? row.status : lbl,
    className:
      "border-stone-200 bg-stone-100 text-stone-700 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-200",
  };
}

type SyncFlash = { bookingId: string; kind: "ok" | "err"; text: string };

function hkDateKeyFromIso(iso: string): string {
  return new Date(iso).toLocaleDateString("en-CA", { timeZone: HK_TZ });
}

function formatDateKeyForOption(dateKey: string, locale: Locale): string {
  const [y, mo, da] = dateKey.split("-").map((x) => parseInt(x, 10));
  if (!y || !mo || !da) return dateKey;
  return new Date(y, mo - 1, da).toLocaleDateString(locale === "en" ? "en-HK" : "zh-HK", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function firstBookingIdForDate(rows: BookingRow[], dateKey: string): string | null {
  for (const r of rows) {
    for (const s of r.slots) {
      if (hkDateKeyFromIso(s.startsAt) === dateKey) return r.id;
    }
  }
  return null;
}

export function BookingHistoryPanel(props: {
  venueKind: "studio_room" | "open_space";
  googleCalendarOAuthReady: boolean;
  googleCalendarLinked: boolean;
  pageHeading: string;
}) {
  const { venueKind, googleCalendarOAuthReady, googleCalendarLinked, pageHeading } = props;
  const { t, tr, locale } = useTranslation();
  const [rows, setRows] = useState<BookingRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [syncBusyId, setSyncBusyId] = useState<string | null>(null);
  const [syncFlash, setSyncFlash] = useState<SyncFlash | null>(null);
  const [filterDate, setFilterDate] = useState("");
  const [filterSituation, setFilterSituation] = useState<HistorySituationFilter>("");
  const [contactOrganizerOpen, setContactOrganizerOpen] = useState(false);
  const [rescheduleTarget, setRescheduleTarget] = useState<{
    id: string;
    slots: SelfServiceSlot[];
  } | null>(null);
  const [cancelTarget, setCancelTarget] = useState<{ id: string; slots: SelfServiceSlot[] } | null>(
    null
  );

  const rowsAfterSituation = useMemo(() => {
    if (!filterSituation) return rows;
    return rows.filter((r) => historyStatusBucket(r) === filterSituation);
  }, [rows, filterSituation]);

  const sortedBookingDates = useMemo(() => {
    const s = new Set<string>();
    for (const r of rowsAfterSituation) {
      for (const x of r.slots) {
        s.add(hkDateKeyFromIso(x.startsAt));
      }
    }
    return [...s].sort();
  }, [rowsAfterSituation]);

  useEffect(() => {
    if (filterDate && !sortedBookingDates.includes(filterDate)) {
      setFilterDate("");
    }
  }, [filterDate, sortedBookingDates]);

  const connectHref = withBasePath("/api/v1/account/google-calendar/oauth/start");

  const loadHistory = useCallback(async () => {
    const q = new URLSearchParams({ venue: venueKind });
    const res = await fetch(withBasePath(`/api/v1/booking/history?${q}`));
    const data = await res.json();
    if (!res.ok) {
      setError(data?.error?.message ?? t("booking.historyPanel.loadError"));
      return;
    }
    setError(null);
    const list = (data.bookings ?? []) as BookingRow[];
    setRows(
      list.map((r) => ({
        ...r,
        hasStaffReschedule: Boolean(r.hasStaffReschedule),
        hasReschedule: Boolean(r.hasReschedule ?? r.hasStaffReschedule),
        slots: (r.slots ?? []).map((s) => ({
          id: s.id,
          startsAt: s.startsAt,
          endsAt: s.endsAt,
          venueLabel: s.venueLabel ?? null,
        })),
      }))
    );
  }, [t, venueKind]);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  function tryOpenSelfService(row: BookingRow, kind: "reschedule" | "cancel") {
    if (!canSelfServiceBooking(row)) return;
    if (bookingRowWithinCutoff(row)) {
      setContactOrganizerOpen(true);
      return;
    }
    const slots: SelfServiceSlot[] = row.slots.map((s) => ({
      id: s.id,
      startsAt: s.startsAt,
      endsAt: s.endsAt,
      venueLabel: s.venueLabel,
    }));
    if (kind === "reschedule") {
      setRescheduleTarget({ id: row.id, slots });
    } else {
      setCancelTarget({ id: row.id, slots });
    }
  }

  async function runSyncBooking(bookingId: string) {
    setSyncBusyId(bookingId);
    setSyncFlash(null);
    const res = await fetch(withBasePath("/api/v1/account/google-calendar/sync-booking"), {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingId }),
    });
    const data = (await res.json().catch(() => ({}))) as {
      created?: number;
      updated?: number;
      removed?: number;
      error?: { code?: string; message?: string };
    };
    setSyncBusyId(null);
    if (!res.ok) {
      const code = data.error?.code;
      if (code === "NOT_LINKED") {
        setSyncFlash({
          bookingId,
          kind: "err",
          text: t("account.gcalSyncNeedConnect"),
        });
      } else {
        setSyncFlash({
          bookingId,
          kind: "err",
          text: data.error?.message ?? t("account.gcalSyncError"),
        });
      }
      return;
    }
    setSyncFlash({
      bookingId,
      kind: "ok",
      text: tr("account.gcalSyncResult", {
        created: String(data.created ?? 0),
        updated: String(data.updated ?? 0),
        removed: String(data.removed ?? 0),
      }),
    });
  }

  const historyBannerSrc =
    venueKind === "studio_room"
      ? "/images/booking/history-studio-room-banner.png"
      : "/images/booking/history-open-space-banner.png";
  const historyBannerAltKey =
    venueKind === "studio_room"
      ? "booking.historyPage.bannerStudioRoomAlt"
      : "booking.historyPage.bannerOpenSpaceAlt";

  return (
    <>
      <figure className="mb-8 overflow-hidden rounded-xl border border-stone-200 dark:border-stone-700">
        <Image
          src={withBasePath(historyBannerSrc)}
          alt={t(historyBannerAltKey)}
          width={1024}
          height={682}
          className="h-auto w-full object-cover"
          priority
        />
      </figure>
      <h1 className="font-serif text-3xl text-stone-900 dark:text-stone-50">{pageHeading}</h1>

      {error ? (
        <p className="mt-8 text-sm text-red-700">{error}</p>
      ) : rows.length === 0 ? (
        <p className="mt-8 text-sm text-stone-500 dark:text-stone-500">
          {t("booking.historyPanel.empty")}
        </p>
      ) : (
        <>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="flex min-w-0 flex-col gap-2">
              <label
                htmlFor="booking-history-date-filter"
                className="text-sm font-medium text-stone-700 dark:text-stone-300"
              >
                {t("booking.historyPanel.filterByDateLabel")}
              </label>
              <select
                id="booking-history-date-filter"
                className="w-full max-w-full rounded-lg border border-stone-300 bg-surface px-3 py-2 text-sm text-stone-900 shadow-sm dark:border-stone-600 dark:text-stone-100"
                value={filterDate}
                onChange={(e) => {
                  const v = e.target.value;
                  setFilterDate(v);
                  if (!v) return;
                  const bid = firstBookingIdForDate(rowsAfterSituation, v);
                  if (!bid) return;
                  window.requestAnimationFrame(() => {
                    document
                      .getElementById(`booking-history-day-${bid}-${v}`)
                      ?.scrollIntoView({ behavior: "smooth", block: "start" });
                  });
                }}
              >
                <option value="">{t("booking.historyPanel.filterByDateAll")}</option>
                {sortedBookingDates.map((dk) => (
                  <option key={dk} value={dk}>
                    {formatDateKeyForOption(dk, locale)}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex min-w-0 flex-col gap-2">
              <label
                htmlFor="booking-history-situation-filter"
                className="text-sm font-medium text-stone-700 dark:text-stone-300"
              >
                {t("booking.historyPanel.filterSituationLabel")}
              </label>
              <select
                id="booking-history-situation-filter"
                className="w-full max-w-full rounded-lg border border-stone-300 bg-surface px-3 py-2 text-sm text-stone-900 shadow-sm dark:border-stone-600 dark:text-stone-100"
                value={filterSituation}
                onChange={(e) =>
                  setFilterSituation((e.target.value || "") as HistorySituationFilter)
                }
              >
                <option value="">{t("booking.historyPanel.filterSituationAll")}</option>
                <option value="cancelled">{t("booking.status.cancelled")}</option>
                <option value="rescheduled">{t("booking.status.rescheduled")}</option>
                <option value="confirmed">{t("booking.status.approved")}</option>
              </select>
            </div>
          </div>

          {rowsAfterSituation.length === 0 ? (
            <p className="mt-8 text-sm text-stone-500 dark:text-stone-500">
              {t("booking.historyPanel.noRowsForFilters")}
            </p>
          ) : (
            <ul className="mt-8 space-y-4">
            {rowsAfterSituation.map((r) => {
              const merged = mergeConsecutiveSlots(
                r.slots.map((s) => ({
                  startsAt: new Date(s.startsAt),
                  endsAt: new Date(s.endsAt),
                  venueLabel: s.venueLabel,
                }))
              );
              const badge = historyStatusBadge(r, t);
              const showCancelledTimeline = historyStatusBucket(r) === "cancelled";

              return (
                <li
                  key={r.id}
                  className="rounded-xl border border-stone-200 dark:border-stone-700 bg-surface p-4 text-sm shadow-sm"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-mono text-xs font-medium text-stone-700 dark:text-stone-300">
                      {r.id.slice(0, 8)}…
                    </span>
                    <span
                      className={`rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${badge.className}`}
                    >
                      {badge.text}
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

                  {showCancelledTimeline && merged.length > 0 ? (
                    <p className="mt-3 text-xs font-medium text-red-800 dark:text-red-300/95">
                      {t("booking.historyPanel.cancelledSlotsIntro")}
                    </p>
                  ) : null}

                  {merged.length === 0 ? (
                    <p className="mt-3 text-xs text-stone-500 dark:text-stone-500">
                      {showCancelledTimeline
                        ? t("booking.historyPanel.cancelledNoSlotData")
                        : "—"}
                    </p>
                  ) : (
                    <BookingHistoryMergedBands
                      bookingId={r.id}
                      merged={merged.map((m) => ({
                        start: m.start,
                        end: m.end,
                        venueLabel: m.venueLabel,
                        sessionCount: m.sessionCount,
                      }))}
                      locale={locale}
                      cancelledVisual={showCancelledTimeline}
                    />
                  )}

                  {canSelfServiceBooking(r) ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => tryOpenSelfService(r, "reschedule")}
                        className="rounded-full border border-sky-600 bg-sky-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-sky-700 dark:border-sky-500 dark:bg-sky-600 dark:hover:bg-sky-500"
                      >
                        {t("booking.historyPanel.selfService.changeBooking")}
                      </button>
                      <button
                        type="button"
                        onClick={() => tryOpenSelfService(r, "cancel")}
                        className="rounded-full border border-rose-600 bg-transparent px-4 py-2 text-xs font-semibold text-rose-800 hover:bg-rose-50 dark:border-rose-400 dark:text-rose-200 dark:hover:bg-rose-950/60"
                      >
                        {t("booking.historyPanel.selfService.cancelBooking")}
                      </button>
                    </div>
                  ) : null}

                  {googleCalendarOAuthReady && !showCancelledTimeline ? (
                    <div className="mt-4 border-t border-stone-100 pt-3 dark:border-stone-800">
                      {googleCalendarLinked ? (
                        <button
                          type="button"
                          disabled={syncBusyId !== null}
                          onClick={() => void runSyncBooking(r.id)}
                          className="rounded-full border border-stone-300 dark:border-stone-600 bg-surface px-4 py-2 text-xs font-medium text-stone-800 dark:text-stone-200 hover:bg-stone-50 dark:hover:bg-stone-800 disabled:opacity-60"
                        >
                          {syncBusyId === r.id
                            ? t("account.gcalSyncBusy")
                            : t("booking.historyPanel.syncToGoogleCalendar")}
                        </button>
                      ) : (
                        <a
                          href={connectHref}
                          className="inline-block rounded-full border border-stone-300 dark:border-stone-600 bg-surface px-4 py-2 text-xs font-medium text-stone-800 dark:text-stone-200 hover:bg-stone-50 dark:hover:bg-stone-800"
                        >
                          {t("account.gcalConnect")}
                        </a>
                      )}
                      {syncFlash?.bookingId === r.id && (
                        <p
                          className={`mt-2 text-xs ${
                            syncFlash.kind === "err"
                              ? "text-rose-600 dark:text-rose-400"
                              : "text-stone-600 dark:text-stone-400"
                          }`}
                        >
                          {syncFlash.text}
                        </p>
                      )}
                    </div>
                  ) : null}
                </li>
              );
            })}
            </ul>
          )}
        </>
      )}

      <BookingContactOrganizerModal
        open={contactOrganizerOpen}
        onClose={() => setContactOrganizerOpen(false)}
      />

      {rescheduleTarget ? (
        <UserBookingRescheduleModal
          open
          onClose={() => setRescheduleTarget(null)}
          bookingId={rescheduleTarget.id}
          venueKind={venueKind}
          currentSlots={rescheduleTarget.slots}
          onApplied={() => void loadHistory()}
          onWithinCutoff={() => {
            setRescheduleTarget(null);
            setContactOrganizerOpen(true);
          }}
        />
      ) : null}

      {cancelTarget ? (
        <UserBookingCancelModal
          open
          onClose={() => setCancelTarget(null)}
          bookingId={cancelTarget.id}
          venueKind={venueKind}
          currentSlots={cancelTarget.slots}
          onApplied={() => void loadHistory()}
          onWithinCutoff={() => {
            setCancelTarget(null);
            setContactOrganizerOpen(true);
          }}
        />
      ) : null}
    </>
  );
}
