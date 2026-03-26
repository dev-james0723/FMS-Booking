import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionFromCookies } from "@/lib/auth/session";
import { BookingRequestPanel } from "@/components/booking-request-panel";

export default async function BookingPortalPage() {
  const session = await getSessionFromCookies();
  if (!session) redirect("/login?next=/booking");

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-serif text-3xl text-stone-900">預約系統</h1>
      <p className="mt-3 text-sm text-stone-600">
        請選擇時段後提交申請。所有申請均需主辦方審核，並非自動確認。
      </p>
      <div className="mt-10">
        <BookingRequestPanel />
      </div>
      <div className="mt-12 flex gap-4 text-sm">
        <Link href="/booking/history" className="text-stone-800 underline">
          申請紀錄
        </Link>
        <Link href="/dashboard" className="text-stone-600 underline">
          帳戶概覽
        </Link>
        <Link href="/" className="text-stone-600 underline">
          主頁
        </Link>
      </div>
    </main>
  );
}

