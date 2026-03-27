import { redirect } from "next/navigation";
import { BookingHistoryPageMain } from "@/components/booking-history-page-main";
import { getSessionFromCookies } from "@/lib/auth/session";

export default async function BookingHistoryPage() {
  const session = await getSessionFromCookies();
  if (!session) redirect("/login?next=/booking/history");

  return <BookingHistoryPageMain />;
}
