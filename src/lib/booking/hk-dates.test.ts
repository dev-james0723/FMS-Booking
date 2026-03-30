import { describe, expect, it } from "vitest";
import { bookableHeadroomForHkDay, maxRollingThreeDaySum } from "@/lib/booking/hk-dates";

describe("bookableHeadroomForHkDay", () => {
  const dailyMax = 8;
  const rollingMax = 16;

  it("returns 0 when every 3-day window containing today is at rolling cap even if daily headroom remains", () => {
    const counts = new Map<string, number>([
      ["2026-04-01", 5],
      ["2026-04-02", 5],
      ["2026-04-03", 6],
    ]);
    expect(maxRollingThreeDaySum(counts)).toBe(16);
    expect(bookableHeadroomForHkDay(counts, "2026-04-03", dailyMax, rollingMax)).toBe(0);
    expect(8 - (counts.get("2026-04-03") ?? 0)).toBe(2);
  });

  it("allows bookings today when peak 3-day sum uses past days but windows containing today still have headroom", () => {
    const counts = new Map<string, number>([
      ["2026-04-01", 5],
      ["2026-04-02", 5],
      ["2026-04-03", 6],
      ["2026-04-04", 0],
    ]);
    expect(maxRollingThreeDaySum(counts)).toBe(16);
    expect(bookableHeadroomForHkDay(counts, "2026-04-04", dailyMax, rollingMax)).toBe(5);
  });

  it("respects daily cap when rolling allows more", () => {
    const counts = new Map<string, number>([["2026-04-10", 7]]);
    expect(bookableHeadroomForHkDay(counts, "2026-04-10", dailyMax, rollingMax)).toBe(1);
  });
});
