import { customAlphabet } from "nanoid";
import type { Prisma, PrismaClient } from "@prisma/client";
import { BonusRewardSource, ReferralStatus } from "@prisma/client";

const genReferralCode = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyz", 12);

export async function findReferralCodeByRaw(
  db: PrismaClient | Prisma.TransactionClient,
  raw: string
): Promise<{ id: string; code: string; ambassadorUserId: string } | null> {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const row = await db.referralCode.findFirst({
    where: { code: { equals: trimmed, mode: "insensitive" } },
    select: { id: true, code: true, ambassadorUserId: true },
  });
  return row;
}

export async function ensureAmbassadorReferralCode(
  db: PrismaClient,
  ambassadorUserId: string
): Promise<{ code: string }> {
  const existing = await db.referralCode.findFirst({
    where: { ambassadorUserId },
    orderBy: { createdAt: "asc" },
    select: { code: true },
  });
  if (existing) return existing;

  for (let i = 0; i < 8; i++) {
    const code = genReferralCode();
    try {
      await db.referralCode.create({
        data: { ambassadorUserId, code },
      });
      return { code };
    } catch (e: unknown) {
      const err = e as { code?: string };
      if (err.code === "P2002") continue;
      throw e;
    }
  }
  throw new Error("REFERRAL_CODE_ALLOC_FAILED");
}

function ambassadorBonusCap(settings: Record<string, unknown>): number {
  const v = settings["ambassador_bonus_slot_cap_per_user"];
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n) || n < 0) return 25;
  return Math.floor(n);
}

/**
 * After a new user row exists: attach referral, grant ambassador bonus (capped).
 * `resolved` must be a real row where ambassador ≠ new user.
 */
export async function finalizeAmbassadorReferralForNewUser(
  tx: Prisma.TransactionClient,
  settings: Record<string, unknown>,
  newUserId: string,
  resolved: { id: string; code: string; ambassadorUserId: string }
): Promise<void> {
  if (resolved.ambassadorUserId === newUserId) return;

  const dup = await tx.referral.findFirst({
    where: { referralCodeId: resolved.id, refereeUserId: newUserId },
    select: { id: true },
  });
  if (dup) return;

  const referralRow = await tx.referral.create({
    data: {
      referralCodeId: resolved.id,
      refereeUserId: newUserId,
      status: ReferralStatus.registered,
    },
  });

  const cap = ambassadorBonusCap(settings);
  const granted = await tx.ambassadorReward.count({
    where: { ambassadorUserId: resolved.ambassadorUserId },
  });
  if (granted >= cap) return;

  const bonus = await tx.bonusReward.create({
    data: {
      userId: resolved.ambassadorUserId,
      source: BonusRewardSource.ambassador_referral,
      slotsGranted: 1,
      slotsRemaining: 1,
      meta: {
        referralCode: resolved.code,
        refereeUserId: newUserId,
        referralId: referralRow.id,
      } as Prisma.InputJsonValue,
    },
  });

  await tx.ambassadorReward.create({
    data: {
      ambassadorUserId: resolved.ambassadorUserId,
      referralId: referralRow.id,
      bonusRewardId: bonus.id,
    },
  });
}

export async function resolveReferrerDisplayForUser(
  db: PrismaClient,
  referralAttributionCode: string | null
): Promise<string | null> {
  if (!referralAttributionCode?.trim()) return null;
  const rc = await findReferralCodeByRaw(db, referralAttributionCode);
  if (!rc) return null;
  const profile = await db.userProfile.findUnique({
    where: { userId: rc.ambassadorUserId },
    select: { nameZh: true },
  });
  return profile?.nameZh?.trim() || null;
}
