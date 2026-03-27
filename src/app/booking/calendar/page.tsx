import { redirect } from "next/navigation";
import { BookingCalendarPageMain } from "@/components/booking-calendar-page-main";
import { getSessionFromCookies } from "@/lib/auth/session";

export default async function BookingCalendarOverviewPage() {
  const session = await getSessionFromCookies();
  if (!session) redirect("/login?next=/booking/calendar");

  return <BookingCalendarPageMain />;
}
