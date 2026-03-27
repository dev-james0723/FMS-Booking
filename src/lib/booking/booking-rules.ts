import type { BookingIdentityType, QuotaTier } from "@prisma/client";
import type { Prisma } from "@prisma/client";
import { BookingRuleError } from "@/lib/booking/booking-errors";
import {
  BOOKING_COOLDOWN_MS,
  ROLLING_WINDOW_CALENDAR_DAYS,
} from "@/lib/booking/booking-constants";
import { hkCalendarDaysBetween, shiftHkDateKey } from "@/lib/booking/hk-dates";
import type { BookingNumericSettings } from "@/lib/booking/settings";
import { prisma } from "@/lib/prisma";

export function isSlotDateWithinRollingWindow(
  todayKey: string,
  slotDayKey: string,
  windowDays: number = ROLLING_WINDOW_CALENDAR_DAYS
): boolean {
  const advance = hkCalendarDaysBetween(todayKey, slotDayKey);
  return advance >= 0 && advance < windowDays;
}

export function rollingWindowEndDateKey(todayKey: string): string {
  return shiftHkDateKey(todayKey, ROLLING_WINDOW_CALENDAR_DAYS - 1);
}

export function getQuotaNumericLimits(
  quotaTier: QuotaTier,
  nums: BookingNumericSettings
): { dailyMax: number; rollingMax: number } {
  if (quotaTier === "teaching") {
    return {
      dailyMax: nums.teachingMaxPerDay,
      rollingMax: nums.teachingMaxRolling3d,
    };
  }
  return {
    dailyMax: nums.personalMaxPerDay,
    rollingMax: nums.personalMaxRolling3d,
  };
}

export function resolveBookingIdentityTypeOrThrow(
  individualEligible: boolean,
  teachingEligible: boolean,
  requested: BookingIdentityType | null | undefined
): BookingIdentityType {
  if (!individualEligible && !teachingEligible) {
    throw new BookingRuleError(
      "REGISTRATION_INCOMPLETE",
      "帳戶未設定有效預約身份，請聯絡主辦方。"
    );
  }
  const dual = individualEligible && teachingEligible;
  if (!dual) {
    if (individualEligible) {
      if (requested && requested !== "individual") {
        throw new BookingRuleError(
          "BOOKING_IDENTITY_INELIGIBLE",
          "你未具備所選身份類別的預約資格。"
        );
      }
      return "individual";
    }
    if (requested && requested !== "teaching_or_with_students") {
      throw new BookingRuleError(
        "BOOKING_IDENTITY_INELIGIBLE",
        "你未具備所選身份類別的預約資格。"
      );
    }
    return "teaching_or_with_students";
  }
  if (requested !== "individual" && requested !== "teaching_or_with_students") {
    throw new BookingRuleError(
      "BOOKING_IDENTITY_REQUIRED",
      "請選擇今次預約所使用之身份類別。"
    );
  }
  return requested;
}

export function assertCooldownAllowsBooking(lastBookingAt: Date | null, now: Date): void {
  if (!lastBookingAt) return;
  const elapsed = now.getTime() - lastBookingAt.getTime();
  if (elapsed < BOOKING_COOLDOWN_MS) {
    const until = new Date(lastBookingAt.getTime() + BOOKING_COOLDOWN_MS);
    throw new BookingRuleError("BOOKING_COOLDOWN_ACTIVE", "你剛完成預約，請於 3 小時後再提交新的預約。", {
      cooldownUntil: until.toISOString(),
    });
  }
}

export function cooldownRemainingMs(lastBookingAt: Date | null, now: Date): number {
  if (!lastBookingAt) return 0;
  const until = lastBookingAt.getTime() + BOOKING_COOLDOWN_MS;
  return Math.max(0, until - now.getTime());
}

type DbClient = Prisma.TransactionClient | typeof prisma;

export async function loadSlotUsageCountsDb(
  db: DbClient,
  slotIds: string[]
): Promise<Map<string, number>> {
  if (slotIds.length === 0) return new Map();
  const allocs = await db.bookingAllocation.findMany({
    where: {
      bookingSlotId: { in: slotIds },
      status: { in: ["pending", "approved"] },
      request: { status: { in: ["pending", "approved", "waitlisted"] } },
    },
    select: { bookingSlotId: true },
  });
  const map = new Map<string, number>();
  for (const a of allocs) {
    map.set(a.bookingSlotId, (map.get(a.bookingSlotId) ?? 0) + 1);
  }
  return map;
}

