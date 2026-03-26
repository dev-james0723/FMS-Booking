import { jsonOk } from "@/lib/api-response";
import { requireUserSession } from "@/lib/auth/require-session";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const auth = await requireUserSession();
  if (!auth.ok) return auth.response;

  const rows = await prisma.bookingRequest.findMany({
    where: { userId: auth.userId },
    orderBy: { requestedAt: "desc" },
    include: {
      allocations: {
        include: { slot: true },
        orderBy: { slot: { startsAt: "asc" } },
      },
    },
  });

  return jsonOk({
    bookings: rows.map((r) => ({
      id: r.id,
      status: r.status,
      requestedAt: r.requestedAt.toISOString(),
      usesBonusSlot: r.usesBonusSlot,
      slots: r.allocations.map((a) => ({
        id: a.slot.id,
        startsAt: a.slot.startsAt.toISOString(),
        endsAt: a.slot.endsAt.toISOString(),
        venueLabel: a.slot.venueLabel,
      })),
    })),
  });
}
