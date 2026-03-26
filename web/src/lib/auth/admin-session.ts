import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import type { NextResponse } from "next/server";
import type { AdminRole } from "@prisma/client";

const COOKIE = "fms_admin_session";

export type AdminSessionPayload = {
  sub: string;
  email: string;
  role: AdminRole;
};

function getSecret(): Uint8Array {
  const s = process.env.JWT_SECRET;
  if (!s || s.length < 16) throw new Error("JWT_SECRET must be set (min 16 chars)");
  return new TextEncoder().encode(s);
}

export async function signAdminSession(payload: AdminSessionPayload): Promise<string> {
  return new SignJWT({ email: payload.email, role: payload.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime("12h")
    .sign(getSecret());
}

export async function verifyAdminSessionToken(token: string): Promise<AdminSessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    const sub = String(payload.sub ?? "");
    const email = String(payload.email ?? "");
    const role = payload.role as AdminRole;
    if (!sub || !email) return null;
    return { sub, email, role };
  } catch {
    return null;
  }
}

const adminCookieOpts = {
  httpOnly: true as const,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 12,
};

/** Prefer this in Route Handlers — `cookies().set` + `NextResponse.json` may omit Set-Cookie. */
export function attachAdminSessionCookie<T>(res: NextResponse<T>, token: string): NextResponse<T> {
  res.cookies.set(COOKIE, token, adminCookieOpts);
  return res;
}

export async function setAdminSessionCookie(token: string): Promise<void> {
  const jar = await cookies();
  jar.set(COOKIE, token, adminCookieOpts);
}

export function clearAdminSessionOnResponse<T>(res: NextResponse<T>): NextResponse<T> {
  res.cookies.delete(COOKIE);
  return res;
}

export async function clearAdminSessionCookie(): Promise<void> {
  const jar = await cookies();
  jar.delete(COOKIE);
}

export async function getAdminSessionFromCookies(): Promise<AdminSessionPayload | null> {
  const jar = await cookies();
  const t = jar.get(COOKIE)?.value;
  if (!t) return null;
  return verifyAdminSessionToken(t);
}

export { COOKIE as ADMIN_SESSION_COOKIE_NAME };
