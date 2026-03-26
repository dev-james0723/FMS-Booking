import { fromZonedTime } from "date-fns-tz";
import { CAMPAIGN_EXPERIENCE_FIRST_DAY_KEY } from "@/lib/booking/campaign-constants";
import { HK_TZ } from "@/lib/time";

/** Default timeline window start (most campaign days): 6:00 Hong Kong. */
export const TIMELINE_START_HOUR = 6;
export const TIMELINE_END_HOUR = 20;

/** First campaign day only: slots from 11:00. */
export const TIMELINE_FIRST_DAY_START_HOUR = 11;

export function timelineStartHourForHkDateKey(dateKey: string): number {
  return dateKey === CAMPAIGN_EXPERIENCE_FIRST_DAY_KEY
    ? TIMELINE_FIRST_DAY_START_HOUR
    : TIMELINE_START_HOUR;
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

export function hkInstantOnDate(dateKey: string, hour: number, minute: number): Date {
  return fromZonedTime(
    `${dateKey}T${pad2(hour)}:${pad2(minute)}:00`,
    HK_TZ
  );
}

export type TimelineClip = {
  topPct: number;
  heightPct: number;
  displayStart: Date;
  displayEnd: Date;
};

/**
 * Map a slot interval onto the day’s HK display window (first day 11:00–20:00, else 6:00–20:00).
 */
export function clipSlotToTimeline(
  dateKey: string,
  slotStart: Date,
  slotEnd: Date,
  windowStartHour: number = timelineStartHourForHkDateKey(dateKey)
): TimelineClip | null {
  const w0 = hkInstantOnDate(dateKey, windowStartHour, 0).getTime();
  const w1 = hkInstantOnDate(dateKey, TIMELINE_END_HOUR, 0).getTime();
  const total = w1 - w0;
  if (total <= 0) return null;

  const s = Math.max(slotStart.getTime(), w0);
  const e = Math.min(slotEnd.getTime(), w1);
  if (e <= s) return null;

  return {
    topPct: ((s - w0) / total) * 100,
    heightPct: ((e - s) / total) * 100,
    displayStart: new Date(s),
    displayEnd: new Date(e),
  };
}

export function formatHkRange(start: Date, end: Date): string {
  const a = start.toLocaleTimeString("zh-HK", {
    timeZone: HK_TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const b = end.toLocaleTimeString("zh-HK", {
    timeZone: HK_TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return `${a} – ${b}`;
}
