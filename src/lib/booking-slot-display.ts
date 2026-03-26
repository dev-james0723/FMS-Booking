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
  return asDate(startsAt).toLocaleString("zh-HK", {
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

export function displayVenueLabel(label: string | null | undefined): string {
  if (label == null || label.trim() === "") return "場地";
  return label.replace(/Studio A/g, "Room No.2");
}
