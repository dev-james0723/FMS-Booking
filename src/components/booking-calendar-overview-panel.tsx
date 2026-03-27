"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  DaySlotsTimeline,
  summarizeDaySlotsText,
  type TimelineSlotInput,
} from "@/components/day-slots-timeline";
import {
  CAMPAIGN_EXPERIENCE_FIRST_DAY_KEY,
  CAMPAIGN_EXPERIENCE_LAST_DAY_KEY,
  CAMPAIGN_EXPERIENCE_RANGE_LABEL_EN,
  CAMPAIGN_EXPERIENCE_RANGE_LABEL_ZH,
} from "@/lib/booking/campaign-constants";
import {
  TIMELINE_END_HOUR,
  timelineStartHourForHkDateKey,
} from "@/lib/booking/day-timeline";
import { withBasePath } from "@/lib/base-path";
import { buildMonthGrid } from "@/lib/hk-calendar-client";
import { useTranslation } from "@/lib/i18n/use-translation";
import { HK_TZ } from "@/lib/time";

const APRIL_2026 = { year: 2026, month1: 4 };
const MAY_2026 = { year: 2026, month1: 5 };

function hkTodayYmd(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: HK_TZ });
}

function defaultSelectedDay(): string {
  const t = hkTodayYmd();
  if (t >= CAMPAIGN_EXPERIENCE_FIRST_DAY_KEY && t <= CAMPAIGN_EXPERIENCE_LAST_DAY_KEY) {
    return t;
  }
  if (t < CAMPAIGN_EXPERIENCE_FIRST_DAY_KEY) return CAMPAIGN_EXPERIENCE_FIRST_DAY_KEY;
  return CAMPAIGN_EXPERIENCE_LAST_DAY_KEY;
}

function isSelectableCampaignDay(dateKey: string | null): dateKey is string {
  if (!dateKey) return false;
  return (
    dateKey >= CAMPAIGN_EXPERIENCE_FIRST_DAY_KEY && dateKey <= CAMPAIGN_EXPERIENCE_LAST_DAY_KEY
  );
}

function daySummary(slots: TimelineSlotInput[], dateKey: string) {
  const day = slots.filter(
    (s) =>
      new Date(s.startsAt).toLocaleDateString("en-CA", { timeZone: HK_TZ }) ===
      dateKey
  );
  let openAvailable = 0;
  let openFull = 0;
  let closed = 0;
  for (const s of day) {
    if (!s.isOpen) closed++;
    else if (s.remaining <= 0) openFull++;
    else openAvailable++;
  }
  return { total: day.length, openAvailable, openFull, closed };
}

