import { jsonError, jsonOk } from "@/lib/api-response";
import { getSessionFromCookies } from "@/lib/auth/session";
import { appBasePath } from "@/lib/base-path";
import { prisma } from "@/lib/prisma";
import { ensureAmbassadorReferralCode } from "@/lib/referral/ambassador";
import { getWebAuthnSettingsForRequest } from "@/lib/webauthn/config";
import { Prisma } from "@prisma/client";

type ReferralStats = {
  linkOpens: number;
  registrations: number;
  rewardTimes: number;
  rewardBonusSlotsTotal: number;
};

async function ambassadorReferralPayload(userId: string): Promise<{
  code: string;
  shareUrl: string;
  stats: ReferralStats;
}> {
  await ensureAmbassadorReferralCode(prisma, userId);
  const row = await prisma.referralCode.findFirst({
    where: { ambassadorUserId: userId },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      code: true,
      openCount: true,
    },
  });
  if (!row) {
    throw new Error("REFERRAL_CODE_ROW_MISSING");
  }

  const registrationCount = await prisma.referral.count({
    where: {
      referralCodeId: row.id,
      refereeUserId: { not: null },
      status: "registered",
    },
  });

  const rewards = await prisma.ambassadorReward.findMany({
    where: { ambassadorUserId: userId },
    include: { bonusReward: { select: { slotsGranted: true } } },
  });
  const rewardTimes = rewards.length;
  const rewardSlotsTotal = rewards.reduce((s, r) => s + r.bonusReward.slotsGranted, 0);

  const { origin } = await getWebAuthnSettingsForRequest();
  const base = appBasePath();
  const shareUrl = `${origin}${base}/?ref=${encodeURIComponent(row.code)}`;

  return {
    code: row.code,
    shareUrl,
    stats: {
      linkOpens: row.openCount,
      registrations: registrationCount,
      rewardTimes,
      rewardBonusSlotsTotal: rewardSlotsTotal,
    },
  };
}

export async function GET() {
  const session = await getSessionFromCookies();
  if (!session) {
    return jsonError("UNAUTHORIZED", "Not logged in", 401);
  }

  const user = await prisma.user.findUnique({
    where: { id: session.sub },
    select: { profile: { select: { wantsAmbassador: true } } },
  });
  if (!user?.profile) {
    return jsonError("NOT_FOUND", "User not found", 404);
  }

  if (!user.profile.wantsAmbassador) {
    return jsonOk({ optedIn: false as const });
  }

  try {
    const body = await ambassadorReferralPayload(session.sub);
    return jsonOk({ optedIn: true as const, ...body });
  } catch (e) {
    console.error("[account/referral] GET ambassadorReferralPayload", e);
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2022") {
      return jsonError(
        "DB_SCHEMA_MISMATCH",
        "Database is missing referral columns (e.g. open_count). Run: npx prisma migrate deploy",
        503
      );
    }
    return jsonError("SERVER_ERROR", "Referral payload failed", 500);
  }
}

export async function POST() {
  const session = await getSessionFromCookies();
  if (!session) {
    return jsonError("UNAUTHORIZED", "Not logged in", 401);
  }

  const updated = await prisma.userProfile.updateMany({
    where: { userId: session.sub },
    data: { wantsAmbassador: true },
  });
  if (updated.count === 0) {
    return jsonError("NOT_FOUND", "User not found", 404);
  }

  try {
    const body = await ambassadorReferralPayload(session.sub);
    return jsonOk({ optedIn: true as const, ...body });
  } catch (e) {
    console.error("[account/referral] POST ambassadorReferralPayload", e);
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2022") {
      return jsonError(
        "DB_SCHEMA_MISMATCH",
        "Database is missing referral columns (e.g. open_count). Run: npx prisma migrate deploy",
        503
      );
    }
    return jsonError("SERVER_ERROR", "Referral payload failed", 500);
  }
}
