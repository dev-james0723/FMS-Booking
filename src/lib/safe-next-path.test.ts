import { describe, expect, it } from "vitest";
import { safeAdminNextPath, safeNextPath } from "./safe-next-path";

describe("safeNextPath", () => {
  it("allows internal paths", () => {
    expect(safeNextPath("/account", "/x")).toBe("/account");
    expect(safeNextPath("/booking/calendar", "/x")).toBe("/booking/calendar");
  });

  it("rejects open redirects", () => {
    expect(safeNextPath("//evil.com", "/x")).toBe("/x");
    expect(safeNextPath("https://evil.com", "/x")).toBe("/x");
    expect(safeNextPath("/\\evil", "/x")).toBe("/x");
    expect(safeNextPath("javascript:alert(1)", "/x")).toBe("/x");
  });

  it("uses fallback for null", () => {
    expect(safeNextPath(null, "/home")).toBe("/home");
  });
});

describe("safeAdminNextPath", () => {
  it("allows /admin only", () => {
    expect(safeAdminNextPath("/admin/users", "/admin/bookings")).toBe("/admin/users");
  });

  it("rejects non-admin paths", () => {
    expect(safeAdminNextPath("/account", "/admin/bookings")).toBe("/admin/bookings");
  });
});
