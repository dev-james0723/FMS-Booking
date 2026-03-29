import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withBasePath } from "@/lib/base-path";
import {
  attachAdminSessionCookie,
  signAdminSession,
} from "@/lib/auth/admin-session";
import { attachUserSessionCookie, signUserSession } from "@/lib/auth/session";
import {
  createGoogleAuthOAuth2Client,
  getGoogleAuthClientId,
  isGoogleAuthSignInConfigured,
  signGoogleRegisterPrefillCookieValue,
  verifyGoogleAuthOAuthState,
  verifyGoogleIdToken,
  GOOGLE_REGISTER_PREFILL_COOKIE,
  googleRegisterPrefillCookieOptions,
} from "@/lib/auth/google-auth-sign-in";
import { getWebAuthnSettingsForRequest } from "@/lib/webauthn/config";

function redirectTo(origin: string, path: string): NextResponse {
  const p = path.startsWith("/") ? path : `/${path}`;
  return NextResponse.redirect(`${origin}${withBasePath(p)}`);
}

export async function GET(req: NextRequest) {
  const { origin } = await getWebAuthnSettingsForRequest();

  if (!isGoogleAuthSignInConfigured()) {
    return redirectTo(origin, "/login?google=cfg");
  }

  const err = req.nextUrl.searchParams.get("error");
  if (err) {
    const st = await verifyGoogleAuthOAuthState(req.nextUrl.searchParams.get("state") ?? "");
    const target = st?.intent === "admin" ? "/admin/login?google=denied" : "/login?google=denied";
    return redirectTo(origin, target);
  }

  const code = req.nextUrl.searchParams.get("code");
  const stateRaw = req.nextUrl.searchParams.get("state");
  if (!code || !stateRaw) {
    return redirectTo(origin, "/login?google=bad");
  }

  const state = await verifyGoogleAuthOAuthState(stateRaw);
  if (!state) {
    return redirectTo(origin, "/login?google=state");
  }

  const clientId = getGoogleAuthClientId();
  if (!clientId) {
    return redirectTo(origin, "/login?google=cfg");
  }

  const redirectUri = `${origin}${withBasePath("/api/v1/auth/google/callback")}`;
  const client = createGoogleAuthOAuth2Client(redirectUri);

  let idToken: string | undefined;
  try {
    const { tokens } = await client.getToken(code);
    idToken = tokens.id_token ?? undefined;
  } catch {
    if (state.intent === "admin") {
      return redirectTo(origin, "/admin/login?google=token");
    }
    return redirectTo(origin, "/login?google=token");
  }

  if (!idToken) {
    if (state.intent === "admin") {
      return redirectTo(origin, "/admin/login?google=token");
    }
    return redirectTo(origin, "/login?google=token");
  }

  const profile = await verifyGoogleIdToken(idToken, clientId);
  if (!profile) {
    if (state.intent === "admin") {
      return redirectTo(origin, "/admin/login?google=profile");
    }
    return redirectTo(origin, "/login?google=profile");
  }

  if (state.intent === "register") {
    const token = await signGoogleRegisterPrefillCookieValue(profile);
    const sep = state.next.includes("?") ? "&" : "?";
    const targetPath = `${state.next}${sep}google_prefill=1`;
    const res = redirectTo(origin, targetPath);
    res.cookies.set(GOOGLE_REGISTER_PREFILL_COOKIE, token, googleRegisterPrefillCookieOptions);
    return res;
  }

  if (state.intent === "admin") {
    const admin = await prisma.adminUser.findUnique({
      where: { email: profile.email },
    });
    if (!admin?.isActive) {
      return redirectTo(origin, "/admin/login?google=noaccount");
    }
    const sessionToken = await signAdminSession({
      sub: admin.id,
      email: admin.email,
      role: admin.role,
    });
    const res = NextResponse.redirect(`${origin}${withBasePath(state.next)}`);
    return attachAdminSessionCookie(res, sessionToken);
  }

  const user = await prisma.user.findUnique({
    where: { email: profile.email },
    include: { credentials: true, profile: { select: { bookingVenueKind: true } } },
  });

  if (!user?.credentials) {
    return redirectTo(origin, "/login?google=noaccount");
  }

  if (user.accountStatus !== "active") {
    return redirectTo(origin, "/login?google=disabled");
  }

  await prisma.loginCredential.update({
    where: { userId: user.id },
    data: { lastLoginAt: new Date() },
  });

  const sessionToken = await signUserSession({
    sub: user.id,
    email: user.email,
    accountStatus: user.accountStatus,
    mustChangePassword: user.credentials.mustChangePassword,
    hasCompletedRegistration: user.hasCompletedRegistration,
    bookingVenueKind: user.profile?.bookingVenueKind ?? "studio_room",
  });

  const res = NextResponse.redirect(`${origin}${withBasePath(state.next)}`);
  return attachUserSessionCookie(res, sessionToken);
}
