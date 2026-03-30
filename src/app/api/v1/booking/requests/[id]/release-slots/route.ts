import { jsonError, jsonOk } from "@/lib/api-response";
import { requireUserSession } from "@/lib/auth/require-session";
import { parseBookingVenueQuery, userMayAccessBookingVenue } from "@/lib/booking/venue-kind";
import { sendBookingUserCancelNotifications } from "@/lib/email/booking-user-mutation-notify";
import { UserBookingMutationError, userReleaseBookingSlots } from "@/lib/booking/user-booking-mutations";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const bodySchema = z
  .object({
    slotIds: z.array(z.string().uuid()).optional(),
    dateKey: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  })
  .refine((b) => (b.slotIds && b.slotIds.length > 0) || Boolean(b.dateKey?.trim()), {
    message: "Provide slotIds or dateKey",
  });

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, ctx: Ctx) {
  const auth = await requireUserSession();
  if (!auth.ok) return auth.response;

  const { id } = await ctx.params;
  const url = new URL(req.url);
  const venueKind = parseBookingVenueQuery(url.searchParams.get("venue"));

  const user = await prisma.user.findUnique({
    where: { id: auth.userId },
    include: { profile: true },
  });
  if (!user?.profile || !userMayAccessBookingVenue(user.profile.bookingVenueKind, venueKind)) {
    return jsonError("FORBIDDEN", "此帳戶不可使用此預約通道", 403);
  }

  const brCheck = await prisma.bookingRequest.findFirst({
    where: { id, userId: auth.userId },
    select: { venueKind: true },
  });
  if (!brCheck) {
    return jsonError("NOT_FOUND", "預約不存在", 404);
  }
  if (brCheck.venueKind !== venueKind) {
    return jsonError("FORBIDDEN", "場地通道與此預約不符", 403);
  }

  let jsonBody: unknown;
  try {
    jsonBody = await req.json();
  } catch {
    return jsonError("INVALID_JSON", "Invalid JSON body", 400);
  }

  const parsed = bodySchema.safeParse(jsonBody);
  if (!parsed.success) {
    return jsonError("VALIDATION_ERROR", "Invalid payload", 422, parsed.error.flatten());
  }

  let result: { releasedSlotIds: string[]; requestCancelled: boolean };
  try {
    result = await userReleaseBookingSlots(auth.userId, id, {
      slotIds: parsed.data.slotIds,
      dateKey: parsed.data.dateKey,
    });
  } catch (e) {
    if (e instanceof UserBookingMutationError) {
      const status =
        e.code === "NOT_FOUND"
          ? 404
          : e.code === "FORBIDDEN"
            ? 403
            : e.code === "WITHIN_CUTOFF"
              ? 409
              : 400;
      return jsonError(e.code, e.message, status);
    }
    throw e;
  }

  const releasedSlots = await prisma.bookingSlot.findMany({
    where: { id: { in: result.releasedSlotIds } },
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
    await sendBookingUserCancelNotifications({
      userId: full.userId,
      userEmail: full.user.email,
      greetingName: full.user.profile.nameZh?.trim() || full.user.email,
      requestId: full.id,
      venueKind: full.venueKind,
      requestCancelled: result.requestCancelled,
      releasedSlots: releasedSlots.map((s) => ({
        startsAt: s.startsAt,
        endsAt: s.endsAt,
        venueLabel: s.venueLabel,
      })),
      remainingSlots: full.allocations.map((a) => ({
        startsAt: a.slot.startsAt,
        endsAt: a.slot.endsAt,
        venueLabel: a.slot.venueLabel,
      })),
    });
  }

  return jsonOk({
    ok: true,
    id,
    releasedSlotIds: result.releasedSlotIds,
    requestCancelled: result.requestCancelled,
  });
}
