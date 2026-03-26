import { addDays } from "date-fns";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import { HK_TZ } from "@/lib/time";

export function hkDayStartUtc(key: string): Date {
  return fromZonedTime(`${key}T00:00:00`, HK_TZ);
}

export function hkDayEndUtc(key: string): Date {
  return fromZonedTime(`${key}T23:59:59.999`, HK_TZ);
}

/** Shift a Hong Kong calendar date key (yyyy-MM-dd) by whole days. */
export function shiftHkDateKey(key: string, deltaDays: number): string {
  const base = fromZonedTime(`${key}T12:00:00`, HK_TZ);
  const next = addDays(base, deltaDays);
  return formatInTimeZone(next, HK_TZ, "yyyy-MM-dd");
}

/** Difference in whole HK calendar days: slotKey minus todayKey (can be negative). */
export function hkCalendarDaysBetween(todayKey: string, otherKey: string): number {
  const t0 = fromZonedTime(`${todayKey}T12:00:00`, HK_TZ).getTime();
  const t1 = fromZonedTime(`${otherKey}T12:00:00`, HK_TZ).getTime();
  return Math.round((t1 - t0) / 86400000);
}

export function maxRollingThreeDaySum(counts: Map<string, number>): number {
  if (counts.size === 0) return 0;
  const keys = [...counts.keys()].sort();
  const minK = keys[0];
  const maxK = keys[keys.length - 1];
  let maxSum = 0;
  for (
    let start = shiftHkDateKey(minK, -2);
    start <= maxK;
    start = shiftHkDateKey(start, 1)
  ) {
    const d0 = start;
    const d1 = shiftHkDateKey(start, 1);
    const d2 = shiftHkDateKey(start, 2);
    const sum =
      (counts.get(d0) ?? 0) + (counts.get(d1) ?? 0) + (counts.get(d2) ?? 0);
    maxSum = Math.max(maxSum, sum);
  }
  return maxSum;
}
