import { jsonError, jsonOk } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { isValidReferralCodeParam } from "@/lib/referral/constants";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = (url.searchParams.get("code") ?? "").trim().toLowerCase();
  if (!isValidReferralCodeParam(code)) {
    return jsonError("INVALID_CODE", "Invalid referral code", 400);
  }

  const row = await prisma.referralCode.findFirst({
    where: { code: { equals: code, mode: "insensitive" } },
    include: {
      ambassador: { include: { profile: true } },
    },
  });

  const nameZh = row?.ambassador.profile?.nameZh?.trim();
  if (!nameZh) {
    return jsonError("NOT_FOUND", "Referral not found", 404);
  }

  return jsonOk({ ambassadorNameZh: nameZh });
}
