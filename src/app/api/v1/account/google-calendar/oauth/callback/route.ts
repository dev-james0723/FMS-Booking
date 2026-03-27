import { NextRequest, NextResponse } from "next/server";
import { getSessionFromCookies } from "@/lib/auth/session";
import { withBasePath } from "@/lib/base-path";
import {
  createUserCalendarOAuth2Client,
  isGoogleCalendarUserOAuthConfigured,
  verifyGoogleCalendarOAuthState,
} from "@/lib/calendar/google-user-calendar";
import { prisma } from "@/lib/prisma";
import { getWebAuthnSettingsForRequest } from "@/lib/webauthn/config";

function accountUrl(origin: string, query?: string): string {
  const path = withBasePath(`/account${query ?? ""}`);
  if (path.startsWith("http")) return path;
  return `${origin}${path}`;
}

export async function GET(req: NextRequest) {
  const { origin } = await getWebAuthnSettingsForRequest();
  const fail = (q: string) => NextResponse.redirect(accountUrl(origin, q));

  if (!isGoogleCalendarUserOAuthConfigured()) {
    return fail("?gcal=cfg");
  }

  const err = req.nextUrl.searchParams.get("error");
  if (err) {
    return fail("?gcal=denied");
  }

  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  if (!code || !state) {
    return fail("?gcal=bad");
  }

  const verified = await verifyGoogleCalendarOAuthState(state);
  if (!verified) {
    return fail("?gcal=state");
  }

  const session = await getSessionFromCookies();
  if (session && session.sub !== verified.userId) {
    return fail("?gcal=session");
  }

  const redirectUri = `${origin}${withBasePath("/api/v1/account/google-calendar/oauth/callback")}`;
  const client = createUserCalendarOAuth2Client(redirectUri);

  let refreshToken: string | undefined;
  try {
    const { tokens } = await client.getToken(code);
    refreshToken = tokens.refresh_token ?? undefined;
  } catch {
    return fail("?gcal=token");
  }

  if (!refreshToken) {
    return fail("?gcal=norefresh");
  }

  await prisma.user.update({
    where: { id: verified.userId },
    data: { googleCalendarRefreshToken: refreshToken },
  });

  return NextResponse.redirect(accountUrl(origin, "?gcal=connected"));
}
