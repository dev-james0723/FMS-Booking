import { jsonError, jsonOk } from "@/lib/api-response";
import { requireAdminSession } from "@/lib/auth/require-admin";
import { adminApproveBookingRequest, AdminBookingError } from "@/lib/booking/admin-actions";
import { sendBookingApproved } from "@/lib/email/booking-admin";
import { prisma } from "@/lib/prisma";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(_req: Request, ctx: Ctx) {
  const auth = await requireAdminSession();
  if (!auth.ok) return auth.response;

  const { id } = await ctx.params;

  try {
    await adminApproveBookingRequest(id, auth.adminId);
  } catch (e) {
    if (e instanceof AdminBookingError) {
      const status = e.code === "NOT_FOUND" ? 404 : 400;
      return jsonError(e.code, e.message, status);
    }
    throw e;
  }

  const full = await prisma.bookingRequest.findUnique({
    where: { id },
    include: {
      allocations: { include: { slot: true }, orderBy: { slot: { startsAt: "asc" } } },
      user: { include: { profile: true } },
    },
  });

  if (full?.user.profile) {
    const slotLines = full.allocations.map((a) =>
      new Date(a.slot.startsAt).toLocaleString("zh-HK", {
        timeZone: "Asia/Hong_Kong",
        weekday: "short",
        month: "numeric",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    );
    await sendBookingApproved({
      userId: full.userId,
      toEmail: full.user.email,
      userName: full.user.profile.nameZh,
      requestId: full.id,
      slotLines,
    });
  }

  return jsonOk({ ok: true, id });
}
