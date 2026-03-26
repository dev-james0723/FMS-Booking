import { fromZonedTime } from "date-fns-tz";
import { CAMPAIGN_EXPERIENCE_FIRST_DAY_KEY } from "@/lib/booking/campaign-constants";
import { parseInstantSetting } from "@/lib/settings";
import { hkDateKey, HK_TZ } from "@/lib/time";

/**
 * Some deployments stored `booking_opens_at` on 2026-03-31 11:00 HKT by mistake.
 * Portal open is aligned with the first experience day at 11:00 Hong Kong.
 */
const STALE_BOOKING_OPENS_HK_DATE_KEYS = new Set(["2026-03-31"]);

export function parseBookingOpensAt(raw: unknown): Date | null {
  const d = parseInstantSetting(raw);
  if (!d) return null;
  if (STALE_BOOKING_OPENS_HK_DATE_KEYS.has(hkDateKey(d))) {
    return fromZonedTime(`${CAMPAIGN_EXPERIENCE_FIRST_DAY_KEY}T11:00:00`, HK_TZ);
  }
  return d;
}
