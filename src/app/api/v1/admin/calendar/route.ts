import { jsonError, jsonOk } from "@/lib/api-response";
import { requireAdminSession } from "@/lib/auth/require-admin";
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
      "Query from and to required as yyyy-MM-dd",
      400
    );
  }

  const start = hkDayStartUtc(from);
  const end = hkDayEndUtc(to);
  if (end < start) {
    return jsonError("VALIDATION_ERROR", "to must be on or after from", 400);
  }

  const slots = await prisma.bookingSlot.findMany({
    where: { startsAt: { gte: start, lte: end } },
    orderBy: { startsAt: "asc" },
    include: {
      allocations: {
        where: {
          status: { in: ["pending", "approved"] },
          request: {
            status: { in: ["pending", "approved", "waitlisted"] },
          },
        },
        include: {
          request: {
            include: { user: { select: { id: true, email: true } } },
          },
        },
      },
    },
  });

  return jsonOk({
    slots: slots.map((s) => ({
      id: s.id,
      startsAt: s.startsAt.toISOString(),
      endsAt: s.endsAt.toISOString(),
      capacityTotal: s.capacityTotal,
      isOpen: s.isOpen,
      venueLabel: s.venueLabel,
      used: s.allocations.length,
      remaining: Math.max(0, s.capacityTotal - s.allocations.length),
      bookings: s.allocations.map((a) => ({
        requestId: a.bookingRequestId,
        requestStatus: a.request.status,
        userEmail: a.request.user.email,
      })),
    })),
  });
}
