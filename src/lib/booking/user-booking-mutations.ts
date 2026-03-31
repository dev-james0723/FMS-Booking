import {
  AuditActorType,
  BookingAllocationStatus,
  BookingRequestStatus,
  Prisma,
} from "@prisma/client";
import { ADMIN_MANAGEABLE_REQUEST_STATUS } from "@/lib/booking/admin-actions";
import {
  assertUserQuotaAfterRescheduleTx,
  countSlotUsageExcludingRequestDb,
  RescheduleCoreError,
  runBookingRescheduleTx,
} from "@/lib/booking/booking-reschedule-core";
import { BOOKING_SELF_SERVICE_CUTOFF_MS } from "@/lib/booking/booking-self-service-policy";
import {
  advanceWindowDays,
  effectiveCapacityTotalForSlot,
  getQuotaNumericLimits,
  isSlotDateWithinRollingWindow,
} from "@/lib/booking/booking-rules";
import { parseBookingNumericSettings, parseCampaignDateKeys } from "@/lib/booking/settings";
import { userMayAccessBookingVenue } from "@/lib/booking/venue-kind";
import { prisma } from "@/lib/prisma";
import { getAllSettings, getEffectiveNow } from "@/lib/settings";
import { hkDateKey } from "@/lib/time";

export type UserBookingMutationDetails = {
  reason?: "no_profile" | "booking_channel";
  slotId?: string;
  day?: string;
  dailyMax?: number;
  rollingMax?: number;
  count?: number;
  windowDays?: number;
};

export class UserBookingMutationError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: UserBookingMutationDetails
  ) {
    super(message);
    this.name = "UserBookingMutationError";
  }
}

function assertStartsAtOutsideCutoff(slots: { startsAt: Date }[], now: Date): void {
  for (const s of slots) {
    if (s.startsAt.getTime() - now.getTime() < BOOKING_SELF_SERVICE_CUTOFF_MS) {
      throw new UserBookingMutationError(
        "WITHIN_CUTOFF",
        "所選時段距開始不足 15 小時，請聯絡主辦方以 WhatsApp 協助更改或取消。"
      );
    }
  }
}

