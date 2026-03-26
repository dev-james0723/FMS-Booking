import Link from "next/link";
import { redirect } from "next/navigation";
import { AccountDbUnavailable } from "@/components/account-db-unavailable";
import { LogoutButton } from "@/components/logout-button";
import { UserHubAvatarSection } from "@/components/user-hub-avatar-section";
import { getSessionFromCookies } from "@/lib/auth/session";
import { loadUserExistingDayCounts } from "@/lib/booking/day-counts";
import { maxRollingThreeDaySum } from "@/lib/booking/hk-dates";
import { userHasExtendedBookingTier } from "@/lib/booking/limits-tier";
import { mergeConsecutiveSlots } from "@/lib/booking/merge-slots";
import { parseBookingNumericSettings } from "@/lib/booking/settings";
import { withBasePath } from "@/lib/base-path";
import { displayVenueLabel } from "@/lib/booking-slot-display";
import { prisma } from "@/lib/prisma";
import { parseBookingOpensAt } from "@/lib/booking/booking-opens-at";
import { getEffectiveNow, getPublicSettings, parseInstantSetting } from "@/lib/settings";
import { isUnreachableDbError } from "@/lib/settings-fallback";
import { hkDateKey } from "@/lib/time";
import {
  buildBookingCalendarDescription,
  buildGoogleCalendarCreateUrl,
} from "@/lib/venue-calendar";
import type { BookingRequestStatus, Prisma } from "@prisma/client";

export const metadata = {
  title: "我的帳戶｜D Festival × 幻樂空間",
};

const IDENTITY_LABELS: Record<string, string> = {
  student: "學生",
  performer: "個人演奏者",
  freelancer: "自由工作者",
  private_teacher: "私人老師",
  music_tutor: "音樂導師",
  other: "其他",
};

const PREFERRED_TIME_LABELS: Record<string, string> = {
  slot_6_9: "6 AM - 9 AM",
  slot_9_12: "9 AM - 12 NOON",
  slot_12_15: "12 NOON - 3 PM",
  slot_15_18: "3 PM - 6 PM",
  slot_18_20: "6 PM - 8 PM",
};

function formatPreferredDates(raw: Prisma.JsonValue | null | undefined): string {
  if (raw == null) return "—";
  if (Array.isArray(raw)) {
    const dates = raw.filter((x): x is string => typeof x === "string");
    if (dates.length === 0) return "—";
    return dates
      .map((iso) => {
        const [y, mo, da] = iso.split("-").map((x) => parseInt(x, 10));
        if (!y || !mo || !da) return iso;
        return new Date(y, mo - 1, da).toLocaleDateString("zh-HK", {
          year: "numeric",
          month: "long",
          day: "numeric",
          weekday: "short",
        });
      })
      .join("、");
  }
  return String(raw);
}

function formatPreferredTimeText(raw: string | null | undefined): string {
  if (!raw?.trim()) return "—";
  const parts = raw
    .split(/[,，]\s*/)
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length === 0) return raw;
  return parts.map((p) => PREFERRED_TIME_LABELS[p] ?? p).join("、");
}

function statusLabelZh(s: BookingRequestStatus): string {
  const m: Partial<Record<BookingRequestStatus, string>> = {
    pending: "待審核",
    approved: "已批核",
    rejected: "未能安排",
    waitlisted: "後補",
    cancelled: "已取消",
    no_show: "缺席",
    completed: "已完成",
  };
  return m[s] ?? s;
}

const ROLLING_EXAMPLE_DAY_LABELS = ["4 月 5 日", "4 月 6 日", "4 月 7 日"] as const;

/** Greedy split of `rollingMax` across three consecutive HK days, each ≤ `dailyMax`. */
function threeDayRollingSplit(
  dailyMax: number,
  rollingMax: number
): [number, number, number] | null {
  if (rollingMax > 3 * dailyMax) return null;
  const a = Math.min(dailyMax, rollingMax);
  const rem = rollingMax - a;
  const b = Math.min(dailyMax, rem);
  const c = rem - b;
  if (c > dailyMax) return null;
  return [a, b, c];
}

