import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionFromCookies } from "@/lib/auth/session";
import { BookingHistoryPanel } from "@/components/booking-history-panel";

export default async function BookingHistoryPage() {
  const session = await getSessionFromCookies();
  if (!session) redirect("/login?next=/booking/history");

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-serif text-3xl text-stone-900">預約申請紀錄</h1>
      <p className="mt-2 text-sm text-stone-600">狀態由主辦方更新；如有疑問請聯絡客服。</p>
      <div className="mt-8">
        <BookingHistoryPanel />
      </div>
      <Link href="/booking" className="mt-10 inline-block text-sm text-stone-800 underline">
        返回預約系統
      </Link>
    </main>
  );
}
