import { jsonError, jsonOk } from "@/lib/api-response";
import { requireAdminSession } from "@/lib/auth/require-admin";
import { adminRejectBookingRequest, AdminBookingError } from "@/lib/booking/admin-actions";
import { sendBookingRejected } from "@/lib/email/booking-admin";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const bodySchema = z.object({
  note: z.string().max(2000).optional().nullable(),
});

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  const auth = await requireAdminSession();
  if (!auth.ok) return auth.response;

  const { id } = await ctx.params;

  let note: string | null | undefined;
  try {
    const json = await req.json().catch(() => ({}));
    const parsed = bodySchema.safeParse(json);
    note = parsed.success ? parsed.data.note : undefined;
  } catch {
    note = undefined;
  }

  try {
    await adminRejectBookingRequest(id, auth.adminId, note);
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
    await sendBookingRejected({
      userId: full.userId,
      toEmail: full.user.email,
      userName: full.user.profile.nameZh,
      requestId: full.id,
      note: full.adminNote,
    });
  }

  return jsonOk({ ok: true, id });
}
