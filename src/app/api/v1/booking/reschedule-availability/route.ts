import { jsonError, jsonOk } from "@/lib/api-response";
import { requireUserSession } from "@/lib/auth/require-session";
import {
  effectiveCapacityTotalForSlot,
  isSlotDateWithinRollingWindow,
  loadSlotUsageCountsDbExcludingRequest,
  rollingWindowEndDateKey,
} from "@/lib/booking/booking-rules";
import { parseCampaignDateKeys } from "@/lib/booking/settings";
import { parseBookingVenueQuery, userMayAccessBookingVenue } from "@/lib/booking/venue-kind";
import { hkDayEndUtc, hkDayStartUtc } from "@/lib/booking/hk-dates";
import { prisma } from "@/lib/prisma";
import { getAllSettings, getEffectiveNow } from "@/lib/settings";
import { apiBilingual } from "@/lib/i18n/api-bilingual";
import { serverLocaleFromCookies } from "@/lib/i18n/server-translate";
import { hkDateKey } from "@/lib/time";

const ymd = /^\d{4}-\d{2}-\d{2}$/;

export async function GET(req: Request) {
  const auth = await requireUserSession();
  if (!auth.ok) return auth.response;

  const url = new URL(req.url);
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  if (!from || !to || !ymd.test(from) || !ymd.test(to)) {
    return jsonError(
      "VALIDATION_ERROR",
      "Query from and to required as yyyy-MM-dd (Hong Kong calendar day)",
      400
    );
  }

  const venueKind = parseBookingVenueQuery(url.searchParams.get("venue"));
  const excludeRequestId = url.searchParams.get("excludeRequestId")?.trim() || null;
  if (!excludeRequestId) {
    return jsonError("VALIDATION_ERROR", "excludeRequestId is required", 400);
  }

  const locale = await serverLocaleFromCookies();
  const user = await prisma.user.findUnique({
    where: { id: auth.userId },
    include: { profile: true },
  });
  if (!user?.profile || !userMayAccessBookingVenue(user.profile.bookingVenueKind, venueKind)) {
    return jsonError(
      "FORBIDDEN",
      apiBilingual(locale, "此帳戶不可使用此預約通道", "This account cannot use this booking channel."),
      403
    );
  }

  const owned = await prisma.bookingRequest.findFirst({
    where: { id: excludeRequestId, userId: auth.userId },
    select: { id: true },
  });
  if (!owned) {
    return jsonError(
      "FORBIDDEN",
      apiBilingual(
        locale,
        "只可查閱與自己預約相關的時段庫存",
        "You can only load availability for your own booking."
      ),
      403
    );
  }

  const reqStart = hkDayStartUtc(from);
  const reqEnd = hkDayEndUtc(to);
  if (reqEnd < reqStart) {
    return jsonError("VALIDATION_ERROR", "to must be on or after from", 400);
  }

  const now = await getEffectiveNow();
  const todayKey = hkDateKey(now);
  const settings = await getAllSettings();
  const { startKey, endKey } = parseCampaignDateKeys(settings);

  let rangeFrom = todayKey;
  let rangeTo = rollingWindowEndDateKey(todayKey);
  if (startKey && endKey) {
    if (rangeFrom < startKey) rangeFrom = startKey;
    if (rangeTo > endKey) rangeTo = endKey;
  }

  const fromEff = from > rangeFrom ? from : rangeFrom;
  const toEff = to < rangeTo ? to : rangeTo;

  const bookableDateRange = { from: rangeFrom, to: rangeTo };

  if (fromEff > toEff) {
    return jsonOk({
      venueKind,
      excludeRequestId,
      bookableDateRange,
      slots: [],
    });
  }

  const start = hkDayStartUtc(fromEff);
  const end = hkDayEndUtc(toEff);

  const rawSlots = await prisma.bookingSlot.findMany({
    where: {
      venueKind,
      startsAt: { gte: start, lte: end },
    },
    orderBy: { startsAt: "asc" },
  });

  const slots = rawSlots.filter((s) => {
    const sk = hkDateKey(s.startsAt);
    if (startKey && endKey && (sk < startKey || sk > endKey)) return false;
    return isSlotDateWithinRollingWindow(todayKey, sk);
  });

  const ids = slots.map((s) => s.id);
  const usage = await loadSlotUsageCountsDbExcludingRequest(
    prisma,
    ids,
    excludeRequestId
  );

  return jsonOk({
    venueKind,
    excludeRequestId,
    bookableDateRange,
    slots: slots.map((s) => {
      const booked = usage.get(s.id) ?? 0;
      const cap = effectiveCapacityTotalForSlot(s);
      const remaining = Math.max(0, cap - booked);
      return {
        id: s.id,
        startsAt: s.startsAt.toISOString(),
        endsAt: s.endsAt.toISOString(),
        capacityTotal: cap,
        bookedCount: booked,
        remaining,
        venueLabel: s.venueLabel,
        venueKind: s.venueKind,
        isOpen: s.isOpen,
      };
    }),
  });
}
