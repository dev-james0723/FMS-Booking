import { syncBookingRequestToGoogleCalendar } from "@/lib/calendar/google-booking-sync";
import { jsonError, jsonOk } from "@/lib/api-response";
import { requireUserSession } from "@/lib/auth/require-session";
import { BookingRuleError, validateAndCreateBookingRequest } from "@/lib/booking/service";
import { sendBookingSubmitted } from "@/lib/email/booking";
import { sendBookingAdminNotification } from "@/lib/email/booking-admin-notify";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const bodySchema = z.object({
  slotIds: z.array(z.string().uuid()).min(1),
  bonusRewardId: z.string().uuid().optional().nullable(),
});

export async function POST(req: Request) {
  const auth = await requireUserSession();
  if (!auth.ok) return auth.response;

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

  const user = await prisma.user.findUnique({
    where: { id: auth.userId },
    include: { category: true },
  });
  if (!user) {
    return jsonError("NOT_FOUND", "User not found", 404);
  }

  const categoryCode = user.category?.code ?? "personal";

  try {
    const { requestId } = await validateAndCreateBookingRequest({
      userId: auth.userId,
      userCategoryCode: categoryCode,
      slotIds: parsed.data.slotIds,
      bonusRewardId: parsed.data.bonusRewardId,
    });

    const full = await prisma.bookingRequest.findUnique({
      where: { id: requestId },
      include: {
        allocations: { include: { slot: true } },
        user: { include: { profile: true, category: true } },
      },
    });

    if (full?.user.profile) {
      await sendBookingSubmitted({
        userId: full.userId,
        toEmail: full.user.email,
        userName: full.user.profile.nameZh,
        requestId: full.id,
        slotCount: full.allocations.length,
      });
    }

    if (full) {
      const results = await Promise.allSettled([
        sendBookingAdminNotification(full),
        syncBookingRequestToGoogleCalendar(full),
      ]);
      for (const r of results) {
        if (r.status === "rejected") {
          console.error("[booking/request] admin notify or calendar sync", r.reason);
        }
      }
      if (results[1].status === "fulfilled" && !results[1].value.ok && results[1].value.error) {
        console.error("[booking/request] Google Calendar:", results[1].value.error);
      }
    }

    return jsonOk({
      ok: true,
      bookingRequestId: requestId,
    });
  } catch (e) {
    if (e instanceof BookingRuleError) {
      const forbidden = new Set([
        "BOOKING_NOT_OPEN",
        "MUST_CHANGE_PASSWORD",
        "REGISTRATION_INCOMPLETE",
        "ACCOUNT_NOT_ACTIVE",
      ]);
      const badRequest = new Set([
        "SLOT_NOT_FOUND",
        "VALIDATION_ERROR",
        "NO_SLOTS",
        "CAMPAIGN_DATE_INVALID",
      ]);
      const status = forbidden.has(e.code)
        ? 403
        : badRequest.has(e.code)
          ? 400
          : 409;
      return jsonError(e.code, e.message, status, e.details);
    }
    console.error(e);
    return jsonError("BOOKING_FAILED", "無法建立預約", 500);
  }
}
