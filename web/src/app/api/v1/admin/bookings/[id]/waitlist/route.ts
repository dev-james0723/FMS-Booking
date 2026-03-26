import { jsonError, jsonOk } from "@/lib/api-response";
import { requireAdminSession } from "@/lib/auth/require-admin";
import { adminWaitlistBookingRequest, AdminBookingError } from "@/lib/booking/admin-actions";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(_req: Request, ctx: Ctx) {
  const auth = await requireAdminSession();
  if (!auth.ok) return auth.response;

  const { id } = await ctx.params;

  try {
    await adminWaitlistBookingRequest(id, auth.adminId);
  } catch (e) {
    if (e instanceof AdminBookingError) {
      const status = e.code === "NOT_FOUND" ? 404 : 400;
      return jsonError(e.code, e.message, status);
    }
    throw e;
  }

  return jsonOk({ ok: true, id });
}
