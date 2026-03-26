import Link from "next/link";
import { redirect } from "next/navigation";
import { BookingCalendarOverviewPanel } from "@/components/booking-calendar-overview-panel";
import { getSessionFromCookies } from "@/lib/auth/session";

export default async function BookingCalendarOverviewPage() {
  const session = await getSessionFromCookies();
  if (!session) redirect("/login?next=/booking/calendar");

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-serif text-3xl text-stone-900 dark:text-stone-50">預約月曆總覽</h1>
      <p className="mt-3 text-sm text-stone-600 dark:text-stone-400">
        以月曆與時間軸一目了然查看 2026 年 4 月 3 日至 5 月 3 日各日時段（首日 11:00 起，其餘日 06:00
        起）：已滿與仍可預約時段以紅／綠標示（香港時間）。
      </p>
      <div className="mt-10">
        <BookingCalendarOverviewPanel />
      </div>
      <div className="mt-12 flex flex-wrap gap-4 text-sm">
        <Link href="/booking" className="text-stone-800 dark:text-stone-200 underline">
          返回預約
        </Link>
        <Link href="/booking/history" className="text-stone-600 dark:text-stone-400 underline">
          預約紀錄
        </Link>
        <Link href="/account" className="text-stone-600 dark:text-stone-400 underline">
          我的帳戶
        </Link>
      </div>
    </main>
  );
}
