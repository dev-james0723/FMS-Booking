import { describe, expect, it } from "vitest";
import { BookingRuleError } from "@/lib/booking/booking-errors";
import { BOOKING_COOLDOWN_MS } from "@/lib/booking/booking-constants";
import {
  advanceWindowDays,
  advanceWindowEndDateKey,
  assertCooldownAllowsBooking,
  getQuotaNumericLimits,
  isSlotDateWithinRollingWindow,
  resolveBookingIdentityTypeOrThrow,
} from "@/lib/booking/booking-rules";
import { isHkWeekend } from "@/lib/booking/hk-dates";
import type { BookingNumericSettings } from "@/lib/booking/settings";

const sampleNums: BookingNumericSettings = {
  personalMaxPerDay: 5,
  personalMaxRolling3d: 7,
  teachingMaxPerDay: 8,
  teachingMaxRolling3d: 16,
  maxAdvanceDays: 2,
};

describe("isSlotDateWithinRollingWindow", () => {
  it("allows today and the next two HK calendar days when window is 3", () => {
    expect(isSlotDateWithinRollingWindow("2026-04-01", "2026-04-01", 3)).toBe(true);
    expect(isSlotDateWithinRollingWindow("2026-04-01", "2026-04-02", 3)).toBe(true);
    expect(isSlotDateWithinRollingWindow("2026-04-01", "2026-04-03", 3)).toBe(true);
    expect(isSlotDateWithinRollingWindow("2026-04-01", "2026-04-04", 3)).toBe(false);
  });

  it("rejects past dates", () => {
    expect(isSlotDateWithinRollingWindow("2026-04-02", "2026-04-01", 7)).toBe(false);
  });

  it("works with window=7", () => {
    expect(isSlotDateWithinRollingWindow("2026-04-01", "2026-04-07", 7)).toBe(true);
    expect(isSlotDateWithinRollingWindow("2026-04-01", "2026-04-08", 7)).toBe(false);
  });

  it("works with window=14", () => {
    expect(isSlotDateWithinRollingWindow("2026-04-01", "2026-04-14", 14)).toBe(true);
    expect(isSlotDateWithinRollingWindow("2026-04-01", "2026-04-15", 14)).toBe(false);
  });
});

describe("isHkWeekend", () => {
  it("identifies Saturday as weekend", () => {
    // 2026-04-04 is a Saturday
    expect(isHkWeekend("2026-04-04")).toBe(true);
  });
  it("identifies Sunday as weekend", () => {
    // 2026-04-05 is a Sunday
    expect(isHkWeekend("2026-04-05")).toBe(true);
  });
  it("identifies Monday as weekday", () => {
    // 2026-04-06 is a Monday
    expect(isHkWeekend("2026-04-06")).toBe(false);
  });
  it("identifies Friday as weekday", () => {
    // 2026-04-03 is a Friday
    expect(isHkWeekend("2026-04-03")).toBe(false);
  });
});

describe("advanceWindowDays", () => {
  it("teaching tier, weekday slot → 14", () => {
    // 2026-04-06 is Monday
    expect(advanceWindowDays("teaching", "2026-04-06")).toBe(14);
  });
  it("teaching tier, weekend slot → 7", () => {
    // 2026-04-04 is Saturday
    expect(advanceWindowDays("teaching", "2026-04-04")).toBe(7);
  });
  it("individual tier, weekday slot → 7", () => {
    expect(advanceWindowDays("individual", "2026-04-06")).toBe(7);
  });
  it("individual tier, weekend slot → 3", () => {
    expect(advanceWindowDays("individual", "2026-04-04")).toBe(3);
  });
});

describe("advanceWindowEndDateKey", () => {
  it("teaching tier uses weekday (max) advance → today + 13", () => {
    expect(advanceWindowEndDateKey("2026-04-01", "teaching")).toBe("2026-04-14");
  });
  it("individual tier uses weekday (max) advance → today + 6", () => {
    expect(advanceWindowEndDateKey("2026-04-01", "individual")).toBe("2026-04-07");
  });
});

describe("quota by tier (single bucket)", () => {
  it("individual tier uses personal caps", () => {
    const q = getQuotaNumericLimits("individual", sampleNums);
    expect(q.dailyMax).toBe(5);
    expect(q.rollingMax).toBe(7);
  });
  it("teaching tier uses teaching caps", () => {
    const q = getQuotaNumericLimits("teaching", sampleNums);
    expect(q.dailyMax).toBe(8);
    expect(q.rollingMax).toBe(16);
  });
});

describe("cooldown", () => {
  it("blocks within 3 hours of last booking", () => {
    const now = new Date("2026-04-01T14:30:00.000Z");
    const last = new Date(now.getTime() - 2 * 60 * 60 * 1000);
    expect(() => assertCooldownAllowsBooking(last, now)).toThrow(BookingRuleError);
  });

  it("allows after 3 hours", () => {
    const now = new Date("2026-04-01T14:30:00.000Z");
    const last = new Date(now.getTime() - BOOKING_COOLDOWN_MS - 1000);
    expect(() => assertCooldownAllowsBooking(last, now)).not.toThrow();
  });

  it("allows when no prior booking", () => {
    const now = new Date();
    expect(() => assertCooldownAllowsBooking(null, now)).not.toThrow();
  });
});

describe("booking identity resolution", () => {
  it("dual user must supply identity", () => {
    expect(() =>
      resolveBookingIdentityTypeOrThrow(true, true, undefined)
    ).toThrow(BookingRuleError);
  });

  it("dual user individual choice", () => {
    expect(resolveBookingIdentityTypeOrThrow(true, true, "individual")).toBe("individual");
  });

  it("dual user teaching choice", () => {
    expect(resolveBookingIdentityTypeOrThrow(true, true, "teaching_or_with_students")).toBe(
      "teaching_or_with_students"
    );
  });

  it("single individual ignores wrong teaching request", () => {
    expect(() =>
      resolveBookingIdentityTypeOrThrow(true, false, "teaching_or_with_students")
    ).toThrow(BookingRuleError);
  });

  it("single individual infers", () => {
    expect(resolveBookingIdentityTypeOrThrow(true, false, undefined)).toBe("individual");
  });

  it("single teaching infers", () => {
    expect(resolveBookingIdentityTypeOrThrow(false, true, undefined)).toBe(
      "teaching_or_with_students"
    );
  });
});

describe("registration profile derivation (import side)", () => {
  it("teacher referred keeps individual quota tier", async () => {
    const { deriveRegistrationProfile } = await import("@/lib/registration/profile-kind");
    const d = deriveRegistrationProfile("teacher_referred_student");
    expect(d.quotaTier).toBe("individual");
    expect(d.teacherRecommended).toBe(true);
    expect(d.individualEligible).toBe(true);
    expect(d.teachingEligible).toBe(false);
  });

  it("dual uses teaching quota tier", async () => {
    const { deriveRegistrationProfile } = await import("@/lib/registration/profile-kind");
    const d = deriveRegistrationProfile("dual_practice_and_teaching");
    expect(d.quotaTier).toBe("teaching");
    expect(d.individualEligible).toBe(true);
    expect(d.teachingEligible).toBe(true);
  });
});