function MonthCalendarBlock(props: {
  title: string;
  year: number;
  month1: number;
  slots: TimelineSlotInput[];
  selected: string;
  onSelect: (key: string) => void;
  weekdays: readonly string[];
  footer?: ReactNode;
}) {
  const grid = useMemo(
    () => buildMonthGrid(props.year, props.month1),
    [props.year, props.month1]
  );

  return (
    <div className="rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900/80 dark:bg-stone-900/80 p-4">
      <p className="text-center text-sm font-medium text-stone-800 dark:text-stone-200">{props.title}</p>
      <div className="mt-3 grid grid-cols-7 gap-1 text-center text-xs text-stone-500 dark:text-stone-500">
        {props.weekdays.map((w) => (
          <div key={w} className="py-1 font-medium">
            {w}
          </div>
        ))}
        {grid.map((cell, idx) => {
          if (!cell.dateKey) {
            return <div key={`pad-${idx}`} />;
          }
          const key = cell.dateKey;
          const selectable = isSelectableCampaignDay(key);
          const sum = daySummary(props.slots, key);
          const isSel = key === props.selected;
          let cellBg =
            "bg-surface hover:bg-stone-100 dark:hover:bg-neutral-800";
          let ring = "";
          if (!selectable) {
            cellBg = "bg-stone-100 dark:bg-stone-800/90 text-stone-400 dark:text-stone-500";
          } else if (sum.total === 0) {
            cellBg = "bg-stone-100 dark:bg-stone-800/90 text-stone-400 dark:text-stone-500";
          } else if (sum.openAvailable > 0) {
            cellBg =
              "bg-emerald-50 hover:bg-emerald-100/90 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/40 dark:text-emerald-100";
          } else if (sum.openFull > 0 && sum.openAvailable === 0) {
            cellBg =
              "bg-red-50 hover:bg-red-100/80 dark:bg-red-950/45 dark:hover:bg-red-900/35 dark:text-red-100";
          }
          if (isSel && selectable) {
            ring =
              "ring-2 ring-stone-900 ring-offset-2 ring-offset-background dark:ring-stone-100 dark:ring-offset-background";
          }
          const dayNum = Number(key.slice(8, 10));
          if (!selectable) {
            return (
              <div
                key={key}
                className={`rounded-lg border border-stone-200 dark:border-stone-700/60 py-2 text-sm font-medium ${cellBg}`}
              >
                {dayNum}
              </div>
            );
          }
          return (
            <button
              key={key}
              type="button"
              onClick={() => props.onSelect(key)}
              className={`rounded-lg border border-stone-200 dark:border-stone-700/80 py-2 text-sm font-medium text-stone-800 dark:text-stone-200 transition ${cellBg} ${ring}`}
            >
              {dayNum}
            </button>
          );
        })}
      </div>
      {props.footer ? <div className="mt-4">{props.footer}</div> : null}
    </div>
  );
}

