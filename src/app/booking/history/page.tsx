import { redirect } from "next/navigation";
import { BookingHistoryPageMain } from "@/components/booking-history-page-main";
import { getSessionFromCookies } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

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

  return <BookingHistoryPageMain venueKind="studio_room" bookingPathPrefix="/booking" />;
}
