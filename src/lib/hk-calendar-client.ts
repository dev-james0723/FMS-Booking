import { HK_TZ } from "@/lib/time";

export function slotStartsAtToHkDateKey(iso: string): string {
  return new Date(iso).toLocaleDateString("en-CA", { timeZone: HK_TZ });
}

export function isoInstantToHkDateKey(iso: string): string {
  return new Date(iso).toLocaleDateString("en-CA", { timeZone: HK_TZ });
}

export function daysInCalendarMonth(year: number, month1: number): number {
  return new Date(year, month1, 0).getDate();
}

/** 0 = Sunday for this Hong Kong calendar wall date (HKT has no DST). */
export function hkCalendarDayOfWeekSun0(dateKey: string): number {
  const [y, m, d] = dateKey.split("-").map(Number);
  const utcMs = Date.UTC(y, m - 1, d, 4, 0, 0);
  return new Date(utcMs).getUTCDay();
}

export function buildMonthGrid(year: number, month1: number): { dateKey: string | null }[] {
  const dim = daysInCalendarMonth(year, month1);
  const padM = String(month1).padStart(2, "0");
  const firstKey = `${year}-${padM}-01`;
  const lead = hkCalendarDayOfWeekSun0(firstKey);
  const cells: { dateKey: string | null }[] = [];
  for (let i = 0; i < lead; i++) cells.push({ dateKey: null });
  for (let day = 1; day <= dim; day++) {
    cells.push({
      dateKey: `${year}-${padM}-${String(day).padStart(2, "0")}`,
    });
  }
  while (cells.length % 7 !== 0) cells.push({ dateKey: null });
  return cells;
}

export function addDaysToDateKey(fromKey: string, days: number): string {
  const [y, m, d] = fromKey.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(dt.getUTCDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

export function dateKeysDaysApart(fromKey: string, toKey: string): number {
  const [fy, fm, fd] = fromKey.split("-").map(Number);
  const [ty, tm, td] = toKey.split("-").map(Number);
  const a = Date.UTC(fy, fm - 1, fd);
  const b = Date.UTC(ty, tm - 1, td);
  return Math.round((b - a) / 86400000);
}

export function parseCampaignDateKeysFromSettings(
  settings: Record<string, unknown> | null
): { start: string | null; end: string | null } {
  if (!settings) return { start: null, end: null };
  const s = settings.campaign_starts_at;
  const e = settings.campaign_ends_at;
  if (typeof s !== "string" || typeof e !== "string") return { start: null, end: null };
  return {
    start: isoInstantToHkDateKey(s),
    end: isoInstantToHkDateKey(e),
  };
}

export function isHkDayBookable(params: {
  dateKey: string;
  todayKey: string;
  campaignStart: string;
  campaignEnd: string;
  maxAdvanceDays: number;
}): boolean {
  const { dateKey, todayKey, campaignStart, campaignEnd, maxAdvanceDays } = params;
  if (dateKey < campaignStart || dateKey > campaignEnd) return false;
  if (dateKey < todayKey) return false;
  return dateKeysDaysApart(todayKey, dateKey) <= maxAdvanceDays;
}
