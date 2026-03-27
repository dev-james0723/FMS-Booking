import { describe, expect, it } from "vitest";
import { BookingRuleError } from "@/lib/booking/booking-errors";
import { BOOKING_COOLDOWN_MS } from "@/lib/booking/booking-constants";
import {
  assertCooldownAllowsBooking,
  getQuotaNumericLimits,
  isSlotDateWithinRollingWindow,
  resolveBookingIdentityTypeOrThrow,
  rollingWindowEndDateKey,
} from "@/lib/booking/booking-rules";
import type { BookingNumericSettings } from "@/lib/booking/settings";

const sampleNums: BookingNumericSettings = {
  personalMaxPerDay: 5,
  personalMaxRolling3d: 7,
  teachingMaxPerDay: 8,
  teachingMaxRolling3d: 16,
  maxAdvanceDays: 2,
};

describe("rolling window", () => {
  it("allows today and the next two HK calendar days when window is 3", () => {
    expect(isSlotDateWithinRollingWindow("2026-04-01", "2026-04-01")).toBe(true);
    expect(isSlotDateWithinRollingWindow("2026-04-01", "2026-04-02")).toBe(true);
    expect(isSlotDateWithinRollingWindow("2026-04-01", "2026-04-03")).toBe(true);
    expect(isSlotDateWithinRollingWindow("2026-04-01", "2026-04-04")).toBe(false);
  });

  it("rejects past dates", () => {
    expect(isSlotDateWithinRollingWindow("2026-04-02", "2026-04-01")).toBe(false);
  });

  it("rollingWindowEndDateKey spans window-1 days from today", () => {
    expect(rollingWindowEndDateKey("2026-04-01")).toBe("2026-04-03");
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
