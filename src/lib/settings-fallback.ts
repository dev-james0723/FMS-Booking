/**
 * Used when PostgreSQL is unreachable (e.g. local preview without Docker).
 * Keep in sync with `prisma/seed.ts` defaults.
 */
export const FALLBACK_SYSTEM_SETTINGS_ROWS: { key: string; value: unknown }[] = [
  { key: "site_registration_opens_at", value: "2026-03-11T00:00:00+08:00" },
  { key: "booking_opens_at", value: "2026-04-03T11:00:00+08:00" },
  { key: "booking_reminder_scheduled_at", value: "2026-04-02T11:00:00+08:00" },
  { key: "campaign_starts_at", value: "2026-04-03T00:00:00+08:00" },
  { key: "campaign_ends_at", value: "2026-05-03T23:59:59+08:00" },
  {
    key: "dfestival_dmasters_privilege_deadline_at",
    value: "2026-05-03T23:59:59+08:00",
  },
  { key: "post_experience_coupon_valid_from", value: "2026-05-04T00:00:00+08:00" },
  {
    key: "post_experience_coupon_valid_until",
    value: "2026-06-30T23:59:59+08:00",
  },
  { key: "slot_duration_minutes", value: 30 },
  { key: "personal_max_slots_per_day", value: 5 },
  { key: "personal_max_slots_any_3_consecutive_days", value: 7 },
  { key: "teaching_max_slots_per_day", value: 8 },
  { key: "teaching_max_slots_any_3_consecutive_days", value: 16 },
  { key: "max_advance_booking_days", value: 2 },
  { key: "no_show_grace_minutes", value: 15 },
  { key: "ambassador_bonus_slot_cap_per_user", value: 25 },
];

export const FALLBACK_SYSTEM_SETTINGS: Record<string, unknown> = Object.fromEntries(
  FALLBACK_SYSTEM_SETTINGS_ROWS.map((r) => [r.key, r.value])
);

export function shouldUseSettingsFallbackOnDbError(): boolean {
  return (
    process.env.NODE_ENV === "development" ||
    process.env.ALLOW_SETTINGS_FALLBACK === "1" ||
    process.env.ALLOW_SETTINGS_FALLBACK === "true"
  );
}

/** True when Prisma cannot open a connection (wrong host, DB down, firewall, etc.). */
export function isUnreachableDbError(e: unknown): boolean {
  if (!e || typeof e !== "object") return false;
  const err = e as { code?: string; name?: string; message?: string };
  if (err.name === "PrismaClientInitializationError") return true;
  // P1000 auth, P1001 unreachable, P1002 connect timeout, P1011 TLS, P1017 server closed connection
  if (/^P100[012]$/.test(String(err.code ?? ""))) return true;
  if (err.code === "P1011" || err.code === "P1017") return true;
  const msg = typeof err.message === "string" ? err.message : "";
  if (/Can't reach database server/i.test(msg)) return true;
  if (/ECONNREFUSED|ETIMEDOUT|ECONNRESET|EPIPE|socket hang up/i.test(msg)) return true;
  return false;
}
