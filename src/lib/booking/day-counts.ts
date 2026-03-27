import { BookingRequestStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { hkDateKey } from "@/lib/time";

export const COUNTED_REQUEST_STATUS: BookingRequestStatus[] = [
  BookingRequestStatus.pending,
  BookingRequestStatus.approved,
  BookingRequestStatus.waitlisted,
];

export async function loadUserExistingDayCounts(
  userId: string
): Promise<Map<string, number>> {
  const allocs = await prisma.bookingAllocation.findMany({
    where: {
      status: { in: ["pending", "approved"] },
      request: {
        userId,
        status: { in: COUNTED_REQUEST_STATUS },
      },
    },
    include: { slot: true },
  });
  const map = new Map<string, number>();
  for (const a of allocs) {
    const key = hkDateKey(a.slot.startsAt);
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return map;
}

/** One query for admin lists — per-user HK day → slot count for quota-relevant bookings. */
export async function loadExistingDayCountsBulk(
  userIds: string[]
): Promise<Map<string, Map<string, number>>> {
  if (userIds.length === 0) return new Map();
  const allocs = await prisma.bookingAllocation.findMany({
    where: {
      status: { in: ["pending", "approved"] },
      request: {
        userId: { in: userIds },
        status: { in: COUNTED_REQUEST_STATUS },
      },
    },
    include: { slot: true, request: { select: { userId: true } } },
  });
  const out = new Map<string, Map<string, number>>();
  for (const a of allocs) {
    const uid = a.request.userId;
    const key = hkDateKey(a.slot.startsAt);
    if (!out.has(uid)) out.set(uid, new Map());
    const inner = out.get(uid)!;
    inner.set(key, (inner.get(key) ?? 0) + 1);
  }
  return out;
}
