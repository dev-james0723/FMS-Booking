import { prisma } from "@/lib/prisma";
import {
  FALLBACK_SYSTEM_SETTINGS,
  isUnreachableDbError,
  shouldUseSettingsFallbackOnDbError,
} from "@/lib/settings-fallback";

/** Keys exposed to the public frontend (no secrets). */
export const PUBLIC_SETTING_KEYS = [
  "site_registration_opens_at",
  "booking_opens_at",
  "booking_reminder_scheduled_at",
  "campaign_starts_at",
  "campaign_ends_at",
  "dfestival_dmasters_privilege_deadline_at",
  "post_experience_coupon_valid_from",
  "post_experience_coupon_valid_until",
  "slot_duration_minutes",
  "personal_max_slots_per_day",
  "personal_max_slots_any_3_consecutive_days",
  "teaching_max_slots_per_day",
  "teaching_max_slots_any_3_consecutive_days",
  "max_advance_booking_days",
] as const;

export type PublicSettingKey = (typeof PUBLIC_SETTING_KEYS)[number];

export async function getAllSettings(): Promise<Record<string, unknown>> {
  if (!process.env.DATABASE_URL?.trim()) {
    console.warn(
      "[settings] DATABASE_URL is not set; using built-in fallbacks. Configure DATABASE_URL for live system settings."
    );
    return { ...FALLBACK_SYSTEM_SETTINGS };
  }

  try {
    const rows = await prisma.systemSetting.findMany();
    const out: Record<string, unknown> = {};
    for (const r of rows) {
      out[r.key] = r.valueJson as unknown;
    }
    return out;
  } catch (e) {
    const strict = process.env.STRICT_SETTINGS_DB === "1";
    const useFallback =
      !strict &&
      (shouldUseSettingsFallbackOnDbError() || isUnreachableDbError(e));
    if (!useFallback) throw e;
    console.error(
      "[settings] Database unreachable; using built-in fallbacks. Fix DATABASE_URL for live settings. Set STRICT_SETTINGS_DB=1 to fail the request instead of fallbacks.",
      e instanceof Error ? e.message : e
    );
    return { ...FALLBACK_SYSTEM_SETTINGS };
  }
}

export async function getPublicSettings(): Promise<Record<string, unknown>> {
  const all = await getAllSettings();
  const out: Record<string, unknown> = {};
  for (const k of PUBLIC_SETTING_KEYS) {
    if (k in all) out[k] = all[k];
  }
  return out;
}

export function parseInstantSetting(value: unknown): Date | null {
  if (value == null) return null;
  if (typeof value !== "string") return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Use when you already loaded settings (avoids a second DB round-trip). */
export function getEffectiveNowFromSettings(all: Record<string, unknown>): Date {
  const raw = all["staging_simulated_now"];
  if (typeof raw === "string" && raw.length > 0) {
    const d = new Date(raw);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return new Date();
}

export async function getEffectiveNow(): Promise<Date> {
  const all = await getAllSettings();
  return getEffectiveNowFromSettings(all);
}
