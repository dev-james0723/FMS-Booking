"use client";

import {
  TIMELINE_HALF_HOUR_SEGMENT_COUNT,
  clipSlotToTimeline,
  listHalfHourTimelineTickLabels,
} from "@/lib/booking/day-timeline";
import {
  displayVenueLabel,
  formatMergedBlockHkRange,
} from "@/lib/booking-slot-display";
import type { Locale } from "@/lib/i18n/types";
import { sessionHoursParen } from "@/lib/i18n/session-hours";
import { HK_TZ } from "@/lib/time";

export type MergedBandSlot = {
  start: Date;
  end: Date;
  venueLabel: string | null;
  sessionCount: number;
};

function hkDateKeyFromDate(d: Date): string {
  return d.toLocaleDateString("en-CA", { timeZone: HK_TZ });
}

function groupMergedByHkDay(merged: MergedBandSlot[]): Map<string, MergedBandSlot[]> {
  const map = new Map<string, MergedBandSlot[]>();
  for (const m of merged) {
    const key = hkDateKeyFromDate(m.start);
    const list = map.get(key) ?? [];
    list.push(m);
    map.set(key, list);
  }
  for (const list of map.values()) {
    list.sort((a, b) => a.start.getTime() - b.start.getTime());
  }
  return new Map([...map.entries()].sort(([a], [b]) => a.localeCompare(b)));
}

export function BookingHistoryMergedBands({
  merged,
  locale,
  bookingId,
}: {
  merged: MergedBandSlot[];
  locale: Locale;
  bookingId: string;
}) {
  if (merged.length === 0) return null;

  const locTag = locale === "en" ? "en-HK" : "zh-HK";
  const byDay = groupMergedByHkDay(merged);
  const halfHourLabels = listHalfHourTimelineTickLabels();
  const seg = TIMELINE_HALF_HOUR_SEGMENT_COUNT;
  /** Enough height that a 30-minute band is readable without distorting duration. */
  const trackMinPx = Math.max(400, seg * 14);

  return (
    <div className="mt-3 space-y-4">
      {[...byDay.entries()].map(([dateKey, dayMerged]) => {
        const dayTitle = (() => {
          const [y, mo, da] = dateKey.split("-").map((x) => parseInt(x, 10));
          if (!y || !mo || !da) return dateKey;
          return new Date(y, mo - 1, da).toLocaleDateString(locTag, {
            weekday: "long",
            month: "long",
            day: "numeric",
          });
        })();

        return (
          <div
            key={dateKey}
            id={`booking-history-day-${bookingId}-${dateKey}`}
            className="scroll-mt-6"
          >
            <p className="text-xs font-semibold text-stone-700 dark:text-stone-300">{dayTitle}</p>
            <div className="mt-2 flex gap-2">
              <div
                className="relative w-[3.25rem] shrink-0 py-1.5 text-right text-[10px] tabular-nums text-stone-500 dark:text-stone-500"
                style={{ minHeight: trackMinPx }}
                aria-hidden
              >
                {halfHourLabels.map((label, i) => (
                  <span
                    key={`${label}-${i}`}
                    className="absolute right-0 leading-none"
                    style={{
                      top: `${(i / seg) * 100}%`,
                      transform: "translateY(-50%)",
                    }}
                  >
                    {label}
                  </span>
                ))}
              </div>
              <div
                className="relative flex-1 rounded-lg border border-stone-200 bg-stone-50 py-1.5 dark:border-stone-700 dark:bg-stone-900/80"
                style={{ minHeight: trackMinPx }}
              >
                {halfHourLabels.map((label, i) => (
                  <div
                    key={`g-${label}-${i}`}
                    className="pointer-events-none absolute left-0 right-0 border-t border-stone-200/90 dark:border-stone-700/90"
                    style={{
                      top: `${(i / seg) * 100}%`,
                    }}
                  />
                ))}
                {dayMerged.map((m, idx) => {
                  const clip = clipSlotToTimeline(dateKey, m.start, m.end);
                  if (!clip) return null;
                  const startIso = m.start.toISOString();
                  const endIso = m.end.toISOString();
                  const rangeLabel = formatMergedBlockHkRange(startIso, endIso, locale);
                  const venue = displayVenueLabel(m.venueLabel, locale);
                  const sessionsH = sessionHoursParen(locale, m.sessionCount);
                  return (
                    <div
                      key={`${dateKey}-${idx}-${startIso}`}
                      className="absolute left-1 right-1 z-[1] rounded-md border border-violet-700 bg-violet-500/92 px-1.5 py-0.5 text-[10px] font-medium leading-tight text-white shadow-sm dark:border-violet-500 dark:bg-violet-600/95"
                      style={{
                        top: `calc(${clip.topPct}% + 1px)`,
                        height: `max(1px, calc(${clip.heightPct}% - 2px))`,
                      }}
                      title={`${rangeLabel} · ${venue}${sessionsH}`}
                    >
                      <span className="line-clamp-3 break-words">{rangeLabel}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            <ul className="mt-2 space-y-1 text-xs text-stone-600 dark:text-stone-400">
              {dayMerged.map((m, idx) => {
                const startIso = m.start.toISOString();
                const endIso = m.end.toISOString();
                return (
                  <li key={`${dateKey}-cap-${idx}`}>
                    <span className="font-medium text-stone-800 dark:text-stone-200">
                      {formatMergedBlockHkRange(startIso, endIso, locale)}
                    </span>
                    <span className="text-stone-500 dark:text-stone-500">
                      {" · "}
                      {displayVenueLabel(m.venueLabel, locale)}
                      {sessionHoursParen(locale, m.sessionCount)}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