export async function userRescheduleBookingRequest(
  userId: string,
  bookingRequestId: string,
  params: { removeSlotIds: string[]; addSlotIds: string[] }
): Promise<void> {
  const removeSlotIds = [...new Set(params.removeSlotIds)];
  const addSlotIds = [...new Set(params.addSlotIds)];

  if (removeSlotIds.length === 0 && addSlotIds.length === 0) {
    throw new UserBookingMutationError("NO_CHANGE", "請選擇要釋放的時段和／或要新增的替換時段");
  }

  const now = await getEffectiveNow();

  const req = await prisma.bookingRequest.findUnique({
    where: { id: bookingRequestId },
    include: {
      user: { include: { profile: true, category: true } },
      allocations: {
        where: {
          status: { in: [BookingAllocationStatus.pending, BookingAllocationStatus.approved] },
        },
        include: { slot: true },
      },
    },
  });

  if (!req || req.userId !== userId) {
    throw new UserBookingMutationError("NOT_FOUND", "預約不存在");
  }
  if (!req.user.profile) {
    throw new UserBookingMutationError("FORBIDDEN", "無法處理此預約", {
      reason: "no_profile",
    });
  }
  if (!userMayAccessBookingVenue(req.user.profile.bookingVenueKind, req.venueKind)) {
    throw new UserBookingMutationError("FORBIDDEN", "此帳戶不可修改此通道的預約", {
      reason: "booking_channel",
    });
  }
  if (!ADMIN_MANAGEABLE_REQUEST_STATUS.includes(req.status)) {
    throw new UserBookingMutationError("INVALID_STATUS", "此預約狀態無法更改時段");
  }

  const currentSlotIds = new Set(req.allocations.map((a) => a.bookingSlotId));
  for (const id of removeSlotIds) {
    if (!currentSlotIds.has(id)) {
      throw new UserBookingMutationError(
        "INVALID_REMOVE",
        `所選釋放時段不屬於此預約（slot ${id.slice(0, 8)}…）`
      );
    }
  }

  const removeSlots = req.allocations.filter((a) => removeSlotIds.includes(a.bookingSlotId));
  assertStartsAtOutsideCutoff(removeSlots.map((a) => a.slot), now);

  const keptSlotIds = [...currentSlotIds].filter((id) => !removeSlotIds.includes(id));
  const keptSet = new Set(keptSlotIds);
  for (const id of addSlotIds) {
    if (keptSet.has(id)) {
      throw new UserBookingMutationError(
        "DUPLICATE_SLOT",
        `新時段與保留時段重複（slot ${id.slice(0, 8)}…）`
      );
    }
  }

  const finalSlotIds = [...new Set([...keptSlotIds, ...addSlotIds])];
  if (finalSlotIds.length === 0) {
    throw new UserBookingMutationError("EMPTY_RESULT", "更改後須至少保留一個時段");
  }

  const settings = await getAllSettings();
  const { startKey, endKey } = parseCampaignDateKeys(settings);
  if (!startKey || !endKey) {
    throw new UserBookingMutationError("SETTINGS", "活動日期未設定，無法更改時段");
  }

  const nums = parseBookingNumericSettings(settings);
  const { dailyMax, rollingMax } = getQuotaNumericLimits(req.user.quotaTier, nums);

  const addSlots =
    addSlotIds.length === 0
      ? []
      : await prisma.bookingSlot.findMany({ where: { id: { in: addSlotIds } } });

  if (addSlots.length !== addSlotIds.length) {
    throw new UserBookingMutationError("SLOT_NOT_FOUND", "部分替換時段不存在");
  }

  const todayKey = hkDateKey(now);
  for (const s of addSlots) {
    if (s.venueKind !== req.venueKind) {
      throw new UserBookingMutationError("VENUE_MISMATCH", "替換時段必須與原預約屬同一場地系統");
    }
    if (!s.isOpen) {
      throw new UserBookingMutationError("SLOT_CLOSED", `時段已關閉（slot ${s.id.slice(0, 8)}…）`);
    }
    const sk = hkDateKey(s.startsAt);
    if (sk < startKey || sk > endKey) {
      throw new UserBookingMutationError(
        "CAMPAIGN_DATE_INVALID",
        `時段不在活動有效期內（slot ${s.id.slice(0, 8)}…）`
      );
    }
    const slotWindowDays = advanceWindowDays(req.user.quotaTier, sk);
    if (!isSlotDateWithinRollingWindow(todayKey, sk, slotWindowDays)) {
      throw new UserBookingMutationError(
        "BOOKING_OUTSIDE_ROLLING_WINDOW",
        "自行更改時段只可選未來可預約範圍內之可用時段。",
        { windowDays: slotWindowDays }
      );
    }
  }

  for (const slotId of finalSlotIds) {
    const slotRow =
      req.allocations.find((a) => a.bookingSlotId === slotId)?.slot ??
      addSlots.find((s) => s.id === slotId);
    if (!slotRow) {
      throw new UserBookingMutationError("INTERNAL", "時段資料不一致");
    }
    const others = await countSlotUsageExcludingRequestDb(prisma, slotId, bookingRequestId);
    const cap = effectiveCapacityTotalForSlot(slotRow);
    if (others + 1 > cap) {
      throw new UserBookingMutationError(
        "SLOT_FULL",
        `時段已滿，無法完成更改（slot ${slotId.slice(0, 8)}…）`
      );
    }
  }

  try {
    await prisma.$transaction(
      async (tx) => {
        await assertUserQuotaAfterRescheduleTx(tx, {
          userId,
          excludeBookingRequestId: bookingRequestId,
          finalSlotIds,
          startKey,
          endKey,
          dailyMax,
          rollingMax,
        });

        await runBookingRescheduleTx(tx, {
          bookingRequestId,
          req,
          removeSlotIds,
          addSlotIds,
          addSlots,
          actorType: AuditActorType.user,
          actorId: userId,
          statusLogMetaAction: "user_reschedule",
          adminUserIdForAudit: null,
        });
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        maxWait: 10_000,
        timeout: 20_000,
      }
    );
  } catch (e) {
    if (e instanceof RescheduleCoreError) {
      throw new UserBookingMutationError(e.code, e.message, e.details);
    }
    throw e;
  }
}

