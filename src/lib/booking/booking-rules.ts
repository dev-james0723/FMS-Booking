import type { BookingIdentityType, BookingVenueKind, QuotaTier } from "@prisma/client";
import type { Prisma } from "@prisma/client";
import { BookingRuleError } from "@/lib/booking/booking-errors";
import {
  ADVANCE_DAYS_INDIVIDUAL_WEEKDAY,
  ADVANCE_DAYS_INDIVIDUAL_WEEKEND,
  ADVANCE_DAYS_TEACHING_WEEKDAY,
  ADVANCE_DAYS_TEACHING_WEEKEND,
  BOOKING_COOLDOWN_MS,
} from "@/lib/booking/booking-constants";
import { hkCalendarDaysBetween, isHkWeekend, shiftHkDateKey } from "@/lib/booking/hk-dates";
import {
  quotaLimitsForTier,
  type BookingNumericSettings,
} from "@/lib/booking/booking-numeric-settings";
import { prisma } from "@/lib/prisma";

export function isSlotDateWithinRollingWindow(
  todayKey: string,
  slotDayKey: string,
  windowDays: number
): boolean {
  const advance = hkCalendarDaysBetween(todayKey, slotDayKey);
  return advance >= 0 && advance < windowDays;
}

/**
 * Per-tier, weekday/weekend-aware booking horizon (inclusive calendar days from today).
 *
 * | Tier        | Mon–Fri | Sat–Sun |
 * |-------------|---------|---------|
 * | teaching    |      14 |       7 |
 * | individual  |       7 |       3 |
 */
export function advanceWindowDays(
  quotaTier: "individual" | "teaching",
  slotDayKey: string
): number {
  const weekend = isHkWeekend(slotDayKey);
  if (quotaTier === "teaching") {
    return weekend ? ADVANCE_DAYS_TEACHING_WEEKEND : ADVANCE_DAYS_TEACHING_WEEKDAY;
  }
  return weekend ? ADVANCE_DAYS_INDIVIDUAL_WEEKEND : ADVANCE_DAYS_INDIVIDUAL_WEEKDAY;
}

/** Outer-bound end date for the advance window (weekday value, always >= weekend). */
export function advanceWindowEndDateKey(
  todayKey: string,
  quotaTier: "individual" | "teaching"
): string {
  const maxDays =
    quotaTier === "teaching"
      ? ADVANCE_DAYS_TEACHING_WEEKDAY
      : ADVANCE_DAYS_INDIVIDUAL_WEEKDAY;
  return shiftHkDateKey(todayKey, maxDays - 1);
}

export function getQuotaNumericLimits(
  quotaTier: QuotaTier,
  nums: BookingNumericSettings
): { dailyMax: number; rollingMax: number } {
  return quotaLimitsForTier(quotaTier, nums);
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

/**
 * Piano studio slots are exclusive (one active booking per 30-minute row). Legacy rows may still
 * have capacity_total > 1 from older scripts — availability and booking checks must not
 * allow a second booking for the same cell.
 */
export function effectiveCapacityTotalForSlot(slot: {
  capacityTotal: number;
  venueKind: BookingVenueKind;
}): number {
  return slot.venueKind === "studio_room" ? 1 : slot.capacityTotal;
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

/** Like `loadSlotUsageCountsDb` but ignores allocations belonging to one booking request (for admin reschedule / availability). */
export async function loadSlotUsageCountsDbExcludingRequest(
  db: DbClient,
  slotIds: string[],
  excludeBookingRequestId: string | null
): Promise<Map<string, number>> {
  if (slotIds.length === 0) return new Map();
  const allocs = await db.bookingAllocation.findMany({
    where: {
      bookingSlotId: { in: slotIds },
      status: { in: ["pending", "approved"] },
      request: { status: { in: ["pending", "approved", "waitlisted"] } },
      ...(excludeBookingRequestId
        ? { bookingRequestId: { not: excludeBookingRequestId } }
        : {}),
    },
    select: { bookingSlotId: true },
  });
  const map = new Map<string, number>();
  for (const a of allocs) {
    map.set(a.bookingSlotId, (map.get(a.bookingSlotId) ?? 0) + 1);
  }
  return map;
}

