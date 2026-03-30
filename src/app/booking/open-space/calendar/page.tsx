import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { BookingCalendarPageMain } from "@/components/booking-calendar-page-main";
import { getSessionFromCookies } from "@/lib/auth/session";
import { serverLocaleFromCookies, serverT } from "@/lib/i18n/server-translate";
import { prisma } from "@/lib/prisma";
import { userMayAccessBookingVenue } from "@/lib/booking/venue-kind";

const TITLE_SUFFIX = "｜D Festival × 幻樂空間";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await serverLocaleFromCookies();
  return {
    title: `${serverT(locale, "booking.calendarPage.titleOpenSpace")}${TITLE_SUFFIX}`,
  };
}

export default async function OpenSpaceBookingCalendarPage() {
  const session = await getSessionFromCookies();
  if (!session) redirect("/login?next=/booking/open-space/calendar");

  const user = await prisma.user.findUnique({
    where: { id: session.sub },
    include: { profile: true },
  });
  if (
    !user?.profile ||
    !userMayAccessBookingVenue(user.profile.bookingVenueKind, "open_space")
  ) {
    redirect("/booking/calendar");
  }

  const locale = await serverLocaleFromCookies();
  const title = serverT(locale, "booking.calendarPage.titleOpenSpace");
  const intro = serverT(locale, "booking.calendarPage.intro");

  return (
    <BookingCalendarPageMain
      title={title}
      intro={intro}
      venueKind="open_space"
      bookingPathPrefix="/booking/open-space"
    />
  );
}
