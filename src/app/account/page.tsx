import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AccountDbUnavailable } from "@/components/account-db-unavailable";
import { AccountPageView } from "@/components/account-page-view";
import { getSessionFromCookies } from "@/lib/auth/session";
import { accountSharedQuotaVenuesNote } from "@/lib/i18n/account-page-heading";
import { localeFromCookieValue } from "@/lib/i18n/locale-cookie";
import { FMS_LOCALE_STORAGE_KEY } from "@/lib/i18n/types";
import { loadUserExistingDayCounts } from "@/lib/booking/day-counts";
import { maxRollingThreeDaySum } from "@/lib/booking/hk-dates";
import { getQuotaNumericLimits } from "@/lib/booking/booking-rules";
import { parseBookingNumericSettings } from "@/lib/booking/settings";
import { prisma } from "@/lib/prisma";
import { resolveReferrerDisplayForUser } from "@/lib/referral/ambassador";
import {
  getAmbassadorReferralPayloadForUser,
  type AmbassadorReferralPayload,
} from "@/lib/referral/ambassador-referral-payload";
import { getAllSettings, getEffectiveNow } from "@/lib/settings";
import { isUserFacingDbLoadFailure } from "@/lib/prisma-user-facing-errors";
import { hkDateKey } from "@/lib/time";
import type { Prisma } from "@prisma/client";

export const metadata = {
  title: "我的帳戶｜D Festival × 幻樂空間",
};

function preferredDateIsos(raw: Prisma.JsonValue | null | undefined): string[] {
  if (raw == null || !Array.isArray(raw)) return [];
  return raw.filter((x): x is string => typeof x === "string");
}

function identityKeys(raw: Prisma.JsonValue | null | undefined): string[] {
  if (raw == null || !Array.isArray(raw)) return [];
  return raw.filter((x): x is string => typeof x === "string");
}

/** Greedy split of `rollingMax` across three consecutive HK days, each ≤ `dailyMax`. */
function threeDayRollingSplit(
  dailyMax: number,
  rollingMax: number
): [number, number, number] | null {
  if (rollingMax > 3 * dailyMax) return null;
  const a = Math.min(dailyMax, rollingMax);
  const rem = rollingMax - a;
  const b = Math.min(dailyMax, rem);
  const c = rem - b;
  if (c > dailyMax) return null;
  return [a, b, c];
}

function rollingFailExtra(
  tri: [number, number, number],
  dailyMax: number
): { next: [number, number, number]; idx: 0 | 1 | 2 } {
  const [a, b, c] = tri;
  if (c < dailyMax) return { next: [a, b, c + 1], idx: 2 };
  if (b < dailyMax) return { next: [a, b + 1, c], idx: 1 };
  if (a < dailyMax) return { next: [a + 1, b, c], idx: 0 };
  return { next: [a + 1, b, c], idx: 0 };
}

function passRollingExample(
  dailyMax: number,
  rollingMax: number
): { tri0: [number, number, number]; tri1: [number, number, number]; sumAfter: number } | null {
  const pre = rollingMax - 2;
  if (pre < 0) return null;
  const capThird = dailyMax - 1;
  for (let c = Math.min(capThird, pre); c >= 0; c--) {
    const rem = pre - c;
    if (rem > 2 * dailyMax) continue;
    const a = Math.min(dailyMax, rem);
    const b = rem - a;
    if (b < 0 || b > dailyMax) continue;
    const tri0: [number, number, number] = [a, b, c];
    const tri1: [number, number, number] = [a, b, c + 1];
    const sumAfter = tri1[0] + tri1[1] + tri1[2];
    if (sumAfter <= rollingMax) return { tri0, tri1, sumAfter };
  }
  return null;
}

