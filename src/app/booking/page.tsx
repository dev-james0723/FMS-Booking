import { redirect } from "next/navigation";
import { BookingPortalPageMain } from "@/components/booking-portal-page-main";
import { getSessionFromCookies } from "@/lib/auth/session";

export default async function BookingPortalPage() {
  const session = await getSessionFromCookies();
  if (!session) redirect("/login?next=/booking");

  return <BookingPortalPageMain />;
}

