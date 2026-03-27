import { redirect } from "next/navigation";
import { BookingCalendarPageMain } from "@/components/booking-calendar-page-main";
import { getSessionFromCookies } from "@/lib/auth/session";
import { serverLocaleFromCookies, serverT } from "@/lib/i18n/server-translate";
import { prisma } from "@/lib/prisma";

export default async function BookingCalendarOverviewPage() {
  const session = await getSessionFromCookies();
  if (!session) redirect("/login?next=/booking/calendar");

  const user = await prisma.user.findUnique({
    where: { id: session.sub },
    include: { profile: true },
  });
  if (user?.profile?.bookingVenueKind === "open_space") {
    redirect("/booking/open-space/calendar");
  }

  const locale = await serverLocaleFromCookies();
  const title = serverT(locale, "booking.calendarPage.title");
  const intro = serverT(locale, "booking.calendarPage.intro");

  return (
    <BookingCalendarPageMain
      title={title}
      intro={intro}
      venueKind="studio_room"
      bookingPathPrefix="/booking"
    />
  );
}