/** Add one session on the latest day that still has same-day headroom; otherwise day 1 (rolling + 同日都可能擋). */
function rollingFailExtra(
  tri: [number, number, number],
  dailyMax: number
): { next: [number, number, number]; idx: 0 | 1 | 2 } {
  const [a, b, c] = tri;
  if (c < dailyMax) return { next: [a, b, c + 1], idx: 2 };
  if (b < dailyMax) return { next: [a, b + 1, c], idx: 1 };
  if (a < dailyMax) return { next: [a + 1, b, c], idx: 0 };
  return { next: [a + 1, b, c], idx: 0 };
}

/**
 * 三日合計 rollingMax−2，再在第三日加 1 節後仍 ≤ rollingMax，且不加爆單日上限。
 */
function passRollingExample(
  dailyMax: number,
  rollingMax: number
): { tri0: [number, number, number]; tri1: [number, number, number]; sumAfter: number } | null {
  const pre = rollingMax - 2;
  if (pre < 0) return null;
  const capThird = dailyMax - 1;
  for (let c = Math.min(capThird, pre); c >= 0; c--) {
    const rem = pre - c;
    if (rem > 2 * dailyMax) continue;
    const a = Math.min(dailyMax, rem);
    const b = rem - a;
    if (b < 0 || b > dailyMax) continue;
    const tri0: [number, number, number] = [a, b, c];
    const tri1: [number, number, number] = [a, b, c + 1];
    const sumAfter = tri1[0] + tri1[1] + tri1[2];
    if (sumAfter <= rollingMax) return { tri0, tri1, sumAfter };
  }
  return null;
}

function buildRollingLimitNarrative(
  dailyMax: number,
  rollingMax: number
): {
  fail: {
    tri: [number, number, number];
    next: [number, number, number];
    extraIdx: 0 | 1 | 2;
    sumAfter: number;
  };
  pass: { tri0: [number, number, number]; tri1: [number, number, number]; sumAfter: number };
} | null {
  if (rollingMax < 2 || dailyMax < 1) return null;
  const tri = threeDayRollingSplit(dailyMax, rollingMax);
  if (!tri) return null;
  const { next, idx } = rollingFailExtra(tri, dailyMax);
  const sumAfter = next[0] + next[1] + next[2];
  if (sumAfter <= rollingMax) return null;

  const pass = passRollingExample(dailyMax, rollingMax);
  if (!pass) return null;

  return {
    fail: { tri, next, extraIdx: idx, sumAfter },
    pass,
  };
}