export function BookingCalendarOverviewPanel() {
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

  const range = useMemo(
    () => ({
      from: CAMPAIGN_EXPERIENCE_FIRST_DAY_KEY,
      to: CAMPAIGN_EXPERIENCE_LAST_DAY_KEY,
    }),
    []
  );

  const [selected, setSelected] = useState(defaultSelectedDay);
  const [slots, setSlots] = useState<TimelineSlotInput[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOverviewData = useCallback(async () => {
    const q = new URLSearchParams({ from: range.from, to: range.to });
    const res = await fetch(withBasePath(`/api/v1/booking/calendar-overview?${q}`));
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return {
        ok: false as const,
        message: String(data?.error?.message ?? t("booking.cal.loadError")),
      };
    }
    return { ok: true as const, slots: (data.slots ?? []) as TimelineSlotInput[] };
  }, [range.from, range.to, t]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const result = await fetchOverviewData();
      if (cancelled) return;
      if (!result.ok) {
        setError(result.message);
        setSlots([]);
        setLoading(false);
        return;
      }
      setError(null);
      setSlots(result.slots);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [fetchOverviewData]);

  const refreshOverview = useCallback(() => {
    void (async () => {
      setLoading(true);
      setError(null);
      const result = await fetchOverviewData();
      if (!result.ok) {
        setError(result.message);
        setSlots([]);
        setLoading(false);
        return;
      }
      setSlots(result.slots);
      setLoading(false);
    })();
  }, [fetchOverviewData]);

  const lineTr = useCallback(
    (path: string, vars: Record<string, string>) => tr(path, vars),
    [tr]
  );
  const summaryText = useMemo(
    () => summarizeDaySlotsText(selected, slots, lineTr),
    [selected, slots, lineTr]
  );

  const windowStart = timelineStartHourForHkDateKey(selected);

  return (
    <div className="space-y-10">
      <div className="space-y-3">
        <div>
          <h2 className="font-serif text-xl text-stone-900 dark:text-stone-50">
            {tr("booking.cal.overviewTitle", { range: campaignRange })}
          </h2>
          <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">
            {t("booking.cal.overviewIntro")}
          </p>
        </div>
        <button
          type="button"
          onClick={refreshOverview}
          className="flex w-full min-h-12 items-center justify-center rounded-lg border border-blue-950/40 bg-blue-950 px-5 sm:px-4 py-3 text-center text-sm font-medium text-white shadow-sm transition hover:bg-blue-900 active:bg-blue-950 sm:min-h-[3rem] sm:text-base focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-800"
        >
          {t("booking.cal.refresh")}
        </button>
        {loading && (
          <p className="text-sm text-stone-500 dark:text-stone-500">{t("booking.cal.loading")}</p>
        )}
        {error && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200">
            {error}
          </p>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <MonthCalendarBlock
          title={t("booking.cal.monthApr")}
          year={APRIL_2026.year}
          month1={APRIL_2026.month1}
          slots={slots}
          selected={selected}
          onSelect={setSelected}
          weekdays={weekdays}
          footer={
            <Link
              href="/booking"
              className="flex w-full min-h-12 items-center justify-center rounded-lg border border-stone-800 bg-surface px-5 sm:px-4 py-3 text-center text-sm font-medium text-stone-900 shadow-sm transition hover:bg-stone-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-800 dark:border-stone-600 dark:text-stone-50 dark:hover:bg-neutral-800 dark:focus-visible:outline-stone-400 sm:min-h-[3rem] sm:text-base"
            >
              {t("booking.cal.leaveOverview")}
            </Link>
          }
        />
        <MonthCalendarBlock
          title={t("booking.cal.monthMay")}
          year={MAY_2026.year}
          month1={MAY_2026.month1}
          slots={slots}
          selected={selected}
          onSelect={setSelected}
          weekdays={weekdays}
        />
      </div>

      <p className="text-center text-xs text-stone-500 dark:text-stone-500">
        {t("booking.cal.legend")}
      </p>

      <section className="space-y-3">
        <h3 className="font-medium text-stone-900 dark:text-stone-50">
          {tr("booking.cal.selectedDate", { date: selected })}
        </h3>
        <p className="text-xs text-stone-500 dark:text-stone-500">
          {tr("booking.cal.timelineRange", {
            start: String(windowStart),
            end: String(TIMELINE_END_HOUR),
          })}
        </p>
        <DaySlotsTimeline dateKey={selected} slots={slots} variant="user" />
      </section>

      <section className="space-y-4 rounded-xl border border-stone-200 dark:border-stone-700 bg-surface px-5 sm:px-4 py-5 text-sm text-stone-800 dark:text-stone-200">
        <h3 className="font-medium text-stone-900 dark:text-stone-50">
          {t("booking.cal.textListTitle")}
        </h3>
        {summaryText.bookedLines.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-red-700">
              {t("booking.cal.sectionBooked")}
            </p>
            <ul className="mt-1 list-inside list-disc space-y-0.5 text-stone-700 dark:text-stone-300">
              {summaryText.bookedLines.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>
        )}
        {summaryText.availableLines.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
              {t("booking.cal.sectionAvailable")}
            </p>
            <ul className="mt-1 list-inside list-disc space-y-0.5 text-stone-700 dark:text-stone-300">
              {summaryText.availableLines.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>
        )}
        {summaryText.closedLines.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
              {t("booking.cal.sectionClosed")}
            </p>
            <ul className="mt-1 list-inside list-disc space-y-0.5 text-stone-600 dark:text-stone-400">
              {summaryText.closedLines.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>
        )}
        {summaryText.bookedLines.length === 0 &&
          summaryText.availableLines.length === 0 &&
          summaryText.closedLines.length === 0 && (
            <p className="text-stone-500 dark:text-stone-500">{t("booking.cal.noSlotData")}</p>
          )}
      </section>

      <div className="flex justify-center border-t border-stone-200 dark:border-stone-700 pt-8">
        <Link
          href="/booking"
          className="inline-flex min-h-[48px] items-center justify-center rounded-full bg-stone-900 px-8 py-3 text-sm font-medium text-white hover:bg-stone-800"
        >
          {t("booking.cal.ctaBooking")}
        </Link>
      </div>
    </div>
  );
}
