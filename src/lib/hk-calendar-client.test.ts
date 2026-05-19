import { describe, expect, it } from "vitest";
import { isHkDayBookable } from "@/lib/hk-calendar-client";

describe("isHkDayBookable", () => {
  const start = "2026-05-20";
  const end = "2026-06-15";

  it("allows weekday within weekday window", () => {
    // 2026-05-21 is Thursday, 1 day from 2026-05-20 (Wednesday, today)
    expect(
      isHkDayBookable({
        dateKey: "2026-05-21",
        todayKey: "2026-05-20",
        campaignStart: start,
        campaignEnd: end,
        weekdayDays: 7,
        weekendDays: 3,
      })
    ).toBe(true);
  });

  it("rejects weekday beyond weekday window", () => {
    // 2026-05-27 is Wednesday, 7 days from 2026-05-20 → apart=7, window=7 → false (not <7)
    expect(
      isHkDayBookable({
        dateKey: "2026-05-27",
        todayKey: "2026-05-20",
        campaignStart: start,
        campaignEnd: end,
        weekdayDays: 7,
        weekendDays: 3,
      })
    ).toBe(false);
  });

  it("allows weekend within weekend window", () => {
    // 2026-05-23 is Saturday, 1 day from 2026-05-22 (Friday, today)
    expect(
      isHkDayBookable({
        dateKey: "2026-05-23",
        todayKey: "2026-05-22",
        campaignStart: start,
        campaignEnd: end,
        weekdayDays: 7,
        weekendDays: 3,
      })
    ).toBe(true);
  });

  it("rejects weekend beyond weekend window", () => {
    // 2026-05-30 is Saturday, 10 days from 2026-05-20 → weekendDays=3 → false
    expect(
      isHkDayBookable({
        dateKey: "2026-05-30",
        todayKey: "2026-05-20",
        campaignStart: start,
        campaignEnd: end,
        weekdayDays: 7,
        weekendDays: 3,
      })
    ).toBe(false);
  });

  it("blocks days before today even in campaign", () => {
    expect(
      isHkDayBookable({
        dateKey: "2026-05-19",
        todayKey: "2026-05-20",
        campaignStart: start,
        campaignEnd: end,
        weekdayDays: 7,
        weekendDays: 3,
      })
    ).toBe(false);
  });

  it("blocks before campaign start", () => {
    expect(
      isHkDayBookable({
        dateKey: "2026-05-19",
        todayKey: "2026-05-10",
        campaignStart: start,
        campaignEnd: end,
        weekdayDays: 14,
        weekendDays: 7,
      })
    ).toBe(false);
  });

  it("teaching tier: weekend 7 days ahead allowed", () => {
    // 2026-05-31 is Sunday, 11 days from 2026-05-20 → weekendDays=7 → false
    expect(
      isHkDayBookable({
        dateKey: "2026-05-31",
        todayKey: "2026-05-20",
        campaignStart: start,
        campaignEnd: end,
        weekdayDays: 14,
        weekendDays: 7,
      })
    ).toBe(false);

    // 2026-05-25 is Sunday, 5 days from 2026-05-20 → weekendDays=7 → true
    expect(
      isHkDayBookable({
        dateKey: "2026-05-25",
        todayKey: "2026-05-20",
        campaignStart: start,
        campaignEnd: end,
        weekdayDays: 14,
        weekendDays: 7,
      })
    ).toBe(true);
  });
});
