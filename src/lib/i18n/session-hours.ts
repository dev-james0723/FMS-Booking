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

/** e.g. "2 小時 30 分鐘" (zh-HK) or "2.5 hours" (en; singular "hour" only when exactly 1). */
export function sessionHoursInnerLabel(locale: Locale, sessions: number): string {
  if (locale === "zh-HK") {
    const totalMin = Math.round(sessions * HOURS_PER_SESSION * 60);
    const wholeH = Math.floor(totalMin / 60);
    const m = totalMin % 60;
    if (totalMin === 0) return "0 分鐘";
    if (m === 0) return `${wholeH} 小時`;
    if (wholeH === 0) return `${m} 分鐘`;
    return `${wholeH} 小時 ${m} 分鐘`;
  }
  const h = hoursFromSessionCount(sessions);
  const num = formatHourNumber(h);
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
