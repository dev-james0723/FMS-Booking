import { clearUserSessionOnResponse } from "@/lib/auth/session";
import { jsonOk } from "@/lib/api-response";

export async function POST() {
  const res = jsonOk({ ok: true });
  return clearUserSessionOnResponse(res);
}
