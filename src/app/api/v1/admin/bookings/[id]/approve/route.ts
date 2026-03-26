import { jsonError, jsonOk } from "@/lib/api-response";
import { requireAdminSession } from "@/lib/auth/require-admin";
import { adminApproveBookingRequest, AdminBookingError } from "@/lib/booking/admin-actions";
import { sendBookingApproved } from "@/lib/email/booking-admin";
import { formatSlotListLineZhDateEnRange, displayVenueLabel } from "@/lib/booking-slot-display";
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
    const slotLines = full.allocations.map((a) => {
      const line = formatSlotListLineZhDateEnRange(a.slot.startsAt, a.slot.endsAt);
      const v = a.slot.venueLabel?.trim();
      return v ? `${line} · ${displayVenueLabel(v)}` : line;
    });
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
