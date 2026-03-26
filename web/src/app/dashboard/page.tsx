import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionFromCookies } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { getEffectiveNow, getPublicSettings, parseInstantSetting } from "@/lib/settings";
import { LogoutButton } from "@/components/logout-button";

export default async function DashboardPage() {
  const session = await getSessionFromCookies();
  if (!session) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.sub },
    include: { profile: true, credentials: true },
  });
  if (!user) redirect("/login");

  const settings = await getPublicSettings();
  const now = await getEffectiveNow();
  const bookingOpens = parseInstantSetting(settings["booking_opens_at"]);
  const bookingOpen = bookingOpens ? now.getTime() >= bookingOpens.getTime() : false;
  const canBook =
    bookingOpen &&
    user.hasCompletedRegistration &&
    user.credentials?.mustChangePassword === false;

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-serif text-3xl text-stone-900">帳戶概覽</h1>
      <p className="mt-2 text-sm text-stone-600">
        {user.profile?.nameZh} · {user.email}
      </p>

      <ul className="mt-10 space-y-3 text-sm">
        <li className="flex justify-between rounded-lg border border-stone-200 bg-white px-4 py-3">
          <span>預約系統狀態</span>
          <span className={bookingOpen ? "text-emerald-700" : "text-amber-700"}>
            {bookingOpen ? "已開放申請" : "尚未開放"}
          </span>
        </li>
        <li className="flex justify-between rounded-lg border border-stone-200 bg-white px-4 py-3">
          <span>可進入預約流程</span>
          <span>{canBook ? "是" : "否（請完成改密碼或等候開放）"}</span>
        </li>
      </ul>

      <div className="mt-10 flex flex-wrap gap-3">
        {canBook ? (
          <Link
            href="/booking"
            className="rounded-full bg-stone-900 px-6 py-2.5 text-sm text-white hover:bg-stone-800"
          >
            進入預約系統
          </Link>
        ) : (
          <span className="rounded-full bg-stone-200 px-6 py-2.5 text-sm text-stone-500">
            預約未開放或須先更改密碼
          </span>
        )}
        <Link
          href="/account/passkeys"
          className="rounded-full border border-stone-300 bg-white px-6 py-2.5 text-sm text-stone-800 hover:bg-stone-50"
        >
          管理通行密鑰
        </Link>
        <LogoutButton />
      </div>
    </main>
  );
}
