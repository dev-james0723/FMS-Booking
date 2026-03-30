import { jsonError, jsonOk } from "@/lib/api-response";
import { requireUserSession } from "@/lib/auth/require-session";
import { parseBookingVenueQuery, userMayAccessBookingVenue } from "@/lib/booking/venue-kind";
import {
  sendBookingUserRescheduleNotifications,
} from "@/lib/email/booking-user-mutation-notify";
import { UserBookingMutationError, userRescheduleBookingRequest } from "@/lib/booking/user-booking-mutations";
import { apiBilingual } from "@/lib/i18n/api-bilingual";
import { userBookingMutationUserMessage } from "@/lib/i18n/booking-user-api-messages";
import { serverLocaleFromCookies } from "@/lib/i18n/server-translate";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const bodySchema = z.object({
  removeSlotIds: z.array(z.string().uuid()).default([]),
  addSlotIds: z.array(z.string().uuid()).default([]),
});

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, ctx: Ctx) {
  const auth = await requireUserSession();
  if (!auth.ok) return auth.response;

  const { id } = await ctx.params;

  const url = new URL(req.url);
  const venueKind = parseBookingVenueQuery(url.searchParams.get("venue"));

  const locale = await serverLocaleFromCookies();
  const user = await prisma.user.findUnique({
    where: { id: auth.userId },
    include: { profile: true },
  });
  if (!user?.profile || !userMayAccessBookingVenue(user.profile.bookingVenueKind, venueKind)) {
    return jsonError(
      "FORBIDDEN",
      apiBilingual(locale, "此帳戶不可使用此預約通道", "This account cannot use this booking channel."),
      403
    );
  }

  const brCheck = await prisma.bookingRequest.findFirst({
    where: { id, userId: auth.userId },
    select: { venueKind: true },
  });
  if (!brCheck) {
    return jsonError(
      "NOT_FOUND",
      apiBilingual(locale, "預約不存在", "Booking not found."),
      404
    );
  }
  if (brCheck.venueKind !== venueKind) {
    return jsonError(
      "FORBIDDEN",
      apiBilingual(locale, "場地通道與此預約不符", "Venue channel does not match this booking."),
      403
    );
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

  try {
    await userRescheduleBookingRequest(auth.userId, id, {
      removeSlotIds: parsed.data.removeSlotIds,
      addSlotIds: parsed.data.addSlotIds,
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
      return jsonError(e.code, userBookingMutationUserMessage(locale, e), status, e.details);
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
    await sendBookingUserRescheduleNotifications({
      userId: full.userId,
      userEmail: full.user.email,
      greetingName: full.user.profile.nameZh?.trim() || full.user.email,
      requestId: full.id,
      venueKind: full.venueKind,
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
