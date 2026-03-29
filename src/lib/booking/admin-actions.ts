import {
  AuditActorType,
  BookingAllocationStatus,
  BookingRequestStatus,
  Prisma,
} from "@prisma/client";
import { parseCampaignDateKeys } from "@/lib/booking/settings";
import { getAllSettings } from "@/lib/settings";
import { hkDateKey } from "@/lib/time";
import { effectiveCapacityTotalForSlot } from "@/lib/booking/booking-rules";
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
    const cap = effectiveCapacityTotalForSlot(a.slot);
    if (others + 1 > cap) {
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

const ADMIN_MANAGEABLE_REQUEST_STATUS: BookingRequestStatus[] = [
  BookingRequestStatus.approved,
  BookingRequestStatus.pending,
  BookingRequestStatus.waitlisted,
];

export async function adminCancelBookingRequest(
  bookingRequestId: string,
  adminUserId: string
): Promise<void> {
  const req = await prisma.bookingRequest.findUnique({
    where: { id: bookingRequestId },
  });
  if (!req) {
    throw new AdminBookingError("NOT_FOUND", "預約不存在");
  }
  if (!ADMIN_MANAGEABLE_REQUEST_STATUS.includes(req.status)) {
    throw new AdminBookingError("INVALID_STATUS", "此預約狀態無法取消");
  }

  await prisma.$transaction(async (tx) => {
    await tx.bookingRequest.update({
      where: { id: bookingRequestId },
      data: { status: BookingRequestStatus.cancelled },
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
        toStatus: BookingRequestStatus.cancelled,
        actorType: AuditActorType.admin,
        actorId: adminUserId,
        meta: { action: "admin_cancel" },
      },
    });
    await tx.auditLog.create({
      data: {
        adminUserId,
        action: "booking.cancel_by_admin",
        entityType: "booking_request",
        entityId: bookingRequestId,
        diff: { status: BookingRequestStatus.cancelled },
      },
    });
  });
}

export async function adminRescheduleBookingRequest(
  bookingRequestId: string,
  adminUserId: string,
  params: { removeSlotIds: string[]; addSlotIds: string[] }
): Promise<void> {
  const removeSlotIds = [...new Set(params.removeSlotIds)];
  const addSlotIds = [...new Set(params.addSlotIds)];

  if (removeSlotIds.length === 0 && addSlotIds.length === 0) {
    throw new AdminBookingError("NO_CHANGE", "請選擇要釋放的時段和／或要新增的替換時段");
  }

  const req = await prisma.bookingRequest.findUnique({
    where: { id: bookingRequestId },
    include: {
      allocations: {
        where: {
          status: {
            in: [BookingAllocationStatus.pending, BookingAllocationStatus.approved],
          },
        },
        include: { slot: true },
      },
    },
  });

  if (!req) {
    throw new AdminBookingError("NOT_FOUND", "預約不存在");
  }
  if (!ADMIN_MANAGEABLE_REQUEST_STATUS.includes(req.status)) {
    throw new AdminBookingError("INVALID_STATUS", "此預約狀態無法更改時段");
  }

  const currentSlotIds = new Set(req.allocations.map((a) => a.bookingSlotId));
  for (const id of removeSlotIds) {
    if (!currentSlotIds.has(id)) {
      throw new AdminBookingError(
        "INVALID_REMOVE",
        `所選釋放時段不屬於此預約（slot ${id.slice(0, 8)}…）`
      );
    }
  }

  const keptSlotIds = [...currentSlotIds].filter((id) => !removeSlotIds.includes(id));
  const keptSet = new Set(keptSlotIds);
  for (const id of addSlotIds) {
    if (keptSet.has(id)) {
      throw new AdminBookingError(
        "DUPLICATE_SLOT",
        `新時段與保留時段重複（slot ${id.slice(0, 8)}…）`
      );
    }
  }

  const finalSlotIds = [...new Set([...keptSlotIds, ...addSlotIds])];
  if (finalSlotIds.length === 0) {
    throw new AdminBookingError("EMPTY_RESULT", "更改後須至少保留一個時段");
  }

  const settings = await getAllSettings();
  const { startKey, endKey } = parseCampaignDateKeys(settings);
  if (!startKey || !endKey) {
    throw new AdminBookingError("SETTINGS", "活動日期未設定，無法更改時段");
  }

  const addSlots =
    addSlotIds.length === 0
      ? []
      : await prisma.bookingSlot.findMany({ where: { id: { in: addSlotIds } } });

  if (addSlots.length !== addSlotIds.length) {
    throw new AdminBookingError("SLOT_NOT_FOUND", "部分替換時段不存在");
  }

  for (const s of addSlots) {
    if (s.venueKind !== req.venueKind) {
      throw new AdminBookingError("VENUE_MISMATCH", "替換時段必須與原預約屬同一場地系統");
    }
    if (!s.isOpen) {
      throw new AdminBookingError("SLOT_CLOSED", `時段已關閉（slot ${s.id.slice(0, 8)}…）`);
    }
    const sk = hkDateKey(s.startsAt);
    if (sk < startKey || sk > endKey) {
      throw new AdminBookingError(
        "CAMPAIGN_DATE_INVALID",
        `時段不在活動有效期內（slot ${s.id.slice(0, 8)}…）`
      );
    }
  }

  for (const slotId of finalSlotIds) {
    const slotRow =
      req.allocations.find((a) => a.bookingSlotId === slotId)?.slot ??
      addSlots.find((s) => s.id === slotId);
    if (!slotRow) {
      throw new AdminBookingError("INTERNAL", "時段資料不一致");
    }
    const others = await countSlotUsageExcludingRequest(slotId, bookingRequestId);
    const cap = effectiveCapacityTotalForSlot(slotRow);
    if (others + 1 > cap) {
      throw new AdminBookingError(
        "SLOT_FULL",
        `時段已滿，無法完成更改（slot ${slotId.slice(0, 8)}…）`
      );
    }
  }

  const newAllocStatus =
    req.status === BookingRequestStatus.approved
      ? BookingAllocationStatus.approved
      : BookingAllocationStatus.pending;

  await prisma.$transaction(
    async (tx) => {
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
          actorType: AuditActorType.admin,
          actorId: adminUserId,
          meta: {
            action: "admin_reschedule",
            removedSlotIds: removeSlotIds,
            addedSlotIds: addSlotIds,
          },
        },
      });

      await tx.auditLog.create({
        data: {
          adminUserId,
          action: "booking.reschedule_by_admin",
          entityType: "booking_request",
          entityId: bookingRequestId,
          diff: { removeSlotIds, addSlotIds },
        },
      });
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      maxWait: 10_000,
      timeout: 20_000,
    }
  );
}