export async function userReleaseBookingSlots(
  userId: string,
  bookingRequestId: string,
  params: { slotIds?: string[]; dateKey?: string }
): Promise<{ releasedSlotIds: string[]; requestCancelled: boolean }> {
  const now = await getEffectiveNow();

  const req = await prisma.bookingRequest.findUnique({
    where: { id: bookingRequestId },
    include: {
      user: { include: { profile: true } },
      allocations: {
        where: {
          status: { in: [BookingAllocationStatus.pending, BookingAllocationStatus.approved] },
        },
        include: { slot: true },
      },
    },
  });

  if (!req || req.userId !== userId) {
    throw new UserBookingMutationError("NOT_FOUND", "預約不存在");
  }
  if (!req.user.profile) {
    throw new UserBookingMutationError("FORBIDDEN", "無法處理此預約", {
      reason: "no_profile",
    });
  }
  if (!userMayAccessBookingVenue(req.user.profile.bookingVenueKind, req.venueKind)) {
    throw new UserBookingMutationError("FORBIDDEN", "此帳戶不可修改此通道的預約", {
      reason: "booking_channel",
    });
  }
  if (!ADMIN_MANAGEABLE_REQUEST_STATUS.includes(req.status)) {
    throw new UserBookingMutationError("INVALID_STATUS", "此預約狀態無法取消時段");
  }

  let releaseIds: string[];
  if (params.dateKey && params.dateKey.trim()) {
    const dk = params.dateKey.trim();
    releaseIds = req.allocations
      .filter((a) => hkDateKey(a.slot.startsAt) === dk)
      .map((a) => a.bookingSlotId);
    if (releaseIds.length === 0) {
      throw new UserBookingMutationError("INVALID_REMOVE", "該日沒有可取消的時段");
    }
  } else if (params.slotIds && params.slotIds.length > 0) {
    releaseIds = [...new Set(params.slotIds)];
    const current = new Set(req.allocations.map((a) => a.bookingSlotId));
    for (const id of releaseIds) {
      if (!current.has(id)) {
        throw new UserBookingMutationError(
          "INVALID_REMOVE",
          `所選時段不屬於此預約（slot ${id.slice(0, 8)}…）`
        );
      }
    }
  } else {
    throw new UserBookingMutationError("VALIDATION_ERROR", "請選擇要取消的時段或日期");
  }

  const toReleaseAllocs = req.allocations.filter((a) => releaseIds.includes(a.bookingSlotId));
  assertStartsAtOutsideCutoff(toReleaseAllocs.map((a) => a.slot), now);

  let requestCancelled = false;

  await prisma.$transaction(async (tx) => {
    await tx.bookingAllocation.updateMany({
      where: {
        bookingRequestId,
        bookingSlotId: { in: releaseIds },
        status: { in: [BookingAllocationStatus.pending, BookingAllocationStatus.approved] },
      },
      data: { status: BookingAllocationStatus.released },
    });

    const remaining = await tx.bookingAllocation.count({
      where: {
        bookingRequestId,
        status: { in: [BookingAllocationStatus.pending, BookingAllocationStatus.approved] },
      },
    });

    if (remaining === 0) {
      requestCancelled = true;
      await tx.bookingRequest.update({
        where: { id: bookingRequestId },
        data: { status: BookingRequestStatus.cancelled },
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
          actorType: AuditActorType.user,
          actorId: userId,
          meta: { action: "user_cancel_all_remaining" },
        },
      });
    } else {
      await tx.bookingStatusLog.create({
        data: {
          bookingRequestId,
          fromStatus: req.status,
          toStatus: req.status,
          actorType: AuditActorType.user,
          actorId: userId,
          meta: { action: "user_partial_cancel", releasedSlotIds: releaseIds },
        },
      });
    }
  });

  return { releasedSlotIds: releaseIds, requestCancelled };
}
