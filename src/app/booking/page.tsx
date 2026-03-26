import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionFromCookies } from "@/lib/auth/session";
import { BookingRequestPanel } from "@/components/booking-request-panel";

export default async function BookingPortalPage() {
  const session = await getSessionFromCookies();
  if (!session) redirect("/login?next=/booking");

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-serif text-3xl text-stone-900 dark:text-stone-50">預約系統</h1>
      <p className="mt-3 text-sm text-stone-600 dark:text-stone-400">
        請選擇時段後提交預約。所有預約均需主辦方審核，並非自動確認。
      </p>
      <div className="mt-10">
        <BookingRequestPanel />
      </div>
      <div className="mt-12 flex flex-wrap gap-4 text-sm">
        <Link href="/booking/calendar" className="text-stone-800 dark:text-stone-200 underline">
          月曆總覽（時間軸）
        </Link>
        <Link href="/booking/history" className="text-stone-800 dark:text-stone-200 underline">
          預約紀錄
        </Link>
        <Link href="/account" className="text-stone-600 dark:text-stone-400 underline">
          我的帳戶
        </Link>
        <Link href="/" className="text-stone-600 dark:text-stone-400 underline">
          主頁
        </Link>
      </div>
    </main>
  );
}

