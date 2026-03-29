import { jsonError, jsonOk } from "@/lib/api-response";
import { requireUserSession } from "@/lib/auth/require-session";
import { isBookingPortalLiveFromSettings } from "@/lib/booking/booking-portal-live";
import { hkDayEndUtc, hkDayStartUtc } from "@/lib/booking/hk-dates";
import { listSlotsForCalendarView } from "@/lib/booking/service";
import { parseBookingVenueQuery, userMayAccessBookingVenue } from "@/lib/booking/venue-kind";
import { getAllSettings, getEffectiveNow } from "@/lib/settings";
import { prisma } from "@/lib/prisma";

const ymd = /^\d{4}-\d{2}-\d{2}$/;

export async function GET(req: Request) {
  const auth = await requireUserSession();
  if (!auth.ok) return auth.response;

  const url = new URL(req.url);
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  if (!from || !to || !ymd.test(from) || !ymd.test(to)) {
    return jsonError(
      "VALIDATION_ERROR",
      "Query from and to required as yyyy-MM-dd (Hong Kong calendar day)",
      400
    );
  }

  const venueKind = parseBookingVenueQuery(url.searchParams.get("venue"));

  const user = await prisma.user.findUnique({
    where: { id: auth.userId },
    include: { profile: true },
  });
  if (!user?.hasCompletedRegistration || user.accountStatus !== "active") {
    return jsonError("FORBIDDEN", "無法查閱時段", 403);
  }
  if (!user.profile || !userMayAccessBookingVenue(user.profile.bookingVenueKind, venueKind)) {
    return jsonError("FORBIDDEN", "此帳戶不可使用此預約通道", 403);
  }

  const start = hkDayStartUtc(from);
  const end = hkDayEndUtc(to);
  if (end < start) {
    return jsonError("VALIDATION_ERROR", "to must be on or after from", 400);
  }

  const settings = await getAllSettings();
  const now = await getEffectiveNow();
  const bookingLive = isBookingPortalLiveFromSettings(settings, now);

  /** Real occupancy for overview even when new submissions are closed (`booking_live` false). */
  const rows = await listSlotsForCalendarView({ from: start, to: end, venueKind });

  return jsonOk({
    booking_live: bookingLive,
    venueKind,
    slots: rows.map((s) => ({
      id: s.id,
      startsAt: s.startsAt.toISOString(),
      endsAt: s.endsAt.toISOString(),
      capacityTotal: s.capacityTotal,
      bookedCount: s.bookedCount,
      remaining: s.remaining,
      venueLabel: s.venueLabel,
      venueKind: s.venueKind,
      isOpen: s.isOpen,
    })),
  });
}