export default async function AccountPage() {
  const session = await getSessionFromCookies();
  if (!session) redirect("/login?next=/account");

  try {
  const user = await prisma.user.findUnique({
    where: { id: session.sub },
    include: { profile: true, category: true, credentials: true },
  });
  if (!user?.profile) redirect("/login?next=/account");

  const settings = await getPublicSettings();
  const now = await getEffectiveNow();
  const nums = parseBookingNumericSettings(settings as Record<string, unknown>);
  const bookingOpensAt = parseBookingOpensAt(settings["booking_opens_at"]);
  const bookingOpen = bookingOpensAt ? now.getTime() >= bookingOpensAt.getTime() : false;
  const canBook =
    bookingOpen &&
    user.hasCompletedRegistration &&
    user.credentials?.mustChangePassword === false;

  const extended = userHasExtendedBookingTier(user);
  const dailyMax = extended ? nums.teachingMaxPerDay : nums.personalMaxPerDay;
  const rollingMax = extended ? nums.teachingMaxRolling3d : nums.personalMaxRolling3d;
  const todayKey = hkDateKey(now);
  const existingDayCounts = await loadUserExistingDayCounts(user.id);
  const todayCommitted = existingDayCounts.get(todayKey) ?? 0;
  const todayRemaining = Math.max(0, dailyMax - todayCommitted);
  const rollingUsed = maxRollingThreeDaySum(existingDayCounts);
  const rollingStory = buildRollingLimitNarrative(dailyMax, rollingMax);

  const identityFlags = user.profile.identityFlags;
  const identityLines =
    Array.isArray(identityFlags) && identityFlags.length > 0
      ? identityFlags
          .filter((x): x is string => typeof x === "string")
          .map((x) => IDENTITY_LABELS[x] ?? x)
          .join("、")
      : "—";

  const bookings = await prisma.bookingRequest.findMany({
    where: { userId: user.id },
    orderBy: { requestedAt: "desc" },
    take: 40,
    include: {
      allocations: {
        include: { slot: true },
        orderBy: { slot: { startsAt: "asc" } },
      },
    },
  });

  const calDescription = buildBookingCalendarDescription();

  return (
    <main className="mx-auto max-w-3xl space-y-10 px-4 py-12">
      <header>
        <h1 className="font-serif text-3xl text-stone-900 dark:text-stone-50">使用者介面</h1>
        <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">
          {user.profile.nameZh} · {user.email}
        </p>
      </header>

      <UserHubAvatarSection
        initialAnimal={user.profile.favoriteAvatarAnimal}
        initialImageDataUrl={user.profile.avatarImageDataUrl}
      />

      <section className="rounded-2xl border border-stone-200 dark:border-stone-700 bg-surface p-6 shadow-sm">
        <h2 className="font-serif text-xl text-stone-900 dark:text-stone-50">預約節數上限（30 分鐘 = 1 節）</h2>
        <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">
          你的分類：
          <span className="font-medium text-stone-800 dark:text-stone-200">
            {extended
              ? "延伸配額（教學／學生或導師相關身份）"
              : "一般使用者"}
          </span>
          。同一日最多 {dailyMax} 節；任何連續 3 個香港曆日內最多 {rollingMax} 節。
        </p>
        <ul className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
          <li className="rounded-lg bg-stone-50 dark:bg-stone-900 px-3 py-2">
            今日（{todayKey}）已用：<span className="font-semibold">{todayCommitted}</span> 節
          </li>
          <li className="rounded-lg bg-stone-50 dark:bg-stone-900 px-3 py-2">
            今日尚可預約（同日上限內）：<span className="font-semibold">{todayRemaining}</span> 節
          </li>
          <li className="rounded-lg bg-stone-50 dark:bg-stone-900 px-3 py-2 sm:col-span-2">
            目前「滑動 3 日」* 合計已用：<span className="font-semibold">{rollingUsed}</span> /{" "}
            {rollingMax} 節（提交新預約時系統會再連同新選時段驗證）
          </li>
        </ul>
        <div className="mt-3 space-y-2 text-xs leading-relaxed text-stone-500 dark:text-stone-500">
          <p>
            <span className="font-semibold text-stone-600 dark:text-stone-400">*</span>{" "}
            備註：「滑動 3 日」指以<strong className="font-medium text-stone-700 dark:text-stone-300">香港曆日</strong>
            計算，系統會檢視<strong className="font-medium text-stone-700 dark:text-stone-300">任意連續三個曆日</strong>
            （例如 4 月 5、6、7 日）內已預約節數的總和；上列數字為所有此類三日區間中的
            <strong className="font-medium text-stone-700 dark:text-stone-300">最大</strong>
            合計。隨著日期向前推進，適用的三日範圍亦會跟著更替，故稱「滑動」，並非固定某三天（例如固定週一至週三）。提交新預約時會連同新選時段一併驗證。
          </p>
          <p>
            <span className="font-medium text-stone-600 dark:text-stone-400">例子（陳小明）</span>
            — 以下以你<strong className="font-medium text-stone-700 dark:text-stone-300">目前帳戶分類</strong>為準：單日最多{" "}
            <strong className="font-medium text-stone-700 dark:text-stone-300">{dailyMax}</strong> 節，任何連續三曆日最多{" "}
            <strong className="font-medium text-stone-700 dark:text-stone-300">{rollingMax}</strong> 節。
          </p>
          {rollingStory ? (
            <ul className="list-disc space-y-1.5 pl-4 text-stone-500 dark:text-stone-500">
              <li>
                <span className="font-medium text-stone-600 dark:text-stone-400">不能預約：</span>
                陳小明在 {ROLLING_EXAMPLE_DAY_LABELS[0]}、{ROLLING_EXAMPLE_DAY_LABELS[1]}、
                {ROLLING_EXAMPLE_DAY_LABELS[2]} 三日（依序）已有 {rollingStory.fail.tri[0]}、
                {rollingStory.fail.tri[1]}、{rollingStory.fail.tri[2]} 節，合計剛好{" "}
                {rollingMax} 節。若他再選一段落在 {ROLLING_EXAMPLE_DAY_LABELS[rollingStory.fail.extraIdx]}
                ，系統檢視「4/5–4/7」這個連續三日窗口，合計變成{" "}
                {rollingStory.fail.next.join(" + ")} = {rollingStory.fail.sumAfter} 節，超過 {rollingMax}{" "}
                節，故無法提交。此例重點在於：「滑動三日」總和一旦已滿，即使加選當日於單日上限內仍有空位，系統仍會擋下（提交時「滑動三日」與「單日上限」會一併驗證）。
              </li>
              <li>
                <span className="font-medium text-stone-600 dark:text-stone-400">可以預約：</span>
                若改為 {ROLLING_EXAMPLE_DAY_LABELS[0]} {rollingStory.pass.tri0[0]} 節、
                {ROLLING_EXAMPLE_DAY_LABELS[1]} {rollingStory.pass.tri0[1]} 節、{ROLLING_EXAMPLE_DAY_LABELS[2]}{" "}
                {rollingStory.pass.tri0[2]} 節（三日先合共 {rollingMax - 2} 節），再於 {ROLLING_EXAMPLE_DAY_LABELS[2]}{" "}
                加 1 節，窗口變成 {rollingStory.pass.tri1.join(" + ")} = {rollingStory.pass.sumAfter} 節，不高於{" "}
                {rollingMax} 節，且第三日僅 {rollingStory.pass.tri1[2]} 節，亦未超單日 {dailyMax} 節，即可通過。
              </li>
              <li>
                <span className="font-medium text-stone-600 dark:text-stone-400">「滑動」的含意：</span>
                當較早的預約日已過或他改到較後的日期，系統改以 4/6–4/8、4/7–4/9
                等<strong className="font-medium text-stone-700 dark:text-stone-300">較新的連續三日</strong>
                重算；因此未必永遠被同一組「4/5–4/7」卡住——只要<strong className="font-medium text-stone-700 dark:text-stone-300">每一個</strong>
                連續三日窗口的節數加總都不超 {rollingMax} 即可。
              </li>
            </ul>
          ) : (
            <ul className="list-disc space-y-1.5 pl-4 text-stone-500 dark:text-stone-500">
              <li>
                <span className="font-medium text-stone-600 dark:text-stone-400">不能預約：</span>
                當某一組連續三日內，已批核／待審核的節數加總已達 {rollingMax}，再於這三天中的任何一日加選新節，都會令至少一個三日窗口超標，系統即會拒絕。
              </li>
              <li>
                <span className="font-medium text-stone-600 dark:text-stone-400">可以預約：</span>
                只要<strong className="font-medium text-stone-700 dark:text-stone-300">每一個</strong>連續三日窗口的加總都不超過{" "}
                {rollingMax} 節，且<strong className="font-medium text-stone-700 dark:text-stone-300">每一日</strong>亦不多於 {dailyMax}{" "}
                節，即可提交。
              </li>
              <li>
                <span className="font-medium text-stone-600 dark:text-stone-400">「滑動」的含意：</span>
                隨日期推進，系統會改以較新的連續三日（例如 4/6–4/8）重算，而非固定週一至週三；故限制會「跟住日曆滑動」。
              </li>
            </ul>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-stone-200 dark:border-stone-700 bg-surface p-6 shadow-sm">
        <h2 className="font-serif text-xl text-stone-900 dark:text-stone-50">個人及聯絡</h2>
        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex flex-wrap justify-between gap-2 border-b border-stone-100 dark:border-stone-800 py-2">
            <dt className="text-stone-500 dark:text-stone-500">電郵</dt>
            <dd className="text-right font-medium text-stone-900 dark:text-stone-50">{user.email}</dd>
          </div>
          <div className="flex flex-wrap justify-between gap-2 border-b border-stone-100 dark:border-stone-800 py-2">
            <dt className="text-stone-500 dark:text-stone-500">電話</dt>
            <dd className="text-right font-medium text-stone-900 dark:text-stone-50">{user.profile.phone}</dd>
          </div>
          <div className="flex flex-wrap justify-between gap-2 border-b border-stone-100 dark:border-stone-800 py-2">
            <dt className="text-stone-500 dark:text-stone-500">身份標籤</dt>
            <dd className="max-w-md text-right text-stone-800 dark:text-stone-200">{identityLines}</dd>
          </div>
        </dl>
      </section>

      <section className="rounded-2xl border border-stone-200 dark:border-stone-700 bg-surface p-6 shadow-sm">
        <h2 className="font-serif text-xl text-stone-900 dark:text-stone-50">預約偏好（登記時填寫）</h2>
        <dl className="mt-4 space-y-2 text-sm">
          <div className="border-b border-stone-100 dark:border-stone-800 py-2">
            <dt className="text-stone-500 dark:text-stone-500">希望使用日期</dt>
            <dd className="mt-1 text-stone-800 dark:text-stone-200">{formatPreferredDates(user.profile.preferredDates)}</dd>
          </div>
          <div className="border-b border-stone-100 dark:border-stone-800 py-2">
            <dt className="text-stone-500 dark:text-stone-500">希望使用時段</dt>
            <dd className="mt-1 text-stone-800 dark:text-stone-200">
              {formatPreferredTimeText(user.profile.preferredTimeText)}
            </dd>
          </div>
          {user.profile.wantsConsecutiveSlots != null && (
            <div className="border-b border-stone-100 dark:border-stone-800 py-2">
              <dt className="text-stone-500 dark:text-stone-500">偏好連續時段</dt>
              <dd className="mt-1 text-stone-800 dark:text-stone-200">
                {user.profile.wantsConsecutiveSlots ? "希望盡量連續" : "不必連續"}
              </dd>
            </div>
          )}
        </dl>
      </section>

      <section className="rounded-2xl border border-stone-200 dark:border-stone-700 bg-surface p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <h2 className="font-serif text-xl text-stone-900 dark:text-stone-50">預約紀錄（已合併連續時段）</h2>
          <div className="flex flex-wrap gap-2">
            <a
              href={withBasePath("/api/v1/account/bookings.ics")}
              className="rounded-full border border-stone-300 dark:border-stone-600 bg-surface px-4 py-2 text-xs font-medium text-stone-800 dark:text-stone-200 hover:bg-stone-50 dark:hover:bg-stone-800"
              download
            >
              下載 .ics（匯入 Google 日曆）
            </a>
          </div>
        </div>
        <p className="mt-2 text-xs text-stone-500 dark:text-stone-500">
          日曆內容會附帶地址、守則連結、密碼與入場須知（請於 .env 設定 VENUE_* 變數）。亦可以逐段按下方「加入
          Google 日曆」。
        </p>

        <ul className="mt-6 space-y-6">
          {bookings.length === 0 && (
            <li className="text-sm text-stone-500 dark:text-stone-500">暫未有預約紀錄。</li>
          )}
          {bookings.map((b) => {
            const slots = b.allocations.map((a) => ({
              startsAt: a.slot.startsAt,
              endsAt: a.slot.endsAt,
              venueLabel: a.slot.venueLabel,
            }));
            const merged = mergeConsecutiveSlots(slots);
            return (
              <li key={b.id} className="rounded-xl border border-stone-100 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/80 dark:bg-stone-900/80 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-stone-900 dark:text-stone-50">
                    狀態：{statusLabelZh(b.status)}
                  </span>
                  <span className="text-xs text-stone-500 dark:text-stone-500">
                    預約時間：{b.requestedAt.toLocaleString("zh-HK", { timeZone: "Asia/Hong_Kong" })}
                  </span>
                </div>
                <ul className="mt-3 space-y-3 text-sm">
                  {merged.map((m, idx) => (
                    <li
                      key={`${b.id}-${idx}`}
                      className="rounded-lg border border-stone-100 bg-surface px-3 py-2 shadow-sm dark:border-stone-800"
                    >
                      <p className="font-medium text-stone-800 dark:text-stone-200">
                        {m.start.toLocaleString("zh-HK", {
                          timeZone: "Asia/Hong_Kong",
                          weekday: "short",
                          month: "numeric",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}{" "}
                        —{" "}
                        {m.end.toLocaleString("zh-HK", {
                          timeZone: "Asia/Hong_Kong",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                        <span className="ml-2 text-stone-500 dark:text-stone-500">
                          （{m.sessionCount} 節 · {displayVenueLabel(m.venueLabel)}）
                        </span>
                      </p>
                      <a
                        href={buildGoogleCalendarCreateUrl({
                          title: `幻樂空間 · Room No.2｜${m.sessionCount} 節`,
                          start: m.start,
                          end: m.end,
                          description: [
                            `預約編號：${b.id}`,
                            `狀態：${statusLabelZh(b.status)}`,
                            calDescription,
                          ].join("\n\n"),
                        })}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-block text-xs font-medium text-violet-700 underline"
                      >
                        加入 Google 日曆（此段）
                      </a>
                    </li>
                  ))}
                </ul>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="rounded-2xl border border-stone-200 dark:border-stone-700 bg-surface p-6 shadow-sm">
        <h2 className="font-serif text-xl text-stone-900 dark:text-stone-50">捷徑</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          {canBook ? (
            <Link
              href="/booking"
              className="rounded-full bg-stone-900 px-6 py-2.5 text-sm text-white hover:bg-stone-800"
            >
              前往預約時段
            </Link>
          ) : (
            <span className="rounded-full bg-stone-200 px-6 py-2.5 text-sm text-stone-500 dark:text-stone-500">
              預約未開放或須先更改密碼
            </span>
          )}
          <Link
            href="/account/passkeys"
            className="rounded-full border border-stone-300 dark:border-stone-600 bg-surface px-6 py-2.5 text-sm text-stone-800 dark:text-stone-200 hover:bg-stone-50 dark:hover:bg-stone-800"
          >
            管理通行密鑰
          </Link>
          <Link href="/booking/history" className="text-sm text-stone-700 dark:text-stone-300 underline">
            文字版預約紀錄
          </Link>
        </div>
      </section>

      <div className="flex flex-wrap gap-3 border-t border-stone-200 dark:border-stone-700 pt-8">
        <LogoutButton />
        <Link href="/" className="rounded-full border border-stone-300 dark:border-stone-600 px-6 py-2.5 text-sm text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800">
          返回主頁
        </Link>
      </div>
    </main>
  );
  } catch (e) {
    if (isUnreachableDbError(e)) {
      return <AccountDbUnavailable email={session.email} />;
    }
    throw e;
  }
}
