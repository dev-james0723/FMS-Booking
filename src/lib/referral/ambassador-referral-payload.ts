import type { PrismaClient } from "@prisma/client";
import { Prisma, ReferralStatus } from "@prisma/client";
import { appBasePath } from "@/lib/base-path";
import { ensureAmbassadorReferralCode } from "@/lib/referral/ambassador";
import { getWebAuthnSettingsForRequest } from "@/lib/webauthn/config";

export type AmbassadorReferralPayload = {
  code: string;
  shareUrl: string;
  stats: {
    linkOpens: number;
    registrations: number;
    rewardTimes: number;
    rewardBonusSlotsTotal: number;
  };
};

/** Integers safe for JSON (NaN/Infinity become 0 — JSON.stringify drops NaN otherwise). */
function statInt(n: unknown): number {
  const x = typeof n === "number" ? n : Number(n);
  if (!Number.isFinite(x)) return 0;
  return Math.max(0, Math.min(Math.trunc(x), 1_000_000_000));
}

/**
 * Build share URL + stats for an opted-in ambassador. Used by account API and account page RSC
 * so the UI does not rely solely on a client fetch (which can race or fail transiently).
 */
export async function getAmbassadorReferralPayloadForUser(
  db: PrismaClient,
  userId: string
): Promise<AmbassadorReferralPayload> {
  await ensureAmbassadorReferralCode(db, userId);
  const row = await db.referralCode.findFirst({
    where: { ambassadorUserId: userId },
    orderBy: { createdAt: "asc" },
    select: { id: true, code: true },
  });
  if (!row) {
    throw new Error("REFERRAL_CODE_ROW_MISSING");
  }

  /** Read via raw SQL so a stale generated client (missing `openCount` on ReferralCode) still works. */
  let linkOpens = 0;
  try {
    const openRows = await db.$queryRaw<Array<{ open_count: unknown }>>(
      Prisma.sql`SELECT open_count FROM referral_codes WHERE id = ${row.id} LIMIT 1`
    );
    linkOpens = statInt(openRows[0]?.open_count);
  } catch (e) {
    console.error("[ambassador-referral-payload] open_count read", e);
  }

  let registrationCount = 0;
  try {
    registrationCount = await db.referral.count({
      where: {
        referralCodeId: row.id,
        refereeUserId: { not: null },
        status: ReferralStatus.registered,
      },
    });
  } catch (e) {
    console.error("[ambassador-referral-payload] registration count", e);
  }

  let rewardTimes = 0;
  let rewardSlotsTotal = 0;
  try {
    const rewards = await db.ambassadorReward.findMany({
      where: { ambassadorUserId: userId },
      include: { bonusReward: { select: { slotsGranted: true } } },
    });
    rewardTimes = rewards.length;
    rewardSlotsTotal = rewards.reduce(
      (s, r) => s + statInt(r.bonusReward?.slotsGranted),
      0
    );
  } catch (e) {
    console.error("[ambassador-referral-payload] ambassador rewards", e);
  }

  const { origin } = await getWebAuthnSettingsForRequest();
  const base = appBasePath();
  const shareUrl = `${origin}${base}/?ref=${encodeURIComponent(row.code)}`;

  return {
    code: row.code,
    shareUrl,
    stats: {
      linkOpens,
      registrations: statInt(registrationCount),
      rewardTimes: statInt(rewardTimes),
      rewardBonusSlotsTotal: statInt(rewardSlotsTotal),
    },
  };
}

export function isAmbassadorDbSchemaMismatch(e: unknown): boolean {
  return e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2022";
}
