import { SignJWT, createRemoteJWKSet, jwtVerify } from "jose";
import { google } from "googleapis";
import { jwtSecretKeyBytes } from "@/lib/jwt-secret";

const STATE_TYP = "google_auth_oauth_state";
const PREFILL_TYP = "google_reg_prefill";

const googleJwks = createRemoteJWKSet(new URL("https://www.googleapis.com/oauth2/v3/certs"));

export function getGoogleAuthClientId(): string | undefined {
  return (
    process.env.GOOGLE_AUTH_CLIENT_ID?.trim() ||
    process.env.NEXT_PUBLIC_GOOGLE_AUTH_CLIENT_ID?.trim()
  );
}

export function getGoogleAuthClientSecret(): string | undefined {
  return process.env.GOOGLE_AUTH_CLIENT_SECRET?.trim();
}

export function isGoogleAuthSignInConfigured(): boolean {
  return Boolean(getGoogleAuthClientId() && getGoogleAuthClientSecret());
}

export function createGoogleAuthOAuth2Client(redirectUri: string) {
  const id = getGoogleAuthClientId();
  const secret = getGoogleAuthClientSecret();
  if (!id || !secret) {
    throw new Error("Google auth OAuth is not configured");
  }
  return new google.auth.OAuth2(id, secret, redirectUri);
}

export type GoogleAuthIntent = "login" | "register" | "admin";

export async function signGoogleAuthOAuthState(params: {
  intent: GoogleAuthIntent;
  next: string;
}): Promise<string> {
  return new SignJWT({
    typ: STATE_TYP,
    intent: params.intent,
    next: params.next,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("10m")
    .sign(jwtSecretKeyBytes());
}

export async function verifyGoogleAuthOAuthState(
  state: string
): Promise<{ intent: GoogleAuthIntent; next: string } | null> {
  try {
    const { payload } = await jwtVerify(state, jwtSecretKeyBytes());
    if (payload.typ !== STATE_TYP) return null;
    const intent = payload.intent as GoogleAuthIntent;
    if (intent !== "login" && intent !== "register" && intent !== "admin") return null;
    const next = typeof payload.next === "string" ? payload.next : "";
    if (!next.startsWith("/") || next.startsWith("//") || next.includes("://")) return null;
    return { intent, next };
  } catch {
    return null;
  }
}

export type GoogleIdProfile = {
  email: string;
  name?: string;
  givenName?: string;
  familyName?: string;
};

export async function verifyGoogleIdToken(
  idToken: string,
  audience: string
): Promise<GoogleIdProfile | null> {
  try {
    const { payload } = await jwtVerify(idToken, googleJwks, {
      issuer: ["https://accounts.google.com", "accounts.google.com"],
      audience,
    });
    const emailRaw = typeof payload.email === "string" ? payload.email.trim().toLowerCase() : "";
    if (!emailRaw) return null;
    const ev = payload.email_verified;
    if (ev !== true && ev !== "true") return null;
    const name = typeof payload.name === "string" ? payload.name.trim() : undefined;
    const givenName = typeof payload.given_name === "string" ? payload.given_name.trim() : undefined;
    const familyName = typeof payload.family_name === "string" ? payload.family_name.trim() : undefined;
    return { email: emailRaw, name, givenName, familyName };
  } catch {
    return null;
  }
}

export function suggestedEnglishNameFromGoogle(p: GoogleIdProfile): string | undefined {
  if (p.name) return p.name;
  const parts = [p.givenName, p.familyName].filter(Boolean);
  if (parts.length === 0) return undefined;
  return parts.join(" ");
}

export async function signGoogleRegisterPrefillCookieValue(profile: GoogleIdProfile): Promise<string> {
  const nameEn = suggestedEnglishNameFromGoogle(profile);
  return new SignJWT({
    typ: PREFILL_TYP,
    email: profile.email,
    nameEn: nameEn ?? null,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("10m")
    .sign(jwtSecretKeyBytes());
}

export type GoogleRegisterPrefillPayload = { email: string; nameEn: string | null };

export async function verifyGoogleRegisterPrefillCookieValue(
  token: string
): Promise<GoogleRegisterPrefillPayload | null> {
  try {
    const { payload } = await jwtVerify(token, jwtSecretKeyBytes());
    if (payload.typ !== PREFILL_TYP) return null;
    const email = typeof payload.email === "string" ? payload.email.trim().toLowerCase() : "";
    if (!email) return null;
    const nameEn =
      payload.nameEn === null || payload.nameEn === undefined
        ? null
        : typeof payload.nameEn === "string"
          ? payload.nameEn.trim() || null
          : null;
    return { email, nameEn };
  } catch {
    return null;
  }
}

export const GOOGLE_REGISTER_PREFILL_COOKIE = "fms_google_reg_prefill";

export const googleRegisterPrefillCookieOptions = {
  httpOnly: true as const,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 10,
};
