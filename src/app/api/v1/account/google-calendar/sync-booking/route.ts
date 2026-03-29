import { requireUserSession } from "@/lib/auth/require-session";
import { jsonError, jsonOk } from "@/lib/api-response";
import { withBasePath } from "@/lib/base-path";
import {
  isGoogleCalendarUserOAuthConfigured,
  syncSingleUserBookingToGoogleCalendar,
} from "@/lib/calendar/google-user-calendar";
import { getWebAuthnSettingsForRequest } from "@/lib/webauthn/config";

export async function POST(req: Request) {
  const auth = await requireUserSession();
  if (!auth.ok) return auth.response;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError("BAD_REQUEST", "Invalid JSON body", 400);
  }
  const bookingId =
    typeof body === "object" && body !== null && "bookingId" in body
      ? String((body as { bookingId: unknown }).bookingId ?? "").trim()
      : "";
  if (!bookingId) {
    return jsonError("BAD_REQUEST", "bookingId is required", 400);
  }

  if (!isGoogleCalendarUserOAuthConfigured()) {
    return jsonError(
      "NOT_CONFIGURED",
      "Google Calendar sync is not configured on this server",
      503
    );
  }

  const { origin } = await getWebAuthnSettingsForRequest();
  const oauthRedirectUri = `${origin}${withBasePath("/api/v1/account/google-calendar/oauth/callback")}`;

  const result = await syncSingleUserBookingToGoogleCalendar(
    auth.userId,
    bookingId,
    oauthRedirectUri
  );
  if (!result.ok) {
    const status =
      result.code === "NOT_LINKED"
        ? 409
        : result.code === "NOT_CONFIGURED"
          ? 503
          : result.code === "NOT_FOUND"
            ? 404
            : 502;
    return jsonError(result.code, result.message, status);
  }

  return jsonOk({
    created: result.created,
    updated: result.updated,
    removed: result.removed,
  });
}
