import { jsonError, jsonOk } from "@/lib/api-response";
import { requireAdminSession } from "@/lib/auth/require-admin";
import { adminCancelBookingRequest, AdminBookingError } from "@/lib/booking/admin-actions";
import { sendBookingCancelledByStaff } from "@/lib/email/booking-staff-action-mail";
import { prisma } from "@/lib/prisma";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(_req: Request, ctx: Ctx) {
  const auth = await requireAdminSession();
  if (!auth.ok) return auth.response;

  const { id } = await ctx.params;

  try {
    await adminCancelBookingRequest(id, auth.adminId);
  } catch (e) {
    if (e instanceof AdminBookingError) {
      const status = e.code === "NOT_FOUND" ? 404 : 400;
      return jsonError(e.code, e.message, status);
    }
    throw e;
  }

  const full = await prisma.bookingRequest.findUnique({
    where: { id },
    include: { user: { include: { profile: true } } },
  });

  if (full?.user.profile) {
    const name = full.user.profile.nameZh?.trim() || full.user.email;
    await sendBookingCancelledByStaff({
      userId: full.userId,
      toEmail: full.user.email,
      greetingName: name,
      requestId: full.id,
    });
  }

  return jsonOk({ ok: true, id });
}
