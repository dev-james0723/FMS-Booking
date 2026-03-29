import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  GOOGLE_REGISTER_PREFILL_COOKIE,
  verifyGoogleRegisterPrefillCookieValue,
} from "@/lib/auth/google-auth-sign-in";

/** Consumes one-time Google OAuth prefill cookie (set by `/api/v1/auth/google/callback`). */
export async function GET() {
  const jar = await cookies();
  const raw = jar.get(GOOGLE_REGISTER_PREFILL_COOKIE)?.value;
  const prefill = raw ? await verifyGoogleRegisterPrefillCookieValue(raw) : null;

  const res = NextResponse.json({
    ok: true as const,
    prefill: prefill
      ? { email: prefill.email, nameEn: prefill.nameEn }
      : null,
  });
  res.cookies.delete(GOOGLE_REGISTER_PREFILL_COOKIE);
  return res;
}
