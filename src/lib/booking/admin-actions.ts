import {
  AuditActorType,
  BookingAllocationStatus,
  BookingRequestStatus,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";

export class AdminBookingError extends Error {
  constructor(
    public code: string,
    message: string
  ) {
    super(message);
    this.name = "AdminBookingError";
  }
}

async function countSlotUsageExcludingRequest(
  slotId: string,
  excludeRequestId: string
): Promise<number> {
  return prisma.bookingAllocation.count({
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

export async function adminApproveBookingRequest(
  bookingRequestId: string,
  adminUserId: string
): Promise<void> {
  const req = await prisma.bookingRequest.findUnique({
    where: { id: bookingRequestId },
    include: { allocations: { include: { slot: true } } },
  });
  if (!req) {
    throw new AdminBookingError("NOT_FOUND", "預約不存在");
  }
  if (
    req.status !== BookingRequestStatus.pending &&
    req.status !== BookingRequestStatus.waitlisted
  ) {
    throw new AdminBookingError("INVALID_STATUS", "只可批核待審核或後補狀態的預約");
  }

  for (const a of req.allocations) {
    const others = await countSlotUsageExcludingRequest(a.bookingSlotId, bookingRequestId);
    if (others + 1 > a.slot.capacityTotal) {
      throw new AdminBookingError(
        "SLOT_FULL",
        `時段已滿，無法批核（slot ${a.bookingSlotId.slice(0, 8)}…）`
      );
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.bookingRequest.update({
      where: { id: bookingRequestId },
      data: { status: BookingRequestStatus.approved },
    });
    await tx.bookingAllocation.updateMany({
      where: { bookingRequestId },
      data: { status: BookingAllocationStatus.approved },
    });
    await tx.bookingStatusLog.create({
      data: {
        bookingRequestId,
        fromStatus: req.status,
        toStatus: BookingRequestStatus.approved,
        actorType: AuditActorType.admin,
        actorId: adminUserId,
      },
    });
    await tx.auditLog.create({
      data: {
        adminUserId,
        action: "booking.approve",
        entityType: "booking_request",
        entityId: bookingRequestId,
        diff: { status: BookingRequestStatus.approved },
      },
    });
  });
}

export async function adminRejectBookingRequest(
  bookingRequestId: string,
  adminUserId: string,
  note?: string | null
): Promise<void> {
  const req = await prisma.bookingRequest.findUnique({
    where: { id: bookingRequestId },
  });
  if (!req) {
    throw new AdminBookingError("NOT_FOUND", "預約不存在");
  }
  if (
    req.status !== BookingRequestStatus.pending &&
    req.status !== BookingRequestStatus.waitlisted
  ) {
    throw new AdminBookingError("INVALID_STATUS", "只可拒絕待審核或後補狀態的預約");
  }

  await prisma.$transaction(async (tx) => {
    await tx.bookingRequest.update({
      where: { id: bookingRequestId },
      data: {
        status: BookingRequestStatus.rejected,
        adminNote: note?.trim() || req.adminNote,
      },
    });
    await tx.bookingAllocation.updateMany({
      where: { bookingRequestId },
      data: { status: BookingAllocationStatus.released },
    });
    if (req.usesBonusSlot && req.bonusRewardId) {
      await tx.bonusReward.update({
        where: { id: req.bonusRewardId },
        data: { slotsRemaining: { increment: 1 } },
      });
    }
    await tx.bookingStatusLog.create({
      data: {
        bookingRequestId,
        fromStatus: req.status,
        toStatus: BookingRequestStatus.rejected,
        actorType: AuditActorType.admin,
        actorId: adminUserId,
      },
    });
    await tx.auditLog.create({
      data: {
        adminUserId,
        action: "booking.reject",
        entityType: "booking_request",
        entityId: bookingRequestId,
        diff: { status: BookingRequestStatus.rejected },
      },
    });
  });
}

export async function adminWaitlistBookingRequest(
  bookingRequestId: string,
  adminUserId: string
): Promise<void> {
  const req = await prisma.bookingRequest.findUnique({
    where: { id: bookingRequestId },
  });
  if (!req) {
    throw new AdminBookingError("NOT_FOUND", "預約不存在");
  }
  if (req.status !== BookingRequestStatus.pending) {
    throw new AdminBookingError("INVALID_STATUS", "只可將「待審核」預約設為後補");
  }

  await prisma.$transaction(async (tx) => {
    await tx.bookingRequest.update({
      where: { id: bookingRequestId },
      data: { status: BookingRequestStatus.waitlisted },
    });
    await tx.bookingStatusLog.create({
      data: {
        bookingRequestId,
        fromStatus: req.status,
        toStatus: BookingRequestStatus.waitlisted,
        actorType: AuditActorType.admin,
        actorId: adminUserId,
      },
    });
    await tx.auditLog.create({
      data: {
        adminUserId,
        action: "booking.waitlist",
        entityType: "booking_request",
        entityId: bookingRequestId,
        diff: { status: BookingRequestStatus.waitlisted },
      },
    });
  });
}
