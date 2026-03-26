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
