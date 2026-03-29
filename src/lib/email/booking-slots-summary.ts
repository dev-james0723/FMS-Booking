import { formatInTimeZone } from "date-fns-tz";
import { formatHkRange } from "@/lib/booking/day-timeline";
import { HK_TZ, hkDateKey } from "@/lib/time";
import type { Locale } from "@/lib/i18n/types";
import { escapeHtml } from "@/lib/email/escape-html";

export type MailSlotInterval = { startsAt: Date; endsAt: Date };

function sortSlots(slots: MailSlotInterval[]): MailSlotInterval[] {
  return [...slots].sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
}

function contiguousDaySlots(daySlots: MailSlotInterval[]): boolean {
  const s = sortSlots(daySlots);
  for (let i = 1; i < s.length; i++) {
    if (s[i].startsAt.getTime() !== s[i - 1].endsAt.getTime()) return false;
  }
  return s.length > 0;
}

function mergeDaySpan(daySlots: MailSlotInterval[]): { start: Date; end: Date } {
  const s = sortSlots(daySlots);
  return { start: s[0].startsAt, end: s[s.length - 1].endsAt };
}

function formatDateLine(locale: Locale, d: Date): string {
  if (locale === "en") {
    return formatInTimeZone(d, HK_TZ, "EEE, d MMM yyyy");
  }
  const y = formatInTimeZone(d, HK_TZ, "yyyy");
  const m = Number(formatInTimeZone(d, HK_TZ, "M"));
  const day = Number(formatInTimeZone(d, HK_TZ, "d"));
  const wd = new Intl.DateTimeFormat("zh-HK", {
    timeZone: HK_TZ,
    weekday: "short",
  }).format(d);
  return `${y}年${m}月${day}日（${wd}）`;
}

function formatTimeRangeEn(start: Date, end: Date): string {
  return `${formatInTimeZone(start, HK_TZ, "h:mm a")} – ${formatInTimeZone(end, HK_TZ, "h:mm a")}`;
}

/**
 * Human-readable booking times for emails: one line per calendar day (HKT).
 * Contiguous slots on the same day are merged into a single range.
 */
export function formatBookingSlotsSummaryForMail(
  locale: Locale,
  slots: MailSlotInterval[],
): { textLines: string[]; htmlBlock: string } {
  if (!slots.length) {
    const fallback =
      locale === "en"
        ? "(Unable to list time slots — please check booking history on the site.)"
        : "（未能列出時段，請於網站「預約紀錄」查看。）";
    return {
      textLines: [fallback],
      htmlBlock: `<p style="margin:0;color:#78716c;">${escapeHtml(fallback)}</p>`,
    };
  }

  const sorted = sortSlots(slots);
  const byDay = new Map<string, MailSlotInterval[]>();
  for (const s of sorted) {
    const k = hkDateKey(s.startsAt);
    const arr = byDay.get(k) ?? [];
    arr.push(s);
    byDay.set(k, arr);
  }
  const keys = [...byDay.keys()].sort();

  const textLines: string[] = [];
  const htmlItems: string[] = [];

  for (const k of keys) {
    const daySlots = sortSlots(byDay.get(k)!);
    const dateStr = formatDateLine(locale, daySlots[0].startsAt);
    const suffix = locale === "en" ? " (HKT)" : "（香港時間）";

    if (daySlots.length === 1 || contiguousDaySlots(daySlots)) {
      const { start, end } =
        daySlots.length === 1
          ? { start: daySlots[0].startsAt, end: daySlots[0].endsAt }
          : mergeDaySpan(daySlots);
      const range =
        locale === "en"
          ? formatTimeRangeEn(start, end)
          : formatHkRange(start, end);
      textLines.push(`${dateStr}　${range}${suffix}`);
      htmlItems.push(
        `<li style="margin:0 0 6px;">${escapeHtml(dateStr)}　<strong>${escapeHtml(range)}</strong>${escapeHtml(suffix)}</li>`,
      );
    } else {
      const ranges = sortSlots(daySlots)
        .map((s) =>
          locale === "en"
            ? formatTimeRangeEn(s.startsAt, s.endsAt)
            : formatHkRange(s.startsAt, s.endsAt),
        )
        .join(locale === "en" ? "; " : "、");
      textLines.push(`${dateStr}：${ranges}${suffix}`);
      htmlItems.push(
        `<li style="margin:0 0 6px;">${escapeHtml(dateStr)}：${escapeHtml(ranges)}${escapeHtml(suffix)}</li>`,
      );
    }
  }

  const htmlBlock = `<ul style="margin:8px 0 0;padding-left:20px;">${htmlItems.join("")}</ul>`;
  return { textLines, htmlBlock };
}
