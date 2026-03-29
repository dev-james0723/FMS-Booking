import { redirect } from "next/navigation";
import { BookingPortalPageMain } from "@/components/booking-portal-page-main";
import { getSessionFromCookies } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { userMayAccessBookingVenue } from "@/lib/booking/venue-kind";

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
