import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import type { NextResponse } from "next/server";
import type { AccountStatus, BookingVenueKind } from "@prisma/client";
import { jwtSecretKeyBytes } from "@/lib/jwt-secret";
import { isRegistrationSocialGateSatisfied } from "@/lib/auth/registration-social-gate";

const COOKIE = "fms_user_session";

export type SessionPayload = {
  sub: string;
  email: string;
  accountStatus: AccountStatus;
  mustChangePassword: boolean;
  hasCompletedRegistration: boolean;
  /** Booking nav target; legacy tokens omit → verify yields undefined, UI defaults to studio. */
  bookingVenueKind?: BookingVenueKind;
  /** false = must finish post-registration social steps before the rest of the account area. */
  registrationSocialGateSatisfied: boolean;
  iat?: number;
  exp?: number;
};

/** Profile fields needed to set `registrationSocialGateSatisfied` on the session JWT. */
export type SessionProfileSlice = {
  bookingVenueKind: BookingVenueKind;
  socialFollowClaimed: boolean;
  socialFollowVerified: boolean;
  socialRepostSetupConfirmed: boolean;
} | null;

/** Prisma `include.profile.select` for signing or refreshing the user session JWT. */
export const PRISMA_PROFILE_SELECT_FOR_SESSION_JWT = {
  bookingVenueKind: true,
  socialFollowClaimed: true,
  socialFollowVerified: true,
  socialRepostSetupConfirmed: true,
} as const;

export function buildUserSessionJwtPayload(user: {
  id: string;
  email: string;
  accountStatus: AccountStatus;
  hasCompletedRegistration: boolean;
  credentials: { mustChangePassword: boolean } | null;
  profile: SessionProfileSlice;
}): Omit<SessionPayload, "iat" | "exp"> {
  return {
    sub: user.id,
    email: user.email,
    accountStatus: user.accountStatus,
    mustChangePassword: user.credentials?.mustChangePassword ?? true,
    hasCompletedRegistration: user.hasCompletedRegistration,
    bookingVenueKind: user.profile?.bookingVenueKind ?? "studio_room",
    registrationSocialGateSatisfied: isRegistrationSocialGateSatisfied(user.profile ?? undefined),
  };
}

export async function signUserSession(payload: Omit<SessionPayload, "iat" | "exp">): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(jwtSecretKeyBytes());
}

export async function verifyUserSession(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, jwtSecretKeyBytes());
    const sub = String(payload.sub ?? "");
    const email = String(payload.email ?? "");
    const accountStatus = payload.accountStatus as AccountStatus;
    const mustChangePassword = Boolean(payload.mustChangePassword);
    const hasCompletedRegistration = Boolean(payload.hasCompletedRegistration);
    const rawVenue = payload.bookingVenueKind;
    const bookingVenueKind: BookingVenueKind | undefined =
      rawVenue === "open_space" || rawVenue === "studio_room" ? rawVenue : undefined;
    const rawGate = payload.registrationSocialGateSatisfied;
    const registrationSocialGateSatisfied =
      rawGate === undefined ? true : Boolean(rawGate);
    if (!sub || !email) return null;
    return {
      sub,
      email,
      accountStatus,
      mustChangePassword,
      hasCompletedRegistration,
      bookingVenueKind,
      registrationSocialGateSatisfied,
    };
  } catch {
    return null;
  }
}

const userCookieOpts = {
  httpOnly: true as const,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 24 * 7,
};

export function attachUserSessionCookie<T>(res: NextResponse<T>, token: string): NextResponse<T> {
  res.cookies.set(COOKIE, token, userCookieOpts);
  return res;
}

export function clearUserSessionOnResponse<T>(res: NextResponse<T>): NextResponse<T> {
  res.cookies.delete(COOKIE);
  return res;
}

export async function setSessionCookie(token: string): Promise<void> {
  const jar = await cookies();
  jar.set(COOKIE, token, userCookieOpts);
}

export async function clearSessionCookie(): Promise<void> {
  const jar = await cookies();
  jar.delete(COOKIE);
}

export async function getSessionFromCookies(): Promise<SessionPayload | null> {
  const jar = await cookies();
  const t = jar.get(COOKIE)?.value;
  if (!t) return null;
  return verifyUserSession(t);
}

export { COOKIE as USER_SESSION_COOKIE_NAME };
