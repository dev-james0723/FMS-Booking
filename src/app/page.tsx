import { HomePageMain } from "@/components/home-page-main";
import { parseBookingOpensAt } from "@/lib/booking/booking-opens-at";
import {
  getAllSettings,
  getEffectiveNowFromSettings,
  PUBLIC_SETTING_KEYS,
} from "@/lib/settings";
import { formatInstantForBookingOpensZhHk } from "@/lib/time";
import { getVenueCalendarEnv } from "@/lib/venue-calendar";

export default async function HomePage() {
  const all = await getAllSettings();
  const settings: Record<string, unknown> = {};
  for (const k of PUBLIC_SETTING_KEYS) {
    if (k in all) settings[k] = all[k];
  }
  const bookingOpensRaw = settings["booking_opens_at"];
  const bookingOpensDate = parseBookingOpensAt(bookingOpensRaw);
  /** UTC ISO so the countdown matches SSR and all browsers (see parseInstantSetting). */
  const bookingOpensAt = bookingOpensDate?.toISOString() ?? null;
  const now = getEffectiveNowFromSettings(all);
  const bookingLive = bookingOpensDate ? now.getTime() >= bookingOpensDate.getTime() : false;
  const bookingOpensAtLabel =
    bookingOpensDate != null
      ? formatInstantForBookingOpensZhHk(bookingOpensDate)
      : null;
  const venueAddressZh = getVenueCalendarEnv().address;

  return (
    <HomePageMain
      bookingOpensAtIso={bookingOpensAt}
      bookingOpensAtLabel={bookingOpensAtLabel}
      bookingLive={bookingLive}
      initialNowMs={now.getTime()}
      venueAddressZh={venueAddressZh}
    />
  );
}
