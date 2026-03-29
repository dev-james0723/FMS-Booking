import {
  BookingRequestStatus,
  type BookingSlot,
  type BookingIdentityType,
  type BookingVenueKind,
  type CameraRentalPaymentChoice,
  type User,
  Prisma,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { BookingRuleError } from "@/lib/booking/booking-errors";
export { BookingRuleError };
export type { BookingGateErrorCode } from "@/lib/booking/booking-errors";
import { isBookingPortalLiveFromSettings } from "@/lib/booking/booking-portal-live";
import {
  assertCooldownAllowsBooking,
  getQuotaNumericLimits,
  isSlotDateWithinRollingWindow,
  loadSlotUsageCountsDb,
  resolveBookingIdentityTypeOrThrow,
} from "@/lib/booking/booking-rules";
import { getEffectiveNow, getAllSettings } from "@/lib/settings";
import { hkDateKey } from "@/lib/time";
import { hkCalendarDaysBetween, maxRollingThreeDaySum } from "@/lib/booking/hk-dates";
import {
  parseBookingNumericSettings,
  parseCampaignDateKeys,
} from "@/lib/booking/settings";
import { COUNTED_REQUEST_STATUS } from "@/lib/booking/day-counts";
import { userMayAccessBookingVenue } from "@/lib/booking/venue-kind";

function mergeDayCounts(
  base: Map<string, number>,
  extraDates: string[]
): Map<string, number> {
  const m = new Map(base);
  for (const d of extraDates) {
    m.set(d, (m.get(d) ?? 0) + 1);
  }
  return m;
}

function userHasSlotOverlap(newSlots: BookingSlot[], existing: { slot: BookingSlot }[]): boolean {
  const intervals = newSlots.map((s) => ({
    start: s.startsAt.getTime(),
    end: s.endsAt.getTime(),
  }));
  for (let i = 0; i < intervals.length; i++) {
    for (let j = i + 1; j < intervals.length; j++) {
      const a = intervals[i];
      const b = intervals[j];
      if (a.start < b.end && b.start < a.end) return true;
    }
  }
  for (const ex of existing) {
    const es = ex.slot.startsAt.getTime();
    const ee = ex.slot.endsAt.getTime();
    for (const a of intervals) {
      if (a.start < ee && es < a.end) return true;
    }
  }
  return false;
}

export async function assertBookingPortalAllowed(
  user: User & { credentials: { mustChangePassword: boolean } | null }
) {
  const settings = await getAllSettings();
  const now = await getEffectiveNow();
  if (!isBookingPortalLiveFromSettings(settings, now)) {
    throw new BookingRuleError("BOOKING_NOT_OPEN", "預約系統尚未開放");
  }
  if (!user.hasCompletedRegistration) {
    throw new BookingRuleError("REGISTRATION_INCOMPLETE", "請先完成登記");
  }
  if (user.accountStatus !== "active") {
    throw new BookingRuleError("ACCOUNT_NOT_ACTIVE", "帳戶狀態未能預約");
  }
  if (!user.credentials || user.credentials.mustChangePassword) {
    throw new BookingRuleError("MUST_CHANGE_PASSWORD", "請先更改臨時密碼");
  }
  return { settings, now };
}

export async function validateAndCreateBookingRequest(params: {
  userId: string;
  userCategoryCode: string;
  slotIds: string[];
  bonusRewardId?: string | null;
  bookingIdentityType?: BookingIdentityType | null;
  cameraRentalOptIn?: boolean;
  cameraRentalPaymentChoice?: CameraRentalPaymentChoice | null;
}): Promise<{ requestId: string }> {
  const { userId, userCategoryCode, slotIds } = params;
  const cameraOptIn = params.cameraRentalOptIn === true;
  const cameraChoice = params.cameraRentalPaymentChoice ?? null;
  if (cameraOptIn && !cameraChoice) {
    throw new BookingRuleError(
      "CAMERA_RENTAL_INCOMPLETE",
      "已選擇租用攝錄機，請完成付款方式確認後再提交。"
    );
  }
  if (!cameraOptIn && cameraChoice) {
    throw new BookingRuleError("VALIDATION_ERROR", "相機租用資料不一致");
  }
  const uniqueSlotIds = [...new Set(slotIds)];

  if (uniqueSlotIds.length === 0) {
    throw new BookingRuleError("NO_SLOTS", "請選擇至少一個時段");
  }

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    include: { credentials: true, category: true, profile: true },
  });

  const { settings, now } = await assertBookingPortalAllowed(user);

  const nums = parseBookingNumericSettings(settings);
  const { startKey, endKey } = parseCampaignDateKeys(settings);
  if (!startKey || !endKey) {
    throw new BookingRuleError("CAMPAIGN_DATE_INVALID", "活動日期未設定");
  }

  const todayKey = hkDateKey(now);
  const quotaTier = user.quotaTier;
  const { dailyMax, rollingMax } = getQuotaNumericLimits(quotaTier, nums);

  if (!user.profile) {
    throw new BookingRuleError("REGISTRATION_INCOMPLETE", "請先完成登記");
  }

  assertCooldownAllowsBooking(user.lastBookingAt, now);

  const categoryCode = user.category?.code ?? userCategoryCode;

  const requestId = await prisma.$transaction(
    async (tx) => {
      const u = await tx.user.findUniqueOrThrow({
        where: { id: userId },
        include: { profile: true, category: true },
      });
      if (!u.profile) {
        throw new BookingRuleError("REGISTRATION_INCOMPLETE", "請先完成登記");
      }

      assertCooldownAllowsBooking(u.lastBookingAt, now);

      const slots = await tx.bookingSlot.findMany({
        where: { id: { in: uniqueSlotIds } },
        orderBy: { startsAt: "asc" },
      });

      if (slots.length !== uniqueSlotIds.length) {
        throw new BookingRuleError("SLOT_NOT_FOUND", "部分時段不存在");
      }

      const venueFromSlots = slots[0]!.venueKind;
      for (const s of slots) {
        if (s.venueKind !== venueFromSlots) {
          throw new BookingRuleError("BOOKING_VENUE_MIXED", "所選時段必須屬於同一預約系統（琴房或開放空間）");
        }
      }
      if (!userMayAccessBookingVenue(u.profile.bookingVenueKind, venueFromSlots)) {
        throw new BookingRuleError(
          "BOOKING_VENUE_MISMATCH",
          "此帳戶僅可預約開放空間時段；請使用大型樂器／開放空間預約頁面。琴室通道登記者可於琴室或開放空間預約（節數上限共用）。"
        );
      }

      for (const s of slots) {
        if (!s.isOpen) {
          throw new BookingRuleError("SLOT_CLOSED", "時段已關閉", { slotId: s.id });
        }
        const sk = hkDateKey(s.startsAt);
        if (sk < startKey || sk > endKey) {
          throw new BookingRuleError("CAMPAIGN_DATE_INVALID", "時段不在活動有效期內", {
            slotId: s.id,
          });
        }
        const advance = hkCalendarDaysBetween(todayKey, sk);
        if (advance < 0) {
          throw new BookingRuleError("CAMPAIGN_DATE_INVALID", "不可選擇已過去的時段", {
            slotId: s.id,
          });
        }
        if (!isSlotDateWithinRollingWindow(todayKey, sk)) {
          throw new BookingRuleError(
            "BOOKING_OUTSIDE_ROLLING_WINDOW",
            "你目前只可預約未來 3 日內之時段。",
            { slotId: s.id, slotDate: sk }
          );
        }
      }

      const usage = await loadSlotUsageCountsDb(tx, uniqueSlotIds);
      for (const s of slots) {
        const used = usage.get(s.id) ?? 0;
        if (used >= s.capacityTotal) {
          throw new BookingRuleError("SLOT_FULL", "該時段已被預約，請選擇其他時間。", {
            slotId: s.id,
          });
        }
      }

      const existingAllocs = await tx.bookingAllocation.findMany({
        where: {
          request: {
            userId,
            status: { in: COUNTED_REQUEST_STATUS },
          },
          status: { in: ["pending", "approved"] },
        },
        include: { slot: true },
      });

      if (userHasSlotOverlap(slots, existingAllocs)) {
        throw new BookingRuleError("SLOT_OVERLAP", "所選時段與現有預約重疊或彼此重疊");
      }

      const existingDayCounts = await loadUserExistingDayCountsTx(tx, userId);
      const newDayKeys = slots.map((s) => hkDateKey(s.startsAt));
      const merged = mergeDayCounts(existingDayCounts, newDayKeys);

      for (const [day, n] of merged) {
        if (day < startKey || day > endKey) continue;
        if (n > dailyMax) {
          throw new BookingRuleError(
            "BOOKING_LIMIT_DAILY",
            "你今日的可預約時段已達上限。",
            { date: day, count: n }
          );
        }
      }

      if (maxRollingThreeDaySum(merged) > rollingMax) {
        throw new BookingRuleError(
          "BOOKING_LIMIT_ROLLING_3D",
          "你於連續 3 日內的可預約時段已達上限。",
          { rollingMax }
        );
      }

      let usesBonus = false;
      let bonusId: string | null = null;
      if (params.bonusRewardId) {
        const br = await tx.bonusReward.findFirst({
          where: {
            id: params.bonusRewardId,
            userId,
            slotsRemaining: { gt: 0 },
          },
        });
        if (!br) {
          throw new BookingRuleError("BONUS_INVALID", "Bonus 時段無效或已用盡");
        }
        usesBonus = true;
        bonusId = br.id;
      }

      const resolvedIdentity = resolveBookingIdentityTypeOrThrow(
        u.profile.individualEligible,
        u.profile.teachingEligible,
        params.bookingIdentityType ?? undefined
      );

      const req = await tx.bookingRequest.create({
        data: {
          userId,
          status: BookingRequestStatus.pending,
          venueKind: venueFromSlots,
          bookingIdentityType: resolvedIdentity,
          userCategoryAtRequest: u.category?.code ?? categoryCode,
          usesBonusSlot: usesBonus,
          bonusRewardId: bonusId,
          cameraRentalOptIn: cameraOptIn,
          cameraRentalPaymentChoice: cameraOptIn ? cameraChoice : null,
        },
      });

      for (const s of slots) {
        await tx.bookingAllocation.create({
          data: {
            bookingRequestId: req.id,
            bookingSlotId: s.id,
            status: "pending",
          },
        });
      }

      if (bonusId) {
        await tx.bonusReward.update({
          where: { id: bonusId },
          data: { slotsRemaining: { decrement: 1 } },
        });
      }

      await tx.bookingStatusLog.create({
        data: {
          bookingRequestId: req.id,
          fromStatus: null,
          toStatus: BookingRequestStatus.pending,
          actorType: "system",
          actorId: null,
        },
      });

      await tx.user.update({
        where: { id: userId },
        data: { lastBookingAt: new Date() },
      });

      return req.id;
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      maxWait: 10_000,
      timeout: 20_000,
    }
  );

  return { requestId };
}

