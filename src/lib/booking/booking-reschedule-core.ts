import {
  AuditActorType,
  BookingAllocationStatus,
  BookingRequest,
  BookingRequestStatus,
  Prisma,
} from "@prisma/client";
import { COUNTED_REQUEST_STATUS } from "@/lib/booking/day-counts";
import { maxRollingThreeDaySum } from "@/lib/booking/hk-dates";
import { hkDateKey } from "@/lib/time";
import type { PrismaClient } from "@prisma/client";

type Db = PrismaClient | Prisma.TransactionClient;

export async function countSlotUsageExcludingRequestDb(
  db: Db,
  slotId: string,
  excludeRequestId: string
): Promise<number> {
  return db.bookingAllocation.count({
    where: {
      bookingSlotId: slotId,
      bookingRequestId: { not: excludeRequestId },
      status: { in: [BookingAllocationStatus.pending, BookingAllocationStatus.approved] },
      request: {
        status: {
          in: [
            BookingRequestStatus.pending,
            BookingRequestStatus.approved,
            BookingRequestStatus.waitlisted,
          ],
        },
      },
    },
  });
}

export type BookingRequestWithActiveAllocations = BookingRequest & {
  allocations: Array<{
    bookingSlotId: string;
    status: BookingAllocationStatus;
    slot: {
      id: string;
      startsAt: Date;
      endsAt: Date;
      venueKind: string;
      venueLabel: string | null;
      isOpen: boolean;
      capacityTotal: number;
    };
  }>;
};

/** Throws if merged day counts (other requests + proposed slots for this request) violate caps. */
export async function assertUserQuotaAfterRescheduleTx(
  tx: Prisma.TransactionClient,
  params: {
    userId: string;
    excludeBookingRequestId: string;
    finalSlotIds: string[];
    startKey: string;
    endKey: string;
    dailyMax: number;
    rollingMax: number;
  }
): Promise<void> {
  const otherAllocs = await tx.bookingAllocation.findMany({
    where: {
      status: { in: [BookingAllocationStatus.pending, BookingAllocationStatus.approved] },
      request: {
        userId: params.userId,
        status: { in: COUNTED_REQUEST_STATUS },
        id: { not: params.excludeBookingRequestId },
      },
    },
    include: { slot: true },
  });

  const map = new Map<string, number>();
  for (const a of otherAllocs) {
    const k = hkDateKey(a.slot.startsAt);
    map.set(k, (map.get(k) ?? 0) + 1);
  }

  const finalSlots = await tx.bookingSlot.findMany({
    where: { id: { in: params.finalSlotIds } },
  });
  for (const s of finalSlots) {
    const k = hkDateKey(s.startsAt);
    map.set(k, (map.get(k) ?? 0) + 1);
  }

  for (const [day, n] of map) {
    if (day < params.startKey || day > params.endKey) continue;
    if (n > params.dailyMax) {
      throw new RescheduleCoreError(
        "BOOKING_LIMIT_DAILY",
        `此更改會令你於 ${day} 超出每日節數上限（${params.dailyMax} 節）。`
      );
    }
  }

  if (maxRollingThreeDaySum(map) > params.rollingMax) {
    throw new RescheduleCoreError(
      "BOOKING_LIMIT_ROLLING_3D",
      `此更改會令你超出連續三個曆日之節數上限（${params.rollingMax} 節）。`
    );
  }
}

export class RescheduleCoreError extends Error {
  constructor(
    public code: string,
    message: string
  ) {
    super(message);
    this.name = "RescheduleCoreError";
  }
}

export async function runBookingRescheduleTx(
  tx: Prisma.TransactionClient,
  params: {
    bookingRequestId: string;
    req: BookingRequestWithActiveAllocations;
    removeSlotIds: string[];
    addSlotIds: string[];
    addSlots: Array<{
      id: string;
      startsAt: Date;
      endsAt: Date;
      venueKind: string;
      venueLabel: string | null;
      isOpen: boolean;
      capacityTotal: number;
    }>;
    actorType: AuditActorType;
    actorId: string | null;
    statusLogMetaAction: "admin_reschedule" | "user_reschedule";
    adminUserIdForAudit: string | null;
  }
): Promise<void> {
  const {
    bookingRequestId,
    req,
    removeSlotIds,
    addSlotIds,
    actorType,
    actorId,
    statusLogMetaAction,
    adminUserIdForAudit,
  } = params;

  const newAllocStatus =
    req.status === BookingRequestStatus.approved
      ? BookingAllocationStatus.approved
      : BookingAllocationStatus.pending;

  if (removeSlotIds.length > 0) {
    await tx.bookingAllocation.updateMany({
      where: {
        bookingRequestId,
        bookingSlotId: { in: removeSlotIds },
        status: { in: [BookingAllocationStatus.pending, BookingAllocationStatus.approved] },
      },
      data: { status: BookingAllocationStatus.released },
    });
  }

  for (const sid of addSlotIds) {
    await tx.bookingAllocation.create({
      data: {
        bookingRequestId,
        bookingSlotId: sid,
        status: newAllocStatus,
      },
    });
  }

  await tx.bookingStatusLog.create({
    data: {
      bookingRequestId,
      fromStatus: req.status,
      toStatus: req.status,
      actorType,
      actorId,
      meta: {
        action: statusLogMetaAction,
        removedSlotIds: removeSlotIds,
        addedSlotIds: addSlotIds,
      },
    },
  });

  if (adminUserIdForAudit) {
    await tx.auditLog.create({
      data: {
        adminUserId: adminUserIdForAudit,
        action:
          statusLogMetaAction === "admin_reschedule"
            ? "booking.reschedule_by_admin"
            : "booking.reschedule_by_user",
        entityType: "booking_request",
        entityId: bookingRequestId,
        diff: { removeSlotIds, addSlotIds },
      },
    });
  }
}
