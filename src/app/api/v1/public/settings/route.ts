import { parseBookingOpensAt } from "@/lib/booking/booking-opens-at";
import {
  getAllSettings,
  getEffectiveNowFromSettings,
  instantSettingToUtcIso,
  PUBLIC_INSTANT_SETTING_KEYS,
  PUBLIC_SETTING_KEYS,
  shouldExposeBookingEffectiveNowIso,
} from "@/lib/settings";
import { jsonOk } from "@/lib/api-response";

export async function GET() {
  const all = await getAllSettings();
  const out: Record<string, unknown> = {};
  for (const k of PUBLIC_SETTING_KEYS) {
    if (k in all) out[k] = all[k];
  }
  for (const key of PUBLIC_INSTANT_SETTING_KEYS) {
    const raw = out[key];
    if (typeof raw !== "string") continue;
    const iso =
      key === "booking_opens_at"
        ? parseBookingOpensAt(raw)?.toISOString() ?? null
        : instantSettingToUtcIso(raw);
    if (iso) out[key] = iso;
  }
  const payload: Record<string, unknown> = { settings: out };
  if (shouldExposeBookingEffectiveNowIso(all)) {
    payload.booking_effective_now_iso = getEffectiveNowFromSettings(all).toISOString();
  }
  return jsonOk(payload);
}
