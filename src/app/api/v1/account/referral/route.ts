import { jsonError, jsonOk } from "@/lib/api-response";
import { getSessionFromCookies } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import {
  getAmbassadorReferralPayloadForUser,
  isAmbassadorDbSchemaMismatch,
} from "@/lib/referral/ambassador-referral-payload";

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
    const body = await getAmbassadorReferralPayloadForUser(prisma, session.sub);
    const res = jsonOk({ optedIn: true as const, ...body });
    res.headers.set("Cache-Control", "private, no-store");
    return res;
  } catch (e) {
    console.error("[account/referral] GET getAmbassadorReferralPayloadForUser", e);
    if (isAmbassadorDbSchemaMismatch(e)) {
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
    const body = await getAmbassadorReferralPayloadForUser(prisma, session.sub);
    const res = jsonOk({ optedIn: true as const, ...body });
    res.headers.set("Cache-Control", "private, no-store");
    return res;
  } catch (e) {
    console.error("[account/referral] POST getAmbassadorReferralPayloadForUser", e);
    if (isAmbassadorDbSchemaMismatch(e)) {
      return jsonError(
        "DB_SCHEMA_MISMATCH",
        "Database is missing referral columns (e.g. open_count). Run: npx prisma migrate deploy",
        503
      );
    }
    return jsonError("SERVER_ERROR", "Referral payload failed", 500);
  }
}
