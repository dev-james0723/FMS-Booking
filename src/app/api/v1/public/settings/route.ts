import { parseBookingOpensAt } from "@/lib/booking/booking-opens-at";
import {
  getPublicSettings,
  instantSettingToUtcIso,
  PUBLIC_INSTANT_SETTING_KEYS,
} from "@/lib/settings";
import { jsonOk } from "@/lib/api-response";

export async function GET() {
  const settings = await getPublicSettings();
  const out: Record<string, unknown> = { ...settings };
  for (const key of PUBLIC_INSTANT_SETTING_KEYS) {
    const raw = out[key];
    if (typeof raw !== "string") continue;
    const iso =
      key === "booking_opens_at"
        ? parseBookingOpensAt(raw)?.toISOString() ?? null
        : instantSettingToUtcIso(raw);
    if (iso) out[key] = iso;
  }
  return jsonOk({ settings: out });
}
