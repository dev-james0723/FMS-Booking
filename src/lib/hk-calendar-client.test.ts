import { describe, expect, it } from "vitest";
import { isHkDayBookable } from "@/lib/hk-calendar-client";

describe("isHkDayBookable", () => {
  const start = "2026-04-03";
  const end = "2026-05-03";

  it("allows weekday within weekday window", () => {
    // 2026-04-06 is Monday, 3 days from 2026-04-03 (Friday, today)
    expect(
      isHkDayBookable({
        dateKey: "2026-04-06",
        todayKey: "2026-04-03",
        campaignStart: start,
        campaignEnd: end,
        weekdayDays: 7,
        weekendDays: 3,
      })
    ).toBe(true);
  });

  it("rejects weekday beyond weekday window", () => {
    // 2026-04-10 is Friday, 7 days from 2026-04-03 → apart=7, window=7 → false (not <7)
    expect(
      isHkDayBookable({
        dateKey: "2026-04-10",
        todayKey: "2026-04-03",
        campaignStart: start,
        campaignEnd: end,
        weekdayDays: 7,
        weekendDays: 3,
      })
    ).toBe(false);
  });

  it("allows weekend within weekend window", () => {
    // 2026-04-04 is Saturday, 1 day from today 2026-04-03
    expect(
      isHkDayBookable({
        dateKey: "2026-04-04",
        todayKey: "2026-04-03",
        campaignStart: start,
        campaignEnd: end,
        weekdayDays: 7,
        weekendDays: 3,
      })
    ).toBe(true);
  });

  it("rejects weekend beyond weekend window", () => {
    // 2026-04-11 is Saturday, 8 days from 2026-04-03 → weekendDays=3 → false
    expect(
      isHkDayBookable({
        dateKey: "2026-04-11",
        todayKey: "2026-04-03",
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
        dateKey: "2026-04-02",
        todayKey: "2026-04-03",
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
        dateKey: "2026-04-02",
        todayKey: "2026-03-30",
        campaignStart: start,
        campaignEnd: end,
        weekdayDays: 14,
        weekendDays: 7,
      })
    ).toBe(false);
  });

  it("teaching tier: weekend 7 days ahead allowed", () => {
    // 2026-04-12 is Sunday, 9 days from 2026-04-03 → weekendDays=7 → false
    expect(
      isHkDayBookable({
        dateKey: "2026-04-12",
        todayKey: "2026-04-03",
        campaignStart: start,
        campaignEnd: end,
        weekdayDays: 14,
        weekendDays: 7,
      })
    ).toBe(false);

    // 2026-04-05 is Sunday, 2 days from 2026-04-03 → weekendDays=7 → true
    expect(
      isHkDayBookable({
        dateKey: "2026-04-05",
        todayKey: "2026-04-03",
        campaignStart: start,
        campaignEnd: end,
        weekdayDays: 14,
        weekendDays: 7,
      })
    ).toBe(true);
  });
});
