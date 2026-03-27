import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk } from "@/lib/api-response";
import { getSessionFromCookies } from "@/lib/auth/session";
import { resolveReferrerDisplayForUser } from "@/lib/referral/ambassador";
import { parseBookingOpensAt } from "@/lib/booking/booking-opens-at";
import { getEffectiveNow, getPublicSettings } from "@/lib/settings";

export async function GET() {
  const session = await getSessionFromCookies();
  if (!session) {
    return jsonError("UNAUTHORIZED", "Not logged in", 401);
  }

  const user = await prisma.user.findUnique({
    where: { id: session.sub },
    include: {
      credentials: true,
      profile: true,
      category: true,
    },
  });

  if (!user) {
    return jsonError("NOT_FOUND", "User not found", 404);
  }

  const settings = await getPublicSettings();
  const now = await getEffectiveNow();
  const bookingOpensAt = parseBookingOpensAt(settings["booking_opens_at"]);
  const bookingOpen = bookingOpensAt ? now.getTime() >= bookingOpensAt.getTime() : false;

  const canAccessBookingPortal =
    user.hasCompletedRegistration &&
    user.accountStatus === "active" &&
    user.credentials !== null &&
    user.credentials.mustChangePassword === false;

  const p = user.profile;
  const referrerNameZh = await resolveReferrerDisplayForUser(
    prisma,
    user.referralAttributionCode
  );

  return jsonOk({
    user: {
      id: user.id,
      email: user.email,
      accountStatus: user.accountStatus,
      hasCompletedRegistration: user.hasCompletedRegistration,
      mustChangePassword: user.credentials?.mustChangePassword ?? true,
      quotaTier: user.quotaTier,
      bookingVenueKind: p?.bookingVenueKind ?? "studio_room",
      profile: user.profile,
      category: user.category,
      referrerNameZh,
      bookingEligibility:
        p != null
          ? {
              individualEligible: p.individualEligible,
              teachingEligible: p.teachingEligible,
              dualEligible: p.individualEligible && p.teachingEligible,
            }
          : null,
    },
    gates: {
      bookingPortalOpen: bookingOpen,
      canAccessBookingPortal,
      serverNow: now.toISOString(),
    },
  });
}
