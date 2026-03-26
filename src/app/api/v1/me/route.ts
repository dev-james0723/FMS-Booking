import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk } from "@/lib/api-response";
import { getSessionFromCookies } from "@/lib/auth/session";
import { parseBookingOpensAt } from "@/lib/booking/booking-opens-at";
import { getEffectiveNow, getPublicSettings, parseInstantSetting } from "@/lib/settings";

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

  return jsonOk({
    user: {
      id: user.id,
      email: user.email,
      accountStatus: user.accountStatus,
      hasCompletedRegistration: user.hasCompletedRegistration,
      mustChangePassword: user.credentials?.mustChangePassword ?? true,
      profile: user.profile,
      category: user.category,
    },
    gates: {
      bookingPortalOpen: bookingOpen,
      canAccessBookingPortal,
      serverNow: now.toISOString(),
    },
  });
}
