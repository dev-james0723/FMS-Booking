import { jsonOk } from "@/lib/api-response";
import { requireAdminSession } from "@/lib/auth/require-admin";
import { prisma } from "@/lib/prisma";
import { BookingRequestStatus } from "@prisma/client";

export async function GET(req: Request) {
  const auth = await requireAdminSession();
  if (!auth.ok) return auth.response;

  const url = new URL(req.url);
  const statusParam = url.searchParams.get("status");
  const userIdParam = url.searchParams.get("userId")?.trim();
  const allowed = new Set<string>(Object.values(BookingRequestStatus));
  const statusFilter =
    statusParam && allowed.has(statusParam)
      ? (statusParam as BookingRequestStatus)
      : undefined;

  const rows = await prisma.bookingRequest.findMany({
    where: {
      ...(statusFilter ? { status: statusFilter } : {}),
      ...(userIdParam ? { userId: userIdParam } : {}),
    },
    orderBy: { requestedAt: "desc" },
    take: 200,
    include: {
      user: { include: { profile: true } },
      allocations: { include: { slot: true }, orderBy: { slot: { startsAt: "asc" } } },
    },
  });

  return jsonOk({
    bookings: rows.map((r) => ({
      id: r.id,
      status: r.status,
      requestedAt: r.requestedAt.toISOString(),
      userCategoryAtRequest: r.userCategoryAtRequest,
      usesBonusSlot: r.usesBonusSlot,
      adminNote: r.adminNote,
      user: {
        id: r.user.id,
        email: r.user.email,
        nameZh: r.user.profile?.nameZh ?? null,
      },
      slots: r.allocations.map((a) => ({
        id: a.slot.id,
        startsAt: a.slot.startsAt.toISOString(),
        endsAt: a.slot.endsAt.toISOString(),
        venueLabel: a.slot.venueLabel,
        allocationStatus: a.status,
      })),
    })),
  });
}
