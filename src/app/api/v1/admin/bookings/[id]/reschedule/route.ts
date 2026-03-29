import { jsonError, jsonOk } from "@/lib/api-response";
import { requireAdminSession } from "@/lib/auth/require-admin";
import { adminRescheduleBookingRequest, AdminBookingError } from "@/lib/booking/admin-actions";
import { sendBookingRescheduledByStaff } from "@/lib/email/booking-staff-action-mail";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const bodySchema = z.object({
  removeSlotIds: z.array(z.string().uuid()).default([]),
  addSlotIds: z.array(z.string().uuid()).default([]),
});

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, ctx: Ctx) {
  const auth = await requireAdminSession();
  if (!auth.ok) return auth.response;

  const { id } = await ctx.params;

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return jsonError("INVALID_JSON", "Invalid JSON body", 400);
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return jsonError("VALIDATION_ERROR", "Invalid payload", 422, parsed.error.flatten());
  }

  try {
    await adminRescheduleBookingRequest(id, auth.adminId, {
      removeSlotIds: parsed.data.removeSlotIds,
      addSlotIds: parsed.data.addSlotIds,
    });
  } catch (e) {
    if (e instanceof AdminBookingError) {
      const status = e.code === "NOT_FOUND" ? 404 : 400;
      return jsonError(e.code, e.message, status);
    }
    throw e;
  }

  const removedSlots = await prisma.bookingSlot.findMany({
    where: { id: { in: parsed.data.removeSlotIds } },
    orderBy: { startsAt: "asc" },
  });

  const full = await prisma.bookingRequest.findUnique({
    where: { id },
    include: {
      allocations: {
        where: { status: { in: ["pending", "approved"] } },
        include: { slot: true },
        orderBy: { slot: { startsAt: "asc" } },
      },
      user: { include: { profile: true } },
    },
  });

  if (full?.user.profile) {
    const name = full.user.profile.nameZh?.trim() || full.user.email;
    await sendBookingRescheduledByStaff({
      userId: full.userId,
      toEmail: full.user.email,
      greetingName: name,
      requestId: full.id,
      removedSlots: removedSlots.map((s) => ({
        startsAt: s.startsAt,
        endsAt: s.endsAt,
        venueLabel: s.venueLabel,
      })),
      currentSlots: full.allocations.map((a) => ({
        startsAt: a.slot.startsAt,
        endsAt: a.slot.endsAt,
        venueLabel: a.slot.venueLabel,
      })),
    });
  }

  return jsonOk({ ok: true, id });
}
