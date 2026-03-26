import { BookingRequestStatus, type BookingSlot, type User } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getEffectiveNow, getAllSettings, parseInstantSetting } from "@/lib/settings";
import { hkDateKey } from "@/lib/time";
import { hkCalendarDaysBetween, maxRollingThreeDaySum } from "@/lib/booking/hk-dates";
import {
  parseBookingNumericSettings,
  parseCampaignDateKeys,
} from "@/lib/booking/settings";

const COUNTED_REQUEST_STATUS: BookingRequestStatus[] = [
  BookingRequestStatus.pending,
  BookingRequestStatus.approved,
  BookingRequestStatus.waitlisted,
];

export type BookingGateErrorCode =
  | "BOOKING_NOT_OPEN"
  | "MUST_CHANGE_PASSWORD"
  | "REGISTRATION_INCOMPLETE"
  | "ACCOUNT_NOT_ACTIVE"
  | "VALIDATION_ERROR"
  | "SLOT_NOT_FOUND"
  | "SLOT_CLOSED"
  | "SLOT_FULL"
  | "CAMPAIGN_DATE_INVALID"
  | "BOOKING_TOO_FAR_ADVANCE"
  | "BOOKING_LIMIT_DAILY"
  | "BOOKING_LIMIT_ROLLING_3D"
  | "SLOT_OVERLAP"
  | "BONUS_INVALID"
  | "NO_SLOTS";

export class BookingRuleError extends Error {
  constructor(
    public code: BookingGateErrorCode,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = "BookingRuleError";
  }
}

export async function assertBookingPortalAllowed(user: User & { credentials: { mustChangePassword: boolean } | null }) {
  const settings = await getAllSettings();
  const now = await getEffectiveNow();
  const bookingOpens = parseInstantSetting(settings["booking_opens_at"]);
  if (!bookingOpens || now.getTime() < bookingOpens.getTime()) {
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

async function loadUserExistingDayCounts(
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

async function loadSlotUsageCounts(
  slotIds: string[]
): Promise<Map<string, number>> {
  if (slotIds.length === 0) return new Map();
  const allocs = await prisma.bookingAllocation.findMany({
    where: {
      bookingSlotId: { in: slotIds },
      status: { in: ["pending", "approved"] },
      request: { status: { in: COUNTED_REQUEST_STATUS } },
    },
    select: { bookingSlotId: true },
  });
  const map = new Map<string, number>();
  for (const a of allocs) {
    map.set(a.bookingSlotId, (map.get(a.bookingSlotId) ?? 0) + 1);
  }
  return map;
}

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

export async function validateAndCreateBookingRequest(params: {
  userId: string;
  userCategoryCode: string;
  slotIds: string[];
  bonusRewardId?: string | null;
}): Promise<{ requestId: string }> {
  const { userId, userCategoryCode, slotIds } = params;
  const uniqueSlotIds = [...new Set(slotIds)];

  if (uniqueSlotIds.length === 0) {
    throw new BookingRuleError("NO_SLOTS", "請選擇至少一個時段");
  }

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    include: { credentials: true, category: true },
  });

  const { settings, now } = await assertBookingPortalAllowed(user);

  const nums = parseBookingNumericSettings(settings);
  const { startKey, endKey } = parseCampaignDateKeys(settings);
  if (!startKey || !endKey) {
    throw new BookingRuleError("CAMPAIGN_DATE_INVALID", "活動日期未設定");
  }

  const todayKey = hkDateKey(now);
  const dailyMax =
    userCategoryCode === "teaching"
      ? nums.teachingMaxPerDay
      : nums.personalMaxPerDay;
  const rollingMax =
    userCategoryCode === "teaching"
      ? nums.teachingMaxRolling3d
      : nums.personalMaxRolling3d;

  const slots = await prisma.bookingSlot.findMany({
    where: { id: { in: uniqueSlotIds } },
    orderBy: { startsAt: "asc" },
  });

  if (slots.length !== uniqueSlotIds.length) {
    throw new BookingRuleError("SLOT_NOT_FOUND", "部分時段不存在");
  }

  for (const s of slots) {
    if (!s.isOpen) {
      throw new BookingRuleError("SLOT_CLOSED", "時段已關閉", { slotId: s.id });
    }
    const sk = hkDateKey(s.startsAt);
    if (sk < startKey || sk > endKey) {
      throw new BookingRuleError(
        "CAMPAIGN_DATE_INVALID",
        "時段不在活動有效期內",
        { slotId: s.id }
      );
    }
    const advance = hkCalendarDaysBetween(todayKey, sk);
    if (advance < 0) {
      throw new BookingRuleError(
        "CAMPAIGN_DATE_INVALID",
        "不可選擇已過去的時段",
        { slotId: s.id }
      );
    }
    if (advance > nums.maxAdvanceDays) {
      throw new BookingRuleError(
        "BOOKING_TOO_FAR_ADVANCE",
        `最多只可提前 ${nums.maxAdvanceDays} 個曆日預約`,
        { slotId: s.id }
      );
    }
  }

  const usage = await loadSlotUsageCounts(uniqueSlotIds);
  for (const s of slots) {
    const used = usage.get(s.id) ?? 0;
    if (used >= s.capacityTotal) {
      throw new BookingRuleError("SLOT_FULL", "此時段申請名額已滿", {
        slotId: s.id,
      });
    }
  }

  const existingAllocs = await prisma.bookingAllocation.findMany({
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
    throw new BookingRuleError("SLOT_OVERLAP", "所選時段與現有申請重疊或彼此重疊");
  }

  const existingDayCounts = await loadUserExistingDayCounts(userId);
  const newDayKeys = slots.map((s) => hkDateKey(s.startsAt));
  const merged = mergeDayCounts(existingDayCounts, newDayKeys);

  for (const [day, n] of merged) {
    if (day < startKey || day > endKey) continue;
    if (n > dailyMax) {
      throw new BookingRuleError(
        "BOOKING_LIMIT_DAILY",
        `同一日最多只可申請 ${dailyMax} 節（30 分鐘為 1 節）`,
        { date: day, count: n }
      );
    }
  }

  if (maxRollingThreeDaySum(merged) > rollingMax) {
    throw new BookingRuleError(
      "BOOKING_LIMIT_ROLLING_3D",
      `任何連續 3 個曆日內最多只可申請 ${rollingMax} 節`,
      { rollingMax }
    );
  }

  let usesBonus = false;
  let bonusId: string | null = null;
  if (params.bonusRewardId) {
    const br = await prisma.bonusReward.findFirst({
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

  const categoryCode = user.category?.code ?? userCategoryCode;

  const requestId = await prisma.$transaction(async (tx) => {
    const req = await tx.bookingRequest.create({
      data: {
        userId,
        status: BookingRequestStatus.pending,
        userCategoryAtRequest: categoryCode,
        usesBonusSlot: usesBonus,
        bonusRewardId: bonusId,
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

    return req.id;
  });

  return { requestId };
}

export async function listAvailability(params: {
  from: Date;
  to: Date;
}): Promise<
  (BookingSlot & { bookedCount: number; remaining: number })[]
> {
  const slots = await prisma.bookingSlot.findMany({
    where: {
      isOpen: true,
      startsAt: { gte: params.from, lte: params.to },
    },
    orderBy: { startsAt: "asc" },
  });
  const ids = slots.map((s) => s.id);
  const usage = await loadSlotUsageCounts(ids);
  return slots.map((s) => {
    const booked = usage.get(s.id) ?? 0;
    return {
      ...s,
      bookedCount: booked,
      remaining: Math.max(0, s.capacityTotal - booked),
    };
  });
}
