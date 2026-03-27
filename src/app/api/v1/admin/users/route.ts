import { jsonError, jsonOk } from "@/lib/api-response";
import { requireAdminSession } from "@/lib/auth/require-admin";
import {
  cooldownRemainingMs,
  getQuotaNumericLimits,
} from "@/lib/booking/booking-rules";
import { loadExistingDayCountsBulk } from "@/lib/booking/day-counts";
import { maxRollingThreeDaySum } from "@/lib/booking/hk-dates";
import { parseBookingNumericSettings } from "@/lib/booking/settings";
import { prisma } from "@/lib/prisma";
import { getEffectiveNow, getAllSettings } from "@/lib/settings";
import { hkDateKey } from "@/lib/time";
import { BOOKING_COOLDOWN_MS } from "@/lib/booking/booking-constants";
import { adminUserInstrumentCategoryZh } from "@/lib/admin/user-instrument-category";

function asStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is string => typeof x === "string");
}

export async function GET() {
  try {
    const auth = await requireAdminSession();
    if (!auth.ok) return auth.response;

    const rows = await prisma.user.findMany({
      where: {
        OR: [{ hasCompletedRegistration: true }, { profile: { isNot: null } }],
      },
      orderBy: { createdAt: "desc" },
      take: 500,
      include: {
        profile: true,
        category: true,
        bookingRequests: {
          orderBy: { requestedAt: "desc" },
          include: {
            allocations: {
              orderBy: { slot: { startsAt: "asc" } },
              include: { slot: true },
            },
          },
        },
      },
    });

    const bulkCounts = await loadExistingDayCountsBulk(rows.map((r) => r.id));
    const now = await getEffectiveNow();
    const settings = await getAllSettings();
    const nums = parseBookingNumericSettings(settings);
    const todayKey = hkDateKey(now);

    return jsonOk({
      users: rows.map((u) => {
        const p = u.profile;
        const dayCounts = bulkCounts.get(u.id) ?? new Map();
        const rollingSum = maxRollingThreeDaySum(dayCounts);
        const { dailyMax, rollingMax } = getQuotaNumericLimits(u.quotaTier, nums);
        const todayCommitted = dayCounts.get(todayKey) ?? 0;
        const cdMs = cooldownRemainingMs(u.lastBookingAt, now);
        const nextBook =
          cdMs > 0 && u.lastBookingAt
            ? new Date(u.lastBookingAt.getTime() + BOOKING_COOLDOWN_MS).toISOString()
            : null;

        return {
          id: u.id,
          email: u.email,
          createdAt: u.createdAt.toISOString(),
          quotaTier: u.quotaTier,
          lastBookingAt: u.lastBookingAt?.toISOString() ?? null,
          cooldown: {
            active: cdMs > 0,
            remainingMs: cdMs,
            nextBookingAt: nextBook,
          },
          bookingUsage: {
            todayKey,
            todayCommitted,
            dailyMax,
            rollingSum,
            rollingMax,
          },
          category: u.category
            ? { code: u.category.code, nameZh: u.category.nameZh }
            : null,
          profile: p
            ? {
                nameZh: p.nameZh,
                nameEn: p.nameEn,
                phone: p.phone,
                age: p.age,
                instrumentField: p.instrumentField,
                bookingVenueKind: p.bookingVenueKind,
                instrumentCategoryZh: adminUserInstrumentCategoryZh(
                  p.bookingVenueKind,
                  p.instrumentField
                ),
                identityLabels: asStringArray(p.identityFlags as unknown),
                identityOtherText: p.identityOtherText,
                preferredDates: asStringArray(p.preferredDates as unknown),
                preferredTimeText: p.preferredTimeText,
                extraNotes: p.extraNotes,
                teacherRecommended: p.teacherRecommended,
                teacherName: p.teacherName,
                teacherContact: p.teacherContact,
                individualEligible: p.individualEligible,
                teachingEligible: p.teachingEligible,
              }
            : null,
          bookingRequests: u.bookingRequests.map((br) => ({
            id: br.id,
            status: br.status,
            requestedAt: br.requestedAt.toISOString(),
            venueKind: br.venueKind,
            bookingIdentityType: br.bookingIdentityType,
            slotCount: br.allocations.length,
            slots: br.allocations.map((a) => ({
              id: a.slot.id,
              startsAt: a.slot.startsAt.toISOString(),
              endsAt: a.slot.endsAt.toISOString(),
              venueLabel: a.slot.venueLabel,
              venueKind: a.slot.venueKind,
              allocationStatus: a.status,
            })),
          })),
        };
      }),
    });
  } catch (e) {
    console.error("[admin/users GET]", e);
    const raw = e instanceof Error ? e.message : "Failed to load users";
    const message =
      raw.includes("__TURBOPACK__") || raw.includes("$5b$project$5d")
        ? "無法載入用戶列表：資料庫結構可能未更新，請在伺服器執行 prisma migrate deploy 後重試。"
        : raw;
    return jsonError("ADMIN_USERS_FAILED", message, 500);
  }
}
