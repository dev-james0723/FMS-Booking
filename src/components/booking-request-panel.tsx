"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { withBasePath } from "@/lib/base-path";
import {
  displayVenueLabel,
  formatSlotDateForLocale,
  formatSlotTimeRangeEn,
} from "@/lib/booking-slot-display";
import {
  addDaysToDateKey,
  buildMonthGrid,
  daysInCalendarMonth,
  isHkDayBookable,
  parseCampaignDateKeysFromSettings,
  slotStartsAtToHkDateKey,
} from "@/lib/hk-calendar-client";
import {
  CAMPAIGN_EXPERIENCE_RANGE_LABEL_EN,
  CAMPAIGN_EXPERIENCE_RANGE_LABEL_ZH,
} from "@/lib/booking/campaign-constants";
import { buildPreviewSlotsForHkDay } from "@/lib/booking/preview-slots";
import { useTranslation } from "@/lib/i18n/use-translation";
import {
  formatInstantForBookingOpensEn,
  formatInstantForBookingOpensZhHk,
  HK_TZ,
} from "@/lib/time";

type SlotRow = {
  id: string;
  startsAt: string;
  endsAt: string;
  remaining: number;
  venueLabel: string | null;
};

type LimitsPayload = {
  tier: string;
  limits: { dailyMax: number; rollingMax: number };
  todayKey: string;
  countsByDay: Record<string, number>;
  todayCommitted: number;
  todayRemaining: number;
  provisional: {
    wouldExceedDaily: boolean;
    wouldExceedRolling: boolean;
    firstViolatingDate: string | null;
    rollingSum: number;
  };
};

function hkTodayKeyFromMs(ms: number): string {
  return new Date(ms).toLocaleDateString("en-CA", { timeZone: HK_TZ });
}

function padMonthDay(n: number): string {
  return String(n).padStart(2, "0");
}

function defaultHkMonthKey(todayKey: string, cStart: string | null, cEnd: string | null): string {
  if (!cStart || !cEnd) return "2026-04";
  let y: number;
  let m: number;
  if (todayKey < cStart) {
    y = Number(cStart.slice(0, 4));
    m = Number(cStart.slice(5, 7));
  } else if (todayKey > cEnd) {
    y = Number(cEnd.slice(0, 4));
    m = Number(cEnd.slice(5, 7));
  } else {
    y = Number(todayKey.slice(0, 4));
    m = Number(todayKey.slice(5, 7));
  }
  if (!monthTouchesCampaign(y, m, cStart, cEnd)) {
    y = Number(cStart.slice(0, 4));
    m = Number(cStart.slice(5, 7));
  }
  return `${y}-${padMonthDay(m)}`;
}

function shiftCalendarMonth(y: number, m: number, delta: number): [number, number] {
  let nm = m + delta;
  let ny = y;
  while (nm > 12) {
    nm -= 12;
    ny += 1;
  }
  while (nm < 1) {
    nm += 12;
    ny -= 1;
  }
  return [ny, nm];
}

function monthTouchesCampaign(y: number, m: number, cStart: string, cEnd: string): boolean {
  const dim = daysInCalendarMonth(y, m);
  const first = `${y}-${padMonthDay(m)}-01`;
  const last = `${y}-${padMonthDay(m)}-${padMonthDay(dim)}`;
  return !(last < cStart || first > cEnd);
}

