import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { BookingHistoryPageMain } from "@/components/booking-history-page-main";
import { getSessionFromCookies } from "@/lib/auth/session";
import { isGoogleCalendarUserOAuthConfigured } from "@/lib/calendar/google-user-calendar";
import { serverLocaleFromCookies, serverT } from "@/lib/i18n/server-translate";
import { prisma } from "@/lib/prisma";

const TITLE_SUFFIX = "｜D Festival × 幻樂空間";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await serverLocaleFromCookies();
  return {
    title: `${serverT(locale, "booking.historyPage.titleStudioRoom")}${TITLE_SUFFIX}`,
  };
}

export default async function BookingHistoryPage() {
  const session = await getSessionFromCookies();
  if (!session) redirect("/login?next=/booking/history");

  const user = await prisma.user.findUnique({
    where: { id: session.sub },
    include: { profile: true },
  });
  if (user?.profile?.bookingVenueKind === "open_space") {
    redirect("/booking/open-space/history");
  }

  return (
    <BookingHistoryPageMain
      venueKind="studio_room"
      bookingPathPrefix="/booking"
      googleCalendarOAuthReady={isGoogleCalendarUserOAuthConfigured()}
      googleCalendarLinked={Boolean(user?.googleCalendarRefreshToken?.trim())}
    />
  );
}
