import { NextResponse } from "next/server";
import { requireUserSession } from "@/lib/auth/require-session";
import { jsonError } from "@/lib/api-response";
import { withBasePath } from "@/lib/base-path";
import {
  createUserCalendarOAuth2Client,
  isGoogleCalendarUserOAuthConfigured,
  signGoogleCalendarOAuthState,
} from "@/lib/calendar/google-user-calendar";
import { getWebAuthnSettingsForRequest } from "@/lib/webauthn/config";

const CALENDAR_SCOPES = ["https://www.googleapis.com/auth/calendar.events"];

export async function GET() {
  const auth = await requireUserSession();
  if (!auth.ok) return auth.response;

  if (!isGoogleCalendarUserOAuthConfigured()) {
    return jsonError(
      "NOT_CONFIGURED",
      "Google Calendar sync is not configured on this server",
      503
    );
  }

  const { origin } = await getWebAuthnSettingsForRequest();
  const redirectUri = `${origin}${withBasePath("/api/v1/account/google-calendar/oauth/callback")}`;
  const client = createUserCalendarOAuth2Client(redirectUri);
  const state = await signGoogleCalendarOAuthState(auth.userId);
  const url = client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: CALENDAR_SCOPES,
    state,
    include_granted_scopes: true,
  });

  return NextResponse.redirect(url);
}
