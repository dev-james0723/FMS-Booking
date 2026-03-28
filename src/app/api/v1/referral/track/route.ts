import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { jsonOk } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { findReferralCodeByRaw } from "@/lib/referral/ambassador";
import { isValidReferralCodeParam, referralTrackCookieName } from "@/lib/referral/constants";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: { code: "INVALID_JSON", message: "Invalid JSON" } }, { status: 400 });
  }

  const raw = typeof (body as { code?: unknown })?.code === "string" ? (body as { code: string }).code : "";
  const code = raw.trim().toLowerCase();
  if (!isValidReferralCodeParam(code)) {
    return jsonOk({ ok: true, counted: false, reason: "invalid_code" as const });
  }

  const row = await findReferralCodeByRaw(prisma, code);
  if (!row) {
    return jsonOk({ ok: true, counted: false, reason: "unknown_code" as const });
  }

  const jar = await cookies();
  const cookieName = referralTrackCookieName(code);
  if (jar.get(cookieName)?.value) {
    return jsonOk({ ok: true, counted: false, duplicate: true as const });
  }

  await prisma.$executeRaw(
    Prisma.sql`UPDATE referral_codes SET open_count = COALESCE(open_count, 0) + 1 WHERE id = ${row.id}`
  );

  const res = NextResponse.json({ ok: true, counted: true as const });
  res.cookies.set(cookieName, "1", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 90,
  });
  return res;
}