function buildRollingLimitNarrative(
  dailyMax: number,
  rollingMax: number
): {
  fail: {
    tri: [number, number, number];
    next: [number, number, number];
    extraIdx: 0 | 1 | 2;
    sumAfter: number;
  };
  pass: { tri0: [number, number, number]; tri1: [number, number, number]; sumAfter: number };
} | null {
  if (rollingMax < 2 || dailyMax < 1) return null;
  const tri = threeDayRollingSplit(dailyMax, rollingMax);
  if (!tri) return null;
  const { next, idx } = rollingFailExtra(tri, dailyMax);
  const sumAfter = next[0] + next[1] + next[2];
  if (sumAfter <= rollingMax) return null;

  const pass = passRollingExample(dailyMax, rollingMax);
  if (!pass) return null;

  return {
    fail: { tri, next, extraIdx: idx, sumAfter },
    pass,
  };
}

export default async function AccountPage() {
  const session = await getSessionFromCookies();
  if (!session) redirect("/login?next=/account");

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.sub },
      include: { profile: true, category: true },
    });
    if (!user?.profile) redirect("/login?next=/account");

    const settings = await getAllSettings();
    const now = await getEffectiveNow();
    const nums = parseBookingNumericSettings(settings);

    const { dailyMax, rollingMax } = getQuotaNumericLimits(user.quotaTier, nums);
    const todayKey = hkDateKey(now);
    const existingDayCounts = await loadUserExistingDayCounts(user.id);
    const todayCommitted = existingDayCounts.get(todayKey) ?? 0;
    const todayRemaining = Math.max(0, dailyMax - todayCommitted);
    const rollingUsed = maxRollingThreeDaySum(existingDayCounts);
    const rollingStory = buildRollingLimitNarrative(dailyMax, rollingMax);

    const referrerNameZh = await resolveReferrerDisplayForUser(
      prisma,
      user.referralAttributionCode
    );

    let ambassadorReferralInitial: AmbassadorReferralPayload | null = null;
    if (user.profile.wantsAmbassador === true) {
      try {
        ambassadorReferralInitial = await getAmbassadorReferralPayloadForUser(prisma, user.id);
      } catch (e) {
        console.error("[account/page] ambassador referral preload", e);
        ambassadorReferralInitial = null;
      }
    }

    const jar = await cookies();
    const pageLocale = localeFromCookieValue(jar.get(FMS_LOCALE_STORAGE_KEY)?.value);
    const sharedQuotaVenuesNote =
      user.profile.bookingVenueKind === "studio_room"
        ? accountSharedQuotaVenuesNote(pageLocale)
        : null;

    return (
      <AccountPageView
        nameZh={user.profile.nameZh}
        email={user.email}
        phone={user.profile.phone}
        bookingVenueKind={user.profile.bookingVenueKind}
        instrumentField={user.profile.instrumentField}
        userCategoryCode={user.category?.code ?? null}
        identityKeys={identityKeys(user.profile.identityFlags)}
        preferredDateIsos={preferredDateIsos(user.profile.preferredDates)}
        preferredTimeText={user.profile.preferredTimeText}
        wantsConsecutiveSlots={user.profile.wantsConsecutiveSlots}
        quotaTier={user.quotaTier}
        dailyMax={dailyMax}
        rollingMax={rollingMax}
        todayKey={todayKey}
        todayCommitted={todayCommitted}
        todayRemaining={todayRemaining}
        rollingUsed={rollingUsed}
        rollingStory={rollingStory}
        referrerNameZh={referrerNameZh}
        wantsAmbassador={user.profile.wantsAmbassador === true}
        ambassadorReferralInitial={
          user.profile.wantsAmbassador === true ? ambassadorReferralInitial : undefined
        }
        sharedQuotaVenuesNote={sharedQuotaVenuesNote}
        accountCopyLocale={pageLocale}
      />
    );
  } catch (e) {
    if (isUserFacingDbLoadFailure(e)) {
      console.error("[account/page] db load failure", e);
      return <AccountDbUnavailable email={session.email} />;
    }
    throw e;
  }
}
