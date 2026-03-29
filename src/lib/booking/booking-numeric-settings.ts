export type BookingNumericSettings = {
  personalMaxPerDay: number;
  personalMaxRolling3d: number;
  teachingMaxPerDay: number;
  teachingMaxRolling3d: number;
  maxAdvanceDays: number;
};

/** Same caps as server booking rules; safe for client bundles (no DB). */
export function quotaLimitsForTier(
  quotaTier: "individual" | "teaching",
  nums: BookingNumericSettings
): { dailyMax: number; rollingMax: number } {
  if (quotaTier === "teaching") {
    return {
      dailyMax: nums.teachingMaxPerDay,
      rollingMax: nums.teachingMaxRolling3d,
    };
  }
  return {
    dailyMax: nums.personalMaxPerDay,
    rollingMax: nums.personalMaxRolling3d,
  };
}

export function parseBookingNumericSettings(
  raw: Record<string, unknown>
): BookingNumericSettings {
  const num = (k: string, fallback: number) => {
    const v = raw[k];
    return typeof v === "number" && Number.isFinite(v) ? v : fallback;
  };
  return {
    personalMaxPerDay: num("personal_max_slots_per_day", 5),
    personalMaxRolling3d: num("personal_max_slots_any_3_consecutive_days", 7),
    teachingMaxPerDay: num("teaching_max_slots_per_day", 8),
    teachingMaxRolling3d: num("teaching_max_slots_any_3_consecutive_days", 16),
    maxAdvanceDays: num("max_advance_booking_days", 2),
  };
}
