import type { Locale } from "@/lib/i18n/types";

const HOURS_PER_SESSION = 0.5;

export function hoursFromSessionCount(sessions: number): number {
  if (!Number.isFinite(sessions) || sessions < 0) return 0;
  return sessions * HOURS_PER_SESSION;
}

function formatHourNumber(hours: number): string {
  if (!Number.isFinite(hours)) return "0";
  if (Number.isInteger(hours)) return String(hours);
  return hours.toFixed(1).replace(/\.0$/, "");
}

/** e.g. "2.5 小時" or "2.5 hours" (singular "hour" only when exactly 1). */
export function sessionHoursInnerLabel(locale: Locale, sessions: number): string {
  const h = hoursFromSessionCount(sessions);
  const num = formatHourNumber(h);
  if (locale === "zh-HK") {
    return `${num} 小時`;
  }
  const unit = h === 1 ? "hour" : "hours";
  return `${num} ${unit}`;
}

/** Full-width parens (zh): "（2.5 小時）" */
export function sessionHoursParenZh(sessions: number): string {
  return `（${sessionHoursInnerLabel("zh-HK", sessions)}）`;
}

/** Ascii parens (en): " (2.5 hours)" */
export function sessionHoursParenEn(sessions: number): string {
  return ` (${sessionHoursInnerLabel("en", sessions)})`;
}

export function sessionHoursParen(locale: Locale, sessions: number): string {
  return locale === "zh-HK" ? sessionHoursParenZh(sessions) : sessionHoursParenEn(sessions);
}

/** "5 節（2.5 小時）" / "5 sessions (2.5 hours)" */
export function sessionCountWithHoursPack(locale: Locale, sessions: number): string {
  if (locale === "zh-HK") {
    return `${sessions} 節（${sessionHoursInnerLabel("zh-HK", sessions)}）`;
  }
  const noun = sessions === 1 ? "session" : "sessions";
  return `${sessions} ${noun} (${sessionHoursInnerLabel("en", sessions)})`;
}

export function joinSessionSumExpr(locale: Locale, parts: number[], joiner: string): string {
  return parts.map((n) => sessionCountWithHoursPack(locale, n)).join(joiner);
}
