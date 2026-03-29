import { jsonError, jsonOk } from "@/lib/api-response";
import { requireAdminSession } from "@/lib/auth/require-admin";
import {
  effectiveCapacityTotalForSlot,
  loadSlotUsageCountsDbExcludingRequest,
} from "@/lib/booking/booking-rules";
import { parseBookingVenueQuery } from "@/lib/booking/venue-kind";
import { hkDayEndUtc, hkDayStartUtc } from "@/lib/booking/hk-dates";
import { prisma } from "@/lib/prisma";

const ymd = /^\d{4}-\d{2}-\d{2}$/;

export async function GET(req: Request) {
  const auth = await requireAdminSession();
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
  const excludeRequestId = url.searchParams.get("excludeRequestId")?.trim() || null;

  const start = hkDayStartUtc(from);
  const end = hkDayEndUtc(to);
  if (end < start) {
    return jsonError("VALIDATION_ERROR", "to must be on or after from", 400);
  }

  const slots = await prisma.bookingSlot.findMany({
    where: {
      venueKind,
      startsAt: { gte: start, lte: end },
    },
    orderBy: { startsAt: "asc" },
  });

  const ids = slots.map((s) => s.id);
  const usage = await loadSlotUsageCountsDbExcludingRequest(
    prisma,
    ids,
    excludeRequestId
  );

  return jsonOk({
    venueKind,
    excludeRequestId,
    slots: slots.map((s) => {
      const booked = usage.get(s.id) ?? 0;
      const cap = effectiveCapacityTotalForSlot(s);
      const remaining = Math.max(0, cap - booked);
      return {
        id: s.id,
        startsAt: s.startsAt.toISOString(),
        endsAt: s.endsAt.toISOString(),
        capacityTotal: cap,
        bookedCount: booked,
        remaining,
        venueLabel: s.venueLabel,
        venueKind: s.venueKind,
        isOpen: s.isOpen,
      };
    }),
  });
}
