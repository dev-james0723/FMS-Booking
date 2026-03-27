import { redirect } from "next/navigation";
import { BookingCalendarPageMain } from "@/components/booking-calendar-page-main";
import { getSessionFromCookies } from "@/lib/auth/session";
import { serverLocaleFromCookies, serverT } from "@/lib/i18n/server-translate";
import { prisma } from "@/lib/prisma";

export default async function OpenSpaceBookingCalendarPage() {
  const session = await getSessionFromCookies();
  if (!session) redirect("/login?next=/booking/open-space/calendar");

  const user = await prisma.user.findUnique({
    where: { id: session.sub },
    include: { profile: true },
  });
  if (user?.profile?.bookingVenueKind !== "open_space") {
    redirect("/booking/calendar");
  }

  const locale = await serverLocaleFromCookies();
  const title = serverT(locale, "booking.calendarPage.title");
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
