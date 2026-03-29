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

/** Home page / emails: booking portal opens (instant shown in Hong Kong). */
export function formatInstantForBookingOpensZhHk(d: Date): string {
  const y = formatInTimeZone(d, HK_TZ, "yyyy");
  const monthNum = Number(formatInTimeZone(d, HK_TZ, "M"));
  const dayNum = Number(formatInTimeZone(d, HK_TZ, "d"));
  const hour24 = Number(formatInTimeZone(d, HK_TZ, "H"));
  const minute = Number(formatInTimeZone(d, HK_TZ, "m"));
  let period: string;
  let h12: number;
  if (hour24 === 0) {
    period = "上午";
    h12 = 12;
  } else if (hour24 < 12) {
    period = "上午";
    h12 = hour24;
  } else if (hour24 === 12) {
    period = "下午";
    h12 = 12;
  } else {
    period = "下午";
    h12 = hour24 - 12;
  }
  const clock =
    minute === 0
      ? `${period} ${h12} 點`
      : `${period} ${h12} 點 ${String(minute).padStart(2, "0")} 分`;
  return `${y} 年 ${monthNum} 月 ${dayNum} 日${clock}`;
}

/** Booking portal: opening instant in Hong Kong, English copy. */
export function formatInstantForBookingOpensEn(d: Date): string {
  return formatInTimeZone(d, HK_TZ, "d MMM yyyy 'at' h:mm a");
}

/**
 * Account / history lines: booking request timestamp in Hong Kong.
 * Uses date-fns-tz only so server (Node) and client match; `toLocaleString` can differ (e.g. U+202F).
 */
export function formatRequestedAtForAccountUi(d: Date, locale: "en" | "zh-HK"): string {
  if (locale === "en") {
    return formatInTimeZone(d, HK_TZ, "d/M/yyyy, h:mm:ss a");
  }
  const datePart = formatInTimeZone(d, HK_TZ, "d/M/yyyy");
  const hour24 = Number(formatInTimeZone(d, HK_TZ, "H"));
  const minute = Number(formatInTimeZone(d, HK_TZ, "m"));
  const second = Number(formatInTimeZone(d, HK_TZ, "s"));
  let period: string;
  let h12: number;
  if (hour24 === 0) {
    period = "上午";
    h12 = 12;
  } else if (hour24 < 12) {
    period = "上午";
    h12 = hour24;
  } else if (hour24 === 12) {
    period = "下午";
    h12 = 12;
  } else {
    period = "下午";
    h12 = hour24 - 12;
  }
  const timePart = `${period}${h12}:${String(minute).padStart(2, "0")}:${String(second).padStart(2, "0")}`;
  return `${datePart} ${timePart}`;
}
