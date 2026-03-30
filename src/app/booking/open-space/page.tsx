import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { BookingPortalPageMain } from "@/components/booking-portal-page-main";
import { getSessionFromCookies } from "@/lib/auth/session";
import { serverLocaleFromCookies, serverT } from "@/lib/i18n/server-translate";
import { prisma } from "@/lib/prisma";
import { userMayAccessBookingVenue } from "@/lib/booking/venue-kind";

const TITLE_SUFFIX = "｜D Festival × 幻樂空間";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await serverLocaleFromCookies();
  return {
    title: `${serverT(locale, "booking.openSpacePortal.title")}${TITLE_SUFFIX}`,
  };
}

export default async function OpenSpaceBookingPortalPage() {
  const session = await getSessionFromCookies();
  if (!session) redirect("/login?next=/booking/open-space");

  const user = await prisma.user.findUnique({
    where: { id: session.sub },
    include: { profile: true },
  });
  if (
    !user?.profile ||
    !userMayAccessBookingVenue(user.profile.bookingVenueKind, "open_space")
  ) {
    redirect("/booking");
  }

  return <BookingPortalPageMain variant="open_space" />;
}
