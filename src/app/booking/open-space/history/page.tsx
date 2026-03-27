import { redirect } from "next/navigation";
import { BookingHistoryPageMain } from "@/components/booking-history-page-main";
import { getSessionFromCookies } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export default async function OpenSpaceBookingHistoryPage() {
  const session = await getSessionFromCookies();
  if (!session) redirect("/login?next=/booking/open-space/history");

  const user = await prisma.user.findUnique({
    where: { id: session.sub },
    include: { profile: true },
  });
  if (user?.profile?.bookingVenueKind !== "open_space") {
    redirect("/booking/history");
  }

  return (
    <BookingHistoryPageMain venueKind="open_space" bookingPathPrefix="/booking/open-space" />
  );
}
