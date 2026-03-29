import { parseBookingOpensAt } from "@/lib/booking/booking-opens-at";

/** `system_settings.booking_test_mode` — bypasses `booking_opens_at` for staging QA. */
export function parseBookingTestMode(raw: unknown): boolean {
  return raw === true || raw === "true" || raw === 1;
}

export function isBookingPortalLiveFromSettings(
  settings: Record<string, unknown>,
  now: Date
): boolean {
  if (parseBookingTestMode(settings["booking_test_mode"])) return true;
  const bookingOpens = parseBookingOpensAt(settings["booking_opens_at"]);
  if (!bookingOpens) return false;
  return now.getTime() >= bookingOpens.getTime();
}
