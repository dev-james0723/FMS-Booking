import { parseInstantSetting } from "@/lib/settings";
import { hkDateKey } from "@/lib/time";

export type BookingNumericSettings = {
  personalMaxPerDay: number;
  personalMaxRolling3d: number;
  teachingMaxPerDay: number;
  teachingMaxRolling3d: number;
  maxAdvanceDays: number;
};

export function parseBookingNumericSettings(
  raw: Record<string, unknown>
): BookingNumericSettings {
  const num = (k: string, fallback: number) => {
    const v = raw[k];
    return typeof v === "number" && Number.isFinite(v) ? v : fallback;
  };
  return {
    personalMaxPerDay: num("personal_max_slots_per_day", 3),
    personalMaxRolling3d: num("personal_max_slots_any_3_consecutive_days", 8),
    teachingMaxPerDay: num("teaching_max_slots_per_day", 8),
    teachingMaxRolling3d: num("teaching_max_slots_any_3_consecutive_days", 16),
    maxAdvanceDays: num("max_advance_booking_days", 3),
  };
}

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
