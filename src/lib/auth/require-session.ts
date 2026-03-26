import { jsonError, type ApiErrorBody } from "@/lib/api-response";
import { getSessionFromCookies } from "@/lib/auth/session";
import type { NextResponse } from "next/server";

export async function requireUserSession():
  Promise<
    | { ok: true; userId: string }
    | { ok: false; response: NextResponse<ApiErrorBody> }
  > {
  const session = await getSessionFromCookies();
  if (!session) {
    return { ok: false, response: jsonError("UNAUTHORIZED", "Not logged in", 401) };
  }
  return { ok: true, userId: session.sub };
}
