import { redirect } from "next/navigation";
import { BookingPortalPageMain } from "@/components/booking-portal-page-main";
import { getSessionFromCookies } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export default async function BookingPortalPage() {
  const session = await getSessionFromCookies();
  if (!session) redirect("/login?next=/booking");

  const user = await prisma.user.findUnique({
    where: { id: session.sub },
    include: { profile: true },
  });
  if (user?.profile?.bookingVenueKind === "open_space") {
    redirect("/booking/open-space");
  }

  return <BookingPortalPageMain variant="studio" />;
}
