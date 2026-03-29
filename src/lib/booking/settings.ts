import {
  parseBookingNumericSettings,
  type BookingNumericSettings,
} from "@/lib/booking/booking-numeric-settings";
import { parseInstantSetting } from "@/lib/settings";
import { hkDateKey } from "@/lib/time";

export type { BookingNumericSettings };
export { parseBookingNumericSettings };

export function parseCampaignDateKeys(raw: Record<string, unknown>): {
  startKey: string | null;
  endKey: string | null;
} {
  const start = parseInstantSetting(raw["campaign_starts_at"]);
  const end = parseInstantSetting(raw["campaign_ends_at"]);
  if (!start || !end) return { startKey: null, endKey: null };
  return {
    startKey: hkDateKey(start),
    endKey: hkDateKey(end),
  };
}
