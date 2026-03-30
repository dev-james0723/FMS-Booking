import { BookingRequestStatus } from "@prisma/client";
import { jsonError, jsonOk, withPrivateNoStore } from "@/lib/api-response";
import { requireUserSession } from "@/lib/auth/require-session";
import { parseBookingVenueQuery, userMayAccessBookingVenue } from "@/lib/booking/venue-kind";
import { apiBilingual } from "@/lib/i18n/api-bilingual";
import { serverLocaleFromCookies } from "@/lib/i18n/server-translate";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const auth = await requireUserSession();
  if (!auth.ok) return withPrivateNoStore(auth.response);

  const url = new URL(req.url);
  const venueKind = parseBookingVenueQuery(url.searchParams.get("venue"));
  const locale = await serverLocaleFromCookies();

  const user = await prisma.user.findUnique({
    where: { id: auth.userId },
    include: { profile: true },
  });
  if (!user?.profile || !userMayAccessBookingVenue(user.profile.bookingVenueKind, venueKind)) {
    return withPrivateNoStore(
      jsonError(
        "FORBIDDEN",
        apiBilingual(locale, "此帳戶不可使用此預約通道", "This account cannot use this booking channel."),
        403
      )
    );
  }

  const rows = await prisma.bookingRequest.findMany({
    where: { userId: auth.userId, venueKind },
    orderBy: { requestedAt: "desc" },
    include: {
      allocations: {
        // Include released rows so cancelled requests still show the slots that were given up.
        where: { status: { in: ["pending", "approved", "released"] } },
        include: { slot: true },
        orderBy: { slot: { startsAt: "asc" } },
      },
      statusLogs: {
        where: {
          OR: [
            { meta: { path: ["action"], equals: "admin_reschedule" } },
            { meta: { path: ["action"], equals: "user_reschedule" } },
          ],
        },
        select: { id: true },
        take: 1,
      },
    },
  });

  return withPrivateNoStore(
    jsonOk({
    venueKind,
    bookings: rows.map((r) => {
      const showReleasedSlots = r.status === BookingRequestStatus.cancelled;
      const allocationsForHistory = showReleasedSlots
        ? r.allocations
        : r.allocations.filter((a) => a.status === "pending" || a.status === "approved");
      return {
        id: r.id,
        status: r.status,
        hasStaffReschedule: r.statusLogs.length > 0,
        hasReschedule: r.statusLogs.length > 0,
        requestedAt: r.requestedAt.toISOString(),
        bookingIdentityType: r.bookingIdentityType,
        usesBonusSlot: r.usesBonusSlot,
        slots: allocationsForHistory.map((a) => ({
          id: a.slot.id,
          startsAt: a.slot.startsAt.toISOString(),
          endsAt: a.slot.endsAt.toISOString(),
          venueLabel: a.slot.venueLabel,
          venueKind: a.slot.venueKind,
          allocationId: a.id,
        })),
      };
    }),
    })
  );
}
