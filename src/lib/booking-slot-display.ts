import { isoInstantToHkDateKey } from "@/lib/hk-calendar-client";
import type { Locale } from "@/lib/i18n/types";

const HK = "Asia/Hong_Kong";

const timeEn: Intl.DateTimeFormatOptions = {
  timeZone: HK,
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
};

function asDate(d: Date | string): Date {
  return typeof d === "string" ? new Date(d) : d;
}

/** e.g. 6:00 AM – 6:30 AM (Hong Kong) */
export function formatSlotTimeRangeEn(startsAt: Date | string, endsAt: Date | string): string {
  const s = asDate(startsAt);
  const e = asDate(endsAt);
  return `${s.toLocaleString("en-US", timeEn)} – ${e.toLocaleString("en-US", timeEn)}`;
}

/** Short HK calendar date + weekday */
export function formatSlotDateZhHk(startsAt: Date | string): string {
  return formatSlotDateForLocale(startsAt, "zh-HK");
}

export function formatSlotDateForLocale(
  startsAt: Date | string,
  locale: Locale
): string {
  const loc = locale === "en" ? "en-HK" : "zh-HK";
  return asDate(startsAt).toLocaleString(loc, {
    timeZone: HK,
    weekday: "short",
    month: "numeric",
    day: "numeric",
  });
}

export function formatSlotListLineZhDateEnRange(
  startsAt: Date | string,
  endsAt: Date | string
): string {
  return `${formatSlotDateZhHk(startsAt)} · ${formatSlotTimeRangeEn(startsAt, endsAt)}`;
}

export function formatSlotListLineForLocale(
  startsAt: Date | string,
  endsAt: Date | string,
  locale: Locale
): string {
  return `${formatSlotDateForLocale(startsAt, locale)} · ${formatSlotTimeRangeEn(startsAt, endsAt)}`;
}

export function displayVenueLabel(
  label: string | null | undefined,
  locale: Locale = "zh-HK"
): string {
  if (label == null || label.trim() === "") {
    return locale === "en" ? "Venue" : "場地";
  }
  return label.replace(/Studio A/g, "Room No.2");
}

/** Same calendar day in HKT: date + start–end times; spans two HK days uses full end stamp. */
export function formatMergedBlockHkRange(startIso: string, endIso: string, locale: Locale): string {
  const loc = locale === "en" ? "en-HK" : "zh-HK";
  const start = new Date(startIso);
  const end = new Date(endIso);
  const sk = isoInstantToHkDateKey(startIso);
  const ek = isoInstantToHkDateKey(endIso);
  const startOpts: Intl.DateTimeFormatOptions = {
    timeZone: HK,
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  };
  const endTime: Intl.DateTimeFormatOptions = {
    timeZone: HK,
    hour: "2-digit",
    minute: "2-digit",
  };
  const endFull: Intl.DateTimeFormatOptions = {
    timeZone: HK,
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  };
  if (sk === ek) {
    return `${start.toLocaleString(loc, startOpts)} — ${end.toLocaleString(loc, endTime)}`;
  }
  return `${start.toLocaleString(loc, startOpts)} — ${end.toLocaleString(loc, endFull)}`;
}
