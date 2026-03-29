import { redirect } from "next/navigation";
import { BookingHistoryPageMain } from "@/components/booking-history-page-main";
import { getSessionFromCookies } from "@/lib/auth/session";
import { isGoogleCalendarUserOAuthConfigured } from "@/lib/calendar/google-user-calendar";
import { userMayAccessBookingVenue } from "@/lib/booking/venue-kind";
import { prisma } from "@/lib/prisma";

export default async function OpenSpaceBookingHistoryPage() {
  const session = await getSessionFromCookies();
  if (!session) redirect("/login?next=/booking/open-space/history");

  const user = await prisma.user.findUnique({
    where: { id: session.sub },
    include: { profile: true },
  });
  if (
    !user?.profile ||
    !userMayAccessBookingVenue(user.profile.bookingVenueKind, "open_space")
  ) {
    redirect("/booking/history");
  }

  return (
    <BookingHistoryPageMain
      venueKind="open_space"
      bookingPathPrefix="/booking/open-space"
      googleCalendarOAuthReady={isGoogleCalendarUserOAuthConfigured()}
      googleCalendarLinked={Boolean(user?.googleCalendarRefreshToken?.trim())}
    />
  );
}