async function loadUserExistingDayCountsTx(
  tx: Prisma.TransactionClient,
  userId: string
): Promise<Map<string, number>> {
  const allocs = await tx.bookingAllocation.findMany({
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

export async function listAvailability(params: {
  from: Date;
  to: Date;
  venueKind: BookingVenueKind;
}): Promise<(BookingSlot & { bookedCount: number; remaining: number })[]> {
  const slots = await prisma.bookingSlot.findMany({
    where: {
      isOpen: true,
      venueKind: params.venueKind,
      startsAt: { gte: params.from, lte: params.to },
    },
    orderBy: { startsAt: "asc" },
  });
  const ids = slots.map((s) => s.id);
  const usage = await loadSlotUsageCountsDb(prisma, ids);
  return slots.map((s) => {
    const booked = usage.get(s.id) ?? 0;
    return {
      ...s,
      bookedCount: booked,
      remaining: Math.max(0, s.capacityTotal - booked),
    };
  });
}

export async function listSlotsForCalendarView(params: {
  from: Date;
  to: Date;
  venueKind: BookingVenueKind;
}): Promise<(BookingSlot & { bookedCount: number; remaining: number })[]> {
  const slots = await prisma.bookingSlot.findMany({
    where: {
      venueKind: params.venueKind,
      startsAt: { gte: params.from, lte: params.to },
    },
    orderBy: { startsAt: "asc" },
  });
  const ids = slots.map((s) => s.id);
  const usage = await loadSlotUsageCountsDb(prisma, ids);
  return slots.map((s) => {
    const booked = usage.get(s.id) ?? 0;
    return {
      ...s,
      bookedCount: booked,
      remaining: Math.max(0, s.capacityTotal - booked),
    };
  });
}
