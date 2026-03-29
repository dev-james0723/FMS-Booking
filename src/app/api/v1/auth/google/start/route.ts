import { NextRequest, NextResponse } from "next/server";
import { withBasePath } from "@/lib/base-path";
import {
  createGoogleAuthOAuth2Client,
  isGoogleAuthSignInConfigured,
  signGoogleAuthOAuthState,
  type GoogleAuthIntent,
} from "@/lib/auth/google-auth-sign-in";
import { getWebAuthnSettingsForRequest } from "@/lib/webauthn/config";

const SCOPES = ["openid", "email", "profile"];

function parseIntent(raw: string | null): GoogleAuthIntent | null {
  if (raw === "login" || raw === "register" || raw === "admin") return raw;
  return null;
}

function safeNextPath(raw: string | null, fallback: string): string {
  if (!raw || raw.length > 512) return fallback;
  const t = raw.trim();
  if (!t.startsWith("/") || t.startsWith("//") || t.includes("://")) return fallback;
  return t;
}

export async function GET(req: NextRequest) {
  if (!isGoogleAuthSignInConfigured()) {
    return NextResponse.json(
      { error: { message: "Google sign-in is not configured on this server." } },
      { status: 503 }
    );
  }

  const intent = parseIntent(req.nextUrl.searchParams.get("intent"));
  if (!intent) {
    return NextResponse.json({ error: { message: "Missing or invalid intent." } }, { status: 400 });
  }

  const defaultNext =
    intent === "admin" ? "/admin/bookings" : intent === "register" ? "/register" : "/account";
  const next = safeNextPath(req.nextUrl.searchParams.get("next"), defaultNext);

  const { origin } = await getWebAuthnSettingsForRequest();
  const redirectUri = `${origin}${withBasePath("/api/v1/auth/google/callback")}`;
  const client = createGoogleAuthOAuth2Client(redirectUri);
  const state = await signGoogleAuthOAuthState({ intent, next });

  const url = client.generateAuthUrl({
    access_type: "online",
    prompt: "select_account",
    scope: SCOPES,
    state,
  });

  return NextResponse.redirect(url);
}
