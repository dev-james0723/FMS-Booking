import { jsonError, jsonOk } from "@/lib/api-response";
import { requireUserSession } from "@/lib/auth/require-session";
import { parseBookingVenueQuery, userMayAccessBookingVenue } from "@/lib/booking/venue-kind";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const auth = await requireUserSession();
  if (!auth.ok) return auth.response;

  const url = new URL(req.url);
  const venueKind = parseBookingVenueQuery(url.searchParams.get("venue"));

  const user = await prisma.user.findUnique({
    where: { id: auth.userId },
    include: { profile: true },
  });
  if (!user?.profile || !userMayAccessBookingVenue(user.profile.bookingVenueKind, venueKind)) {
    return jsonError("FORBIDDEN", "此帳戶不可使用此預約通道", 403);
  }

  const rows = await prisma.bookingRequest.findMany({
    where: { userId: auth.userId, venueKind },
    orderBy: { requestedAt: "desc" },
    include: {
      allocations: {
        include: { slot: true },
        orderBy: { slot: { startsAt: "asc" } },
      },
      statusLogs: {
        where: {
          meta: {
            path: ["action"],
            equals: "admin_reschedule",
          },
        },
        select: { id: true },
        take: 1,
      },
    },
  });

  return jsonOk({
    venueKind,
    bookings: rows.map((r) => ({
      id: r.id,
      status: r.status,
      hasStaffReschedule: r.statusLogs.length > 0,
      requestedAt: r.requestedAt.toISOString(),
      bookingIdentityType: r.bookingIdentityType,
      usesBonusSlot: r.usesBonusSlot,
      slots: r.allocations.map((a) => ({
        id: a.slot.id,
        startsAt: a.slot.startsAt.toISOString(),
        endsAt: a.slot.endsAt.toISOString(),
        venueLabel: a.slot.venueLabel,
        venueKind: a.slot.venueKind,
      })),
    })),
  });
}