export function BookingRequestPanel() {
  const { t, tr, locale } = useTranslation();
  const campaignRange =
    locale === "en" ? CAMPAIGN_EXPERIENCE_RANGE_LABEL_EN : CAMPAIGN_EXPERIENCE_RANGE_LABEL_ZH;
  const weekdays = useMemo(
    () =>
      locale === "en"
        ? (["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const)
        : (["日", "一", "二", "三", "四", "五", "六"] as const),
    [locale]
  );

  const [settings, setSettings] = useState<Record<string, unknown> | null>(null);
  const [monthSlots, setMonthSlots] = useState<SlotRow[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [selectedDayKey, setSelectedDayKey] = useState<string | null>(null);
  const [monthOverride, setMonthOverride] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [limits, setLimits] = useState<LimitsPayload | null>(null);
  const [blockFlashSlotId, setBlockFlashSlotId] = useState<string | null>(null);
  const [dailyCapHint, setDailyCapHint] = useState<string | null>(null);

  const [nowMs, setNowMs] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNowMs(Date.now()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  const todayKey = hkTodayKeyFromMs(nowMs);

  const campaign = useMemo(
    () => parseCampaignDateKeysFromSettings(settings),
    [settings]
  );

  const maxAdvanceDays = useMemo(() => {
    const v = settings?.max_advance_booking_days;
    return typeof v === "number" && Number.isFinite(v) ? v : 3;
  }, [settings]);

  const defaultMonthKey = useMemo(
    () => defaultHkMonthKey(todayKey, campaign.start, campaign.end),
    [todayKey, campaign.start, campaign.end]
  );

  const viewMonthKey = monthOverride ?? defaultMonthKey;
  const viewYear = Number(viewMonthKey.slice(0, 4));
  const viewMonth = Number(viewMonthKey.slice(5, 7));

  const monthRange = useMemo(() => {
    const dim = daysInCalendarMonth(viewYear, viewMonth);
    const padM = padMonthDay(viewMonth);
    return {
      from: `${viewYear}-${padM}-01`,
      to: `${viewYear}-${padM}-${padMonthDay(dim)}`,
    };
  }, [viewYear, viewMonth]);

  const loadSettings = useCallback(async () => {
    const res = await fetch(withBasePath("/api/v1/public/settings"));
    const data = await res.json();
    setSettings(data.settings ?? {});
  }, []);

  const loadMonthSlots = useCallback(async () => {
    setLoading(true);
    setError(null);
    const q = new URLSearchParams({ from: monthRange.from, to: monthRange.to });
    const res = await fetch(withBasePath(`/api/v1/booking/availability?${q}`));
    const data = await res.json();
    if (!res.ok) {
      setError(data?.error?.message ?? t("booking.request.loadSlotsError"));
      setMonthSlots([]);
      setLoading(false);
      return;
    }
    setMonthSlots(data.slots.filter((s: SlotRow) => s.remaining > 0));
    setLoading(false);
  }, [monthRange.from, monthRange.to, t]);

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  useEffect(() => {
    void loadMonthSlots();
  }, [loadMonthSlots]);

  const selectedKey = [...selected].sort().join(",");

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const q =
        selected.size > 0
          ? `?extra=${encodeURIComponent([...selected].join(","))}`
          : "";
      const res = await fetch(withBasePath(`/api/v1/booking/limits${q}`), {
        credentials: "same-origin",
      });
      if (cancelled) return;
      if (!res.ok) {
        setLimits(null);
        return;
      }
      const data = await res.json().catch(() => null);
      if (data && typeof data === "object" && "limits" in data) {
        const raw = data as LimitsPayload & { countsByDay?: Record<string, number> };
        setLimits({
          ...raw,
          countsByDay: raw.countsByDay ?? {},
        });
      } else {
        setLimits(null);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- selectedKey encodes Set contents; avoids churn
  }, [selectedKey]);

  const dailyMax = limits?.limits.dailyMax ?? 3;
  const countsByDay = limits?.countsByDay ?? {};

  const bookingOpensAt =
    typeof settings?.booking_opens_at === "string" ? settings.booking_opens_at : null;
  const bookingLive = bookingOpensAt ? nowMs >= new Date(bookingOpensAt).getTime() : false;
  const bookingOpensAtLabel =
    bookingOpensAt != null
      ? locale === "en"
        ? formatInstantForBookingOpensEn(new Date(bookingOpensAt))
        : formatInstantForBookingOpensZhHk(new Date(bookingOpensAt))
      : null;

  const slotsForSelectedDay = useMemo(() => {
    if (!selectedDayKey) return [];
    if (!bookingLive) {
      return buildPreviewSlotsForHkDay(selectedDayKey);
    }
    return monthSlots.filter((s) => slotStartsAtToHkDateKey(s.startsAt) === selectedDayKey);
  }, [monthSlots, selectedDayKey, bookingLive]);

  const availableCountByDay = useMemo(() => {
    const m = new Map<string, number>();
    for (const s of monthSlots) {
      const k = slotStartsAtToHkDateKey(s.startsAt);
      m.set(k, (m.get(k) ?? 0) + 1);
    }
    return m;
  }, [monthSlots]);

  const monthGrid = useMemo(
    () => buildMonthGrid(viewYear, viewMonth),
    [viewYear, viewMonth]
  );

  const [prevYm, nextYm] = useMemo(() => {
    return [shiftCalendarMonth(viewYear, viewMonth, -1), shiftCalendarMonth(viewYear, viewMonth, 1)];
  }, [viewYear, viewMonth]);

  const prevNavDisabled =
    !campaign.start ||
    !campaign.end ||
    !monthTouchesCampaign(prevYm[0], prevYm[1], campaign.start, campaign.end);
  const nextNavDisabled =
    !campaign.start ||
    !campaign.end ||
    !monthTouchesCampaign(nextYm[0], nextYm[1], campaign.start, campaign.end);

  function selectedCountOnDay(dayKey: string, sel: Set<string>): number {
    let n = 0;
    for (const id of sel) {
      const s = monthSlots.find((x) => x.id === id);
      if (s && slotStartsAtToHkDateKey(s.startsAt) === dayKey) n++;
    }
    return n;
  }

  function tryToggleSlot(id: string) {
    if (!bookingLive) return;
    const slot = monthSlots.find((s) => s.id === id);
    if (!slot) return;

    if (selected.has(id)) {
      setSelected((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      return;
    }

    const dayKey = slotStartsAtToHkDateKey(slot.startsAt);
    const committed = countsByDay[dayKey] ?? 0;
    const selectedOnDay = selectedCountOnDay(dayKey, selected);
    if (committed + selectedOnDay >= dailyMax) {
      setBlockFlashSlotId(id);
      window.setTimeout(() => setBlockFlashSlotId(null), 650);
      setDailyCapHint(
        tr("booking.request.dailyCapHint", {
          dayKey,
          dailyMax: String(dailyMax),
        })
      );
      window.setTimeout(() => setDailyCapHint(null), 4500);
      return;
    }

    setSelected((prev) => new Set(prev).add(id));
  }

  async function submit() {
    setSubmitting(true);
    setError(null);
    setDone(null);
    const res = await fetch(withBasePath("/api/v1/booking/request"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slotIds: [...selected] }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data?.error?.message ?? t("booking.request.submitError"));
      setSubmitting(false);
      return;
    }
    setDone(data.bookingRequestId ?? "OK");
    setSelected(new Set());
    await loadMonthSlots();
    setSubmitting(false);
  }

  const lastBookableKey =
    campaign.start && campaign.end
      ? (() => {
          const raw = addDaysToDateKey(todayKey, maxAdvanceDays);
          return raw < campaign.end ? raw : campaign.end;
        })()
      : null;

  return (
    <div className="space-y-6">
      {!bookingLive && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-5 sm:px-4 py-3 text-sm text-amber-950">
          {t("booking.request.notOpenBanner")}
          {bookingOpensAtLabel ? (
            <span className="mt-2 block text-xs text-amber-900/85">
              {tr("booking.request.bookingOpensLine", { time: bookingOpensAtLabel })}
            </span>
          ) : null}
        </p>
      )}

      <div className="space-y-3">
        <p className="text-sm text-stone-600 dark:text-stone-400">
          {tr("booking.request.campaignLine", {
            range: campaignRange,
            maxAdvance: String(maxAdvanceDays),
          })}
        </p>
        <button
          type="button"
          onClick={() => void loadMonthSlots()}
          className="flex w-full min-h-12 items-center justify-center rounded-lg border border-blue-950/40 bg-blue-950 px-5 sm:px-4 py-3 text-center text-sm font-medium text-white shadow-sm transition hover:bg-blue-900 active:bg-blue-950 sm:min-h-[3rem] sm:text-base focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-800"
        >
          {t("booking.request.refresh")}
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-5 sm:px-4 py-2 text-sm text-red-900">
          {error}
        </div>
      )}
      {done && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-5 sm:px-4 py-2 text-sm text-emerald-900">
          {tr("booking.request.submitted", { id: done })}
          <Link href="/booking/history" className="ml-2 underline">
            {t("booking.request.viewHistory")}
          </Link>
        </div>
      )}

      {dailyCapHint && (
        <p
          className="rounded-lg border border-red-300 bg-red-50 px-5 sm:px-4 py-2 text-sm text-red-900 motion-safe:animate-pulse"
          role="status"
        >
          {dailyCapHint}
        </p>
      )}

      <div className="space-y-3">
        <Link
          href="/booking/calendar"
          className="flex w-full min-h-12 items-center justify-center rounded-lg border border-emerald-950/30 bg-emerald-900 px-5 sm:px-4 py-3 text-center text-sm font-medium text-white shadow-sm transition hover:bg-emerald-950 active:bg-emerald-950 sm:min-h-[3rem] sm:text-base focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800"
        >
          {t("booking.request.linkCalendarOverview")}
        </Link>

        {limits && (
          <div className="rounded-lg border border-stone-200 dark:border-stone-700 bg-surface px-5 sm:px-4 py-3 text-sm text-stone-700 dark:text-stone-300 shadow-sm">
            <p className="font-medium text-stone-900 dark:text-stone-50">{t("booking.request.limitsTitle")}</p>
            <p className="mt-1 text-xs text-stone-600 dark:text-stone-400">
              {tr("booking.request.limitsToday", {
                todayKey: limits.todayKey,
                committed: String(limits.todayCommitted),
                remaining: String(limits.todayRemaining),
                dailyMax: String(limits.limits.dailyMax),
                tier:
                  limits.tier === "extended"
                    ? t("booking.request.tierExtended")
                    : t("booking.request.tierGeneral"),
              })}
            </p>
            <p className="mt-1 text-xs text-stone-500 dark:text-stone-500">
              {tr("booking.request.limitsPickHint", {
                dailyMax: String(limits.limits.dailyMax),
              })}
            </p>
            {selected.size > 0 &&
              (limits.provisional.wouldExceedDaily || limits.provisional.wouldExceedRolling) && (
                <p className="mt-2 text-sm font-medium text-red-800">
                  {t("booking.request.wouldExceedTitle")}
                  {limits.provisional.wouldExceedDaily && (
                    <span className="block">
                      {tr("booking.request.exceedDaily", {
                        dailyMax: String(limits.limits.dailyMax),
                        datePart: limits.provisional.firstViolatingDate
                          ? tr("booking.request.exceedDailyDate", {
                              date: limits.provisional.firstViolatingDate,
                            })
                          : "",
                      })}
                    </span>
                  )}
                  {limits.provisional.wouldExceedRolling && (
                    <span className="block">
                      {tr("booking.request.exceedRolling", {
                        rollingSum: String(limits.provisional.rollingSum),
                        rollingMax: String(limits.limits.rollingMax),
                      })}
                    </span>
                  )}
                </p>
              )}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-stone-200 dark:border-stone-700 bg-surface p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-medium text-stone-900 dark:text-stone-50">
            {tr("booking.request.monthTitle", {
              year: String(viewYear),
              month: String(viewMonth),
            })}
          </h2>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={prevNavDisabled}
              onClick={() => {
                setSelectedDayKey(null);
                const [ny, nm] = prevYm;
                setMonthOverride(`${ny}-${padMonthDay(nm)}`);
              }}
              className="rounded-lg border border-stone-300 dark:border-stone-600 px-3 py-1.5 text-sm text-stone-800 dark:text-stone-200 hover:bg-stone-50 dark:hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {t("booking.request.prevMonth")}
            </button>
            <button
              type="button"
              disabled={nextNavDisabled}
              onClick={() => {
                setSelectedDayKey(null);
                const [ny, nm] = nextYm;
                setMonthOverride(`${ny}-${padMonthDay(nm)}`);
              }}
              className="rounded-lg border border-stone-300 dark:border-stone-600 px-3 py-1.5 text-sm text-stone-800 dark:text-stone-200 hover:bg-stone-50 dark:hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {t("booking.request.nextMonth")}
            </button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-7 gap-1 text-center text-xs font-medium text-stone-500 dark:text-stone-500">
          {weekdays.map((w) => (
            <div key={w} className="py-1">
              {w}
            </div>
          ))}
        </div>

        <div className="mt-1 grid grid-cols-7 gap-1">
          {monthGrid.map((cell, idx) => {
            const dk = cell.dateKey;
            if (!dk) {
              return <div key={`e-${idx}`} className="aspect-square min-h-[2.75rem]" />;
            }
            const inCampaignRange =
              Boolean(campaign.start && campaign.end) &&
              dk >= campaign.start! &&
              dk <= campaign.end!;
            const bookable = inCampaignRange
              ? bookingLive
                ? isHkDayBookable({
                    dateKey: dk,
                    todayKey,
                    campaignStart: campaign.start!,
                    campaignEnd: campaign.end!,
                    maxAdvanceDays,
                  })
                : true
              : false;
            const avail = availableCountByDay.get(dk) ?? 0;
            const isSelected = selectedDayKey === dk;
            return (
              <button
                key={dk}
                type="button"
                disabled={!bookable}
                onClick={() => {
                  if (bookable) setSelectedDayKey(dk);
                }}
                className={`relative flex aspect-square min-h-[2.75rem] flex-col items-center justify-center rounded-lg border text-sm transition ${
                  !bookable
                    ? "cursor-not-allowed border-stone-100 dark:border-stone-800 bg-stone-50 dark:bg-stone-900 text-stone-300"
                    : isSelected
                      ? "border-stone-900 bg-stone-900 text-white shadow-sm"
                      : "border-stone-200 dark:border-stone-700 bg-surface text-stone-800 dark:text-stone-200 hover:border-stone-400 dark:border-stone-500"
                }`}
              >
                <span className="font-medium">{Number(dk.slice(8, 10))}</span>
                {bookingLive && bookable && avail > 0 && (
                  <span
                    className={`mt-0.5 h-1.5 w-1.5 rounded-full ${
                      isSelected ? "bg-emerald-300" : "bg-emerald-500"
                    }`}
                    title={tr("booking.request.dotTitle", { n: String(avail) })}
                  />
                )}
                {bookingLive && bookable && avail === 0 && (
                  <span className="mt-0.5 text-[9px] text-stone-400 dark:text-stone-500">
                    {t("booking.request.fullLabel")}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <p className="mt-3 text-xs text-stone-500 dark:text-stone-500">
          {bookingLive ? (
            <>
              {tr("booking.request.hintPickDayLive", {
                maxAdvance: String(maxAdvanceDays),
                lastDay: lastBookableKey ?? t("booking.request.dash"),
              })}
            </>
          ) : (
            <>
              {tr("booking.request.hintPickDayPreview", {
                range: campaignRange,
                maxAdvance: String(maxAdvanceDays),
                lastDay: lastBookableKey ?? t("booking.request.dash"),
              })}
            </>
          )}
        </p>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-medium text-stone-800 dark:text-stone-200">
          {selectedDayKey
            ? bookingLive
              ? tr("booking.request.slotsTitleLive", { day: selectedDayKey })
              : tr("booking.request.slotsTitlePreview", { day: selectedDayKey })
            : t("booking.request.slotsTitleNone")}
        </h3>

        {loading && bookingLive ? (
          <p className="text-sm text-stone-500 dark:text-stone-500">{t("booking.request.loadingSlots")}</p>
        ) : !selectedDayKey ? (
          <p className="text-sm text-stone-500 dark:text-stone-500">
            {bookingLive ? t("booking.request.emptyHintLive") : t("booking.request.emptyHintPreview")}
          </p>
        ) : slotsForSelectedDay.length === 0 ? (
          <p className="text-sm text-stone-500 dark:text-stone-500">{t("booking.request.noSlotsDay")}</p>
        ) : (
          <>
            <ul className="grid gap-2 sm:grid-cols-2">
              {slotsForSelectedDay.map((s) => {
                const on = selected.has(s.id);
                const flash = blockFlashSlotId === s.id;
                if (!bookingLive) {
                  return (
                    <li key={s.id}>
                      <div className="w-full cursor-not-allowed rounded-lg border border-dashed border-stone-300 dark:border-stone-600 bg-stone-50 dark:bg-stone-900 px-3 py-3 text-left text-sm text-stone-600 dark:text-stone-400">
                        <span className="block font-medium text-stone-700 dark:text-stone-300">
                          {formatSlotDateForLocale(s.startsAt, locale)}
                        </span>
                        <span className="mt-0.5 block text-sm font-medium text-stone-800 dark:text-stone-200">
                          {formatSlotTimeRangeEn(s.startsAt, s.endsAt)}
                        </span>
                        <span className="mt-1 block text-xs text-stone-500 dark:text-stone-500">
                          {displayVenueLabel(s.venueLabel, locale)} · {t("booking.request.previewSlotSuffix")}
                        </span>
                      </div>
                    </li>
                  );
                }
                return (
                  <li key={s.id}>
                    <button
                      type="button"
                      onClick={() => tryToggleSlot(s.id)}
                      className={`w-full rounded-lg border px-3 py-3 text-left text-sm transition ${
                        flash ? "booking-slot-deny-flash" : ""
                      } ${
                        on
                          ? "border-stone-900 bg-stone-900 text-white"
                          : "border-stone-200 dark:border-stone-700 bg-surface hover:border-stone-400 dark:border-stone-500"
                      }`}
                    >
                      <span className="block font-medium">{formatSlotDateForLocale(s.startsAt, locale)}</span>
                      <span
                        className={`mt-0.5 block text-sm font-medium ${on ? "text-white" : "text-stone-800 dark:text-stone-200"}`}
                      >
                        {formatSlotTimeRangeEn(s.startsAt, s.endsAt)}
                      </span>
                      <span className={`mt-1 block text-xs ${on ? "text-stone-200" : "text-stone-500 dark:text-stone-500"}`}>
                        {displayVenueLabel(s.venueLabel, locale)} ·{" "}
                        {tr("booking.request.remainingSlots", { n: String(s.remaining) })}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
            {!bookingLive && selectedDayKey ? (
              <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-950">
                {tr("booking.request.notOpenYet", {
                  suffix: bookingOpensAtLabel
                    ? `：${bookingOpensAtLabel}`
                    : t("booking.request.notOpenFallback"),
                })}
              </p>
            ) : null}
          </>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3 border-t border-stone-200 dark:border-stone-700 pt-6">
        <button
          type="button"
          disabled={
            selected.size === 0 ||
            submitting ||
            !bookingLive ||
            (limits != null &&
              selected.size > 0 &&
              (limits.provisional.wouldExceedDaily || limits.provisional.wouldExceedRolling))
          }
          onClick={() => void submit()}
          className="rounded-full bg-stone-900 px-6 py-2.5 text-sm text-white disabled:opacity-40"
        >
          {submitting
            ? t("booking.request.submitting")
            : tr("booking.request.submitWithCount", { n: String(selected.size) })}
        </button>
        <Link href="/booking/history" className="text-sm text-stone-700 dark:text-stone-300 underline">
          {t("booking.request.linkHistory")}
        </Link>
      </div>

      <p className="text-xs text-stone-500 dark:text-stone-500">{t("booking.request.footnote")}</p>
    </div>
  );
}
