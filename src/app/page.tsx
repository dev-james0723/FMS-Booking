import Link from "next/link";
import { BookingCountdown } from "@/components/booking-countdown";
import { HomePartnerLogos } from "@/components/home-partner-logos";
import {
  getAllSettings,
  getEffectiveNowFromSettings,
  parseInstantSetting,
  PUBLIC_SETTING_KEYS,
} from "@/lib/settings";

export default async function HomePage() {
  const all = await getAllSettings();
  const settings: Record<string, unknown> = {};
  for (const k of PUBLIC_SETTING_KEYS) {
    if (k in all) settings[k] = all[k];
  }
  const bookingOpensRaw = settings["booking_opens_at"];
  const bookingOpensAt =
    typeof bookingOpensRaw === "string" ? bookingOpensRaw : null;
  const bookingOpensDate = parseInstantSetting(bookingOpensRaw);
  const now = getEffectiveNowFromSettings(all);
  const bookingLive = bookingOpensDate ? now.getTime() >= bookingOpensDate.getTime() : false;
  const bookingOpensAtLabel =
    bookingOpensAt != null
      ? new Date(bookingOpensAt).toLocaleString("zh-HK", {
          timeZone: "Asia/Hong_Kong",
        })
      : null;

  return (
    <main className="mx-auto max-w-5xl px-4 pb-16 pt-6 sm:pt-8">
      <HomePartnerLogos />
      <p className="text-center text-sm uppercase tracking-[0.2em] text-stone-500">
        D Festival × Fantasia Music Space
      </p>
      <h1 className="mt-4 text-center font-serif text-4xl leading-tight text-stone-900 sm:text-5xl">
        限時免費琴室體驗申請
      </h1>
      <p className="mx-auto mt-6 max-w-2xl text-center text-stone-600">
        由 D Festival 青年鋼琴家藝術節與幻樂空間攜手推出，並由香港幻樂國際音樂管理公司贊助。2026 年 4
        月期間限時免費開放予本地音樂工作者申請，用作練習、排練、試奏及錄影前綵排等音樂相關用途。
      </p>

      <div className="mx-auto mt-12 max-w-lg">
        <BookingCountdown
          bookingOpensAtIso={bookingOpensAt}
          bookingOpensAtLabel={bookingOpensAtLabel}
          initialNowMs={now.getTime()}
        />
      </div>

      <div className="mt-14 flex flex-col items-center justify-center gap-4 sm:flex-row">
        <Link
          href="/register"
          className="w-full rounded-full border border-stone-400 px-8 py-3 text-center text-sm font-medium text-stone-900 transition hover:bg-white sm:w-auto"
        >
          登記資料及建立帳戶
        </Link>
        <Link
          href="/login?next=/booking"
          className={`w-full rounded-full px-8 py-3 text-center text-sm font-medium text-white transition sm:w-auto ${
            bookingLive ? "bg-stone-900 hover:bg-stone-800" : "bg-stone-400"
          }`}
        >
          預約系統登入
        </Link>
      </div>
      {!bookingLive && (
        <p className="mt-4 text-center text-xs text-stone-500">
          預約申請將於開放時間後啟用；你仍可先完成登記及建立帳戶。
        </p>
      )}

      <section className="mt-24 grid gap-10 border-t border-stone-200/80 pt-16 sm:grid-cols-3">
        <div>
          <h2 className="font-serif text-lg text-stone-900">雙 Portal</h2>
          <p className="mt-2 text-sm text-stone-600">
            登記與預約分開處理：新參加者先提交資料並建立帳戶，預約開放後即可登入申請時段。
          </p>
        </div>
        <div>
          <h2 className="font-serif text-lg text-stone-900">申請制預約</h2>
          <p className="mt-2 text-sm text-stone-600">
            所有預約均為申請，由主辦方審核及分配；提交後你將收到電郵通知進度。
          </p>
        </div>
        <div>
          <h2 className="font-serif text-lg text-stone-900">禮遇與追蹤</h2>
          <p className="mt-2 text-sm text-stone-600">
            合資格參加者可獲 D Festival／D Masters 專屬禮遇與推薦機制（詳情見登入後帳戶內說明）。
          </p>
        </div>
      </section>
    </main>
  );
}
