import Link from "next/link";
import { BookingCountdown } from "@/components/booking-countdown";
import { BookingOpensCalendarReminder } from "@/components/booking-opens-calendar-reminder";
import { HomePartnerLogos } from "@/components/home-partner-logos";
import { CAMPAIGN_EXPERIENCE_RANGE_LABEL_ZH } from "@/lib/booking/campaign-constants";
import { parseBookingOpensAt } from "@/lib/booking/booking-opens-at";
import {
  getAllSettings,
  getEffectiveNowFromSettings,
  PUBLIC_SETTING_KEYS,
} from "@/lib/settings";
import { formatInstantForBookingOpensZhHk } from "@/lib/time";
import { getVenueCalendarEnv } from "@/lib/venue-calendar";

export default async function HomePage() {
  const all = await getAllSettings();
  const settings: Record<string, unknown> = {};
  for (const k of PUBLIC_SETTING_KEYS) {
    if (k in all) settings[k] = all[k];
  }
  const bookingOpensRaw = settings["booking_opens_at"];
  const bookingOpensDate = parseBookingOpensAt(bookingOpensRaw);
  /** UTC ISO so the countdown matches SSR and all browsers (see parseInstantSetting). */
  const bookingOpensAt = bookingOpensDate?.toISOString() ?? null;
  const now = getEffectiveNowFromSettings(all);
  const bookingLive = bookingOpensDate ? now.getTime() >= bookingOpensDate.getTime() : false;
  const bookingOpensAtLabel =
    bookingOpensDate != null
      ? formatInstantForBookingOpensZhHk(bookingOpensDate)
      : null;
  const venueAddressZh = getVenueCalendarEnv().address;

  return (
    <main className="mx-auto max-w-5xl px-4 pb-16 pt-6 sm:pt-8">
      <HomePartnerLogos />
      <p className="text-center text-sm uppercase tracking-[0.2em] text-stone-500 dark:text-stone-400">
        D Festival × Fantasia Music Space
      </p>
      <h1 className="mt-4 text-center font-serif text-4xl leading-tight text-stone-900 dark:text-stone-50 sm:text-5xl">
        限時免費琴室體驗預約
      </h1>
      <p className="mx-auto mt-6 max-w-2xl text-center text-stone-600 dark:text-stone-400">
        由 D Festival 青年鋼琴家藝術節與幻樂空間攜手推出，並由香港幻樂國際音樂管理公司贊助。
        {CAMPAIGN_EXPERIENCE_RANGE_LABEL_ZH}期間，限時免費開放予本地音樂工作者預約，用作練習、排練、試奏及錄影前綵排等音樂相關用途。首日（4 月 3
        日）場地開放時間為 11:00–20:00，其餘活動日為 06:00–20:00（香港時間）。
      </p>

      <div className="mx-auto mt-12 max-w-lg space-y-6">
        <Link
          href="/register"
          className="block rounded-xl border border-stone-200 dark:border-stone-700 bg-surface px-6 py-5 text-center text-sm font-medium text-stone-900 dark:text-stone-50 shadow-sm transition hover:bg-stone-50 dark:hover:bg-stone-800"
        >
          登記資料及建立帳戶
        </Link>
        <BookingOpensCalendarReminder
          bookingOpensAtIso={bookingOpensAt}
          bookingLive={bookingLive}
          venueAddressZh={venueAddressZh}
        />
        <BookingCountdown
          bookingOpensAtIso={bookingOpensAt}
          bookingOpensAtLabel={bookingOpensAtLabel}
          initialNowMs={now.getTime()}
        />
      </div>

      <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
        <Link
          href="/login?next=/booking"
          className={`w-full rounded-full px-8 py-3 text-center text-sm font-medium text-white transition sm:w-auto ${
            bookingLive
              ? "bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-stone-200"
              : "bg-stone-400 dark:bg-stone-600"
          }`}
        >
          預約系統登入
        </Link>
      </div>
      {!bookingLive && (
        <p className="mt-4 text-center text-xs text-stone-500 dark:text-stone-500">
          預約將於開放時間後啟用；您仍可先完成登記及建立帳戶。
        </p>
      )}
    </main>
  );
}
