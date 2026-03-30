import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { BookingHistoryPageMain } from "@/components/booking-history-page-main";
import { getSessionFromCookies } from "@/lib/auth/session";
import { isGoogleCalendarUserOAuthConfigured } from "@/lib/calendar/google-user-calendar";
import { serverLocaleFromCookies, serverT } from "@/lib/i18n/server-translate";
import { userMayAccessBookingVenue } from "@/lib/booking/venue-kind";
import { prisma } from "@/lib/prisma";

const TITLE_SUFFIX = "｜D Festival × 幻樂空間";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await serverLocaleFromCookies();
  return {
    title: `${serverT(locale, "booking.historyPage.titleOpenSpace")}${TITLE_SUFFIX}`,
  };
}

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
