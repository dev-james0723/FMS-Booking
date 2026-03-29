import { describe, expect, it } from "vitest";
import { isHkDayBookable } from "@/lib/hk-calendar-client";

describe("isHkDayBookable", () => {
  const start = "2026-04-03";
  const end = "2026-05-03";

  it("enforces rolling window (today + next 2 HK days)", () => {
    expect(
      isHkDayBookable({
        dateKey: "2026-04-05",
        todayKey: "2026-04-03",
        campaignStart: start,
        campaignEnd: end,
        rollingWindowCalendarDays: 3,
      })
    ).toBe(true);
    expect(
      isHkDayBookable({
        dateKey: "2026-04-06",
        todayKey: "2026-04-03",
        campaignStart: start,
        campaignEnd: end,
        rollingWindowCalendarDays: 3,
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
        rollingWindowCalendarDays: 3,
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
        rollingWindowCalendarDays: 3,
      })
    ).toBe(false);
  });
});
