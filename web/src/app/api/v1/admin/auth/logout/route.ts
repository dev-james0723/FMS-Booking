import { clearAdminSessionOnResponse } from "@/lib/auth/admin-session";
import { jsonOk } from "@/lib/api-response";

export async function POST() {
  const res = jsonOk({ ok: true });
  return clearAdminSessionOnResponse(res);
}
