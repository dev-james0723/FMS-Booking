import { fromZonedTime } from "date-fns-tz";
import { HK_TZ } from "@/lib/time";

/** Timeline axis (display): 06:00–20:00 Hong Kong for all campaign days. */
export const TIMELINE_START_HOUR = 6;
export const TIMELINE_END_HOUR = 20;

/** Half-hour steps from start (06:00) to end (20:00), i.e. 28 segments, 29 tick marks. */
export const TIMELINE_HALF_HOUR_SEGMENT_COUNT =
  (TIMELINE_END_HOUR - TIMELINE_START_HOUR) * 2;

/** Labels for each half-hour tick on the axis (06:00 … 20:00). */
export function listHalfHourTimelineTickLabels(): string[] {
  const labels: string[] = [];
  const startMin = TIMELINE_START_HOUR * 60;
  const endMin = TIMELINE_END_HOUR * 60;
  for (let m = startMin; m <= endMin; m += 30) {
    const h = Math.floor(m / 60);
    const min = m % 60;
    labels.push(
      `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`
    );
  }
  return labels;
}

/** First hour (HKT) for bookable 30-minute slots on each campaign day (06:00–20:00). */
export function bookableStartHourForCampaignDateKey(_dateKey: string): number {
  return TIMELINE_START_HOUR;
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
 * Map a slot interval onto the fixed HK timeline axis (06:00–20:00).
 */
export function clipSlotToTimeline(
  dateKey: string,
  slotStart: Date,
  slotEnd: Date,
  windowStartHour: number = TIMELINE_START_HOUR
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
