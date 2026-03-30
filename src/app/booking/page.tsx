import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { BookingPortalPageMain } from "@/components/booking-portal-page-main";
import { getSessionFromCookies } from "@/lib/auth/session";
import { serverLocaleFromCookies, serverT } from "@/lib/i18n/server-translate";
import { prisma } from "@/lib/prisma";

const TITLE_SUFFIX = "｜D Festival × 幻樂空間";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await serverLocaleFromCookies();
  return {
    title: `${serverT(locale, "booking.portal.title")}${TITLE_SUFFIX}`,
  };
}

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
