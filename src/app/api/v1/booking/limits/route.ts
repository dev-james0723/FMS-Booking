import { jsonError, jsonOk } from "@/lib/api-response";
import { requireUserSession } from "@/lib/auth/require-session";
import { loadUserExistingDayCounts } from "@/lib/booking/day-counts";
import {
  BOOKING_COOLDOWN_MS,
  ROLLING_WINDOW_CALENDAR_DAYS,
} from "@/lib/booking/booking-constants";
import {
  cooldownRemainingMs,
  getQuotaNumericLimits,
  rollingWindowEndDateKey,
} from "@/lib/booking/booking-rules";
import { hkCalendarDaysBetween, maxRollingThreeDaySum } from "@/lib/booking/hk-dates";
import {
  parseBookingNumericSettings,
  parseCampaignDateKeys,
} from "@/lib/booking/settings";
import { getEffectiveNow, getAllSettings } from "@/lib/settings";
import { hkDateKey } from "@/lib/time";
import { prisma } from "@/lib/prisma";

function mergeDayCounts(
  base: Map<string, number>,
  extraDates: string[]
): Map<string, number> {
  const m = new Map(base);
  for (const d of extraDates) {
    m.set(d, (m.get(d) ?? 0) + 1);
  }
  return m;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(req: Request) {
  const auth = await requireUserSession();
  if (!auth.ok) return auth.response;

  const url = new URL(req.url);
  const extraRaw = url.searchParams.get("extra") ?? "";
  const extraIds = extraRaw
    .split(",")
    .map((s) => s.trim())
    .filter((s) => UUID_RE.test(s));

  const user = await prisma.user.findUnique({
    where: { id: auth.userId },
    include: { profile: true, category: true },
  });
  if (!user) {
    return jsonError("NOT_FOUND", "User not found", 404);
  }

  const settings = await getAllSettings();
  const nums = parseBookingNumericSettings(settings);
  const { startKey, endKey } = parseCampaignDateKeys(settings);
  const now = await getEffectiveNow();
  const todayKey = hkDateKey(now);

  const quotaTier = user.quotaTier;
  const { dailyMax, rollingMax } = getQuotaNumericLimits(quotaTier, nums);

  const existing = await loadUserExistingDayCounts(auth.userId);
  const extraSlots =
    extraIds.length > 0
      ? await prisma.bookingSlot.findMany({ where: { id: { in: extraIds } } })
      : [];
  const extraDayKeys = extraSlots.map((s) => hkDateKey(s.startsAt));
  const withExtra = mergeDayCounts(existing, extraDayKeys);

  let firstViolatingDate: string | null = null;
  for (const [day, n] of withExtra) {
    if (startKey && endKey && (day < startKey || day > endKey)) continue;
    if (n > dailyMax) {
      firstViolatingDate = day;
      break;
    }
  }

  const rollingSum = maxRollingThreeDaySum(withExtra);
  const wouldExceedRolling = rollingSum > rollingMax;

  const todayCommitted = existing.get(todayKey) ?? 0;
  const todayAfterExtra = withExtra.get(todayKey) ?? 0;

  const profile = user.profile;
  const dualEligible =
    profile != null && profile.individualEligible && profile.teachingEligible;

  let rollingEndKey = rollingWindowEndDateKey(todayKey);
  let rollingStartKey = todayKey;
  let rollingCalendarDays = ROLLING_WINDOW_CALENDAR_DAYS;
  if (startKey && endKey) {
    if (todayKey > endKey) {
      rollingStartKey = endKey;
      rollingEndKey = endKey;
      rollingCalendarDays = 1;
    } else if (todayKey < startKey) {
      rollingStartKey = startKey;
      rollingEndKey = rollingWindowEndDateKey(startKey);
      if (rollingEndKey > endKey) rollingEndKey = endKey;
      rollingCalendarDays = hkCalendarDaysBetween(rollingStartKey, rollingEndKey) + 1;
    } else {
      if (rollingEndKey > endKey) rollingEndKey = endKey;
      rollingCalendarDays = hkCalendarDaysBetween(rollingStartKey, rollingEndKey) + 1;
    }
  }
  const cooldownRemaining = cooldownRemainingMs(user.lastBookingAt, now);
  const cooldownActive = cooldownRemaining > 0;
  const nextBookingAt =
    cooldownActive && user.lastBookingAt
      ? new Date(user.lastBookingAt.getTime() + BOOKING_COOLDOWN_MS).toISOString()
      : null;

  return jsonOk({
    quotaTier,
    tier: quotaTier === "teaching" ? "teaching" : "individual",
    limits: { dailyMax, rollingMax },
    todayKey,
    rollingWindow: {
      calendarDays: rollingCalendarDays,
      startKey: rollingStartKey,
      endKey: rollingEndKey,
    },
    eligibility: profile
      ? {
          individualEligible: profile.individualEligible,
          teachingEligible: profile.teachingEligible,
          dualEligible,
        }
      : null,
    cooldown: {
      active: cooldownActive,
      remainingMs: cooldownRemaining,
      nextBookingAt,
    },
    countsByDay: Object.fromEntries(existing),
    todayCommitted,
    todayRemaining: Math.max(0, dailyMax - todayCommitted),
    rollingSumCommitted: maxRollingThreeDaySum(existing),
    provisional: {
      slotIds: extraIds,
      todayAfterExtra,
      todayRemainingAfter: Math.max(0, dailyMax - todayAfterExtra),
      rollingSum,
      wouldExceedDaily: firstViolatingDate !== null,
      wouldExceedRolling,
      firstViolatingDate,
    },
  });
}
