import { formatInTimeZone, toZonedTime } from "date-fns-tz";

export const HK_TZ = "Asia/Hong_Kong";

export function nowUtc(): Date {
  return new Date();
}

/** Interpret instant as HK local wall clock for calendar-day logic. */
export function toHkDate(d: Date): Date {
  return toZonedTime(d, HK_TZ);
}

export function formatHk(d: Date, pattern: string): string {
  return formatInTimeZone(d, HK_TZ, pattern);
}

export function startOfHkDay(d: Date): Date {
  const z = toZonedTime(d, HK_TZ);
  z.setHours(0, 0, 0, 0);
  return z;
}

export function hkDateKey(d: Date): string {
  return formatInTimeZone(d, HK_TZ, "yyyy-MM-dd");
}
