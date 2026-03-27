"use client";

import Link from "next/link";
import type { BookingRequestStatus } from "@prisma/client";
import { LogoutButton } from "@/components/logout-button";
import { UserHubAvatarSection } from "@/components/user-hub-avatar-section";
import { displayVenueLabel } from "@/lib/booking-slot-display";
import { useTranslation } from "@/lib/i18n/use-translation";
import type { Locale } from "@/lib/i18n/types";
import { withBasePath } from "@/lib/base-path";
import { buildGoogleCalendarCreateUrl } from "@/lib/venue-calendar";

const PREFERRED_TIME_LABELS: Record<string, string> = {
  slot_6_9: "6 AM - 9 AM",
  slot_9_12: "9 AM - 12 NOON",
  slot_12_15: "12 NOON - 3 PM",
  slot_15_18: "3 PM - 6 PM",
  slot_18_20: "6 PM - 8 PM",
};

export type RollingLimitStoryPayload = {
  fail: {
    tri: [number, number, number];
    next: [number, number, number];
    extraIdx: 0 | 1 | 2;
    sumAfter: number;
  };
  pass: {
    tri0: [number, number, number];
    tri1: [number, number, number];
    sumAfter: number;
  };
};

type MergedSlotPayload = {
  startIso: string;
  endIso: string;
  sessionCount: number;
  venueLabel: string | null;
};

type BookingPayload = {
  id: string;
  status: BookingRequestStatus;
  requestedAtIso: string;
  merged: MergedSlotPayload[];
};

export type AccountPageViewProps = {
  nameZh: string;
  email: string;
  phone: string;
  identityKeys: string[];
  preferredDateIsos: string[];
  preferredTimeText: string | null;
  wantsConsecutiveSlots: boolean | null;
  favoriteAvatarAnimal: string | null;
  avatarImageDataUrl: string | null;
  extended: boolean;
  dailyMax: number;
  rollingMax: number;
  todayKey: string;
  todayCommitted: number;
  todayRemaining: number;
  rollingUsed: number;
  rollingStory: RollingLimitStoryPayload | null;
  bookings: BookingPayload[];
  canBook: boolean;
  calDescription: string;
};

const EXAMPLE_DATE_ISOS = ["2026-04-05", "2026-04-06", "2026-04-07"] as const;

function formatExampleDayLabel(iso: string, locale: Locale): string {
  const [y, mo, da] = iso.split("-").map((x) => parseInt(x, 10));
  if (!y || !mo || !da) return iso;
  const d = new Date(y, mo - 1, da);
  return d.toLocaleDateString(locale === "en" ? "en-HK" : "zh-HK", {
    month: "long",
    day: "numeric",
  });
}

function formatPreferredDates(isos: string[], locale: Locale, dash: string): string {
  if (isos.length === 0) return dash;
  return isos
    .map((iso) => {
      const [y, mo, da] = iso.split("-").map((x) => parseInt(x, 10));
      if (!y || !mo || !da) return iso;
      return new Date(y, mo - 1, da).toLocaleDateString(locale === "en" ? "en-HK" : "zh-HK", {
        year: "numeric",
        month: "long",
        day: "numeric",
        weekday: "short",
      });
    })
    .join(locale === "en" ? ", " : "、");
}

function formatPreferredTimeText(raw: string | null | undefined, locale: Locale, dash: string): string {
  if (!raw?.trim()) return dash;
  const parts = raw
    .split(/[,，]\s*/)
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length === 0) return raw;
  return parts.map((p) => PREFERRED_TIME_LABELS[p] ?? p).join(locale === "en" ? ", " : "、");
}

function statusLabel(status: BookingRequestStatus, t: (p: string) => string): string {
  const path = `booking.status.${status}`;
  const label = t(path);
  return label === path ? status : label;
}

export function AccountPageView(props: AccountPageViewProps) {
  const { t, tr, locale } = useTranslation();
  const dash = t("account.dash");
  const listSep = locale === "en" ? ", " : "、";

  const exampleDays = EXAMPLE_DATE_ISOS.map((iso) => formatExampleDayLabel(iso, locale));

  const identityLines =
    props.identityKeys.length > 0
      ? props.identityKeys
          .map((k) => {
            const path = `account.identity.${k}`;
            const v = t(path);
            return v === path ? k : v;
          })
          .join(listSep)
      : dash;

  const preferredDatesText = formatPreferredDates(props.preferredDateIsos, locale, dash);
  const preferredTimesText = formatPreferredTimeText(props.preferredTimeText, locale, dash);

  const tierLabel = props.extended ? t("account.tierExtended") : t("account.tierGeneral");

  return (
    <main className="mx-auto max-w-3xl space-y-10 px-5 sm:px-4 py-12">
      <header>
        <h1 className="font-serif text-3xl text-stone-900 dark:text-stone-50">{t("account.pageTitle")}</h1>
        <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">
          {props.nameZh} · {props.email}
        </p>
      </header>

      <UserHubAvatarSection
        initialAnimal={props.favoriteAvatarAnimal}
        initialImageDataUrl={props.avatarImageDataUrl}
      />

      <section className="rounded-2xl border border-stone-200 dark:border-stone-700 bg-surface p-6 shadow-sm">
        <h2 className="font-serif text-xl text-stone-900 dark:text-stone-50">{t("account.limitsTitle")}</h2>
        <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">
          {tr("account.limitsIntro", {
            tier: tierLabel,
            dailyMax: String(props.dailyMax),
            rollingMax: String(props.rollingMax),
          })}
        </p>
        <ul className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
          <li className="rounded-lg bg-stone-50 dark:bg-stone-900 px-3 py-2">
            {tr("account.todayUsed", { todayKey: props.todayKey, n: String(props.todayCommitted) })}
          </li>
          <li className="rounded-lg bg-stone-50 dark:bg-stone-900 px-3 py-2">
            {tr("account.todayRemaining", { n: String(props.todayRemaining) })}
          </li>
          <li className="rounded-lg bg-stone-50 dark:bg-stone-900 px-3 py-2 sm:col-span-2">
            {tr("account.rollingUsedLine", {
              used: String(props.rollingUsed),
              rollingMax: String(props.rollingMax),
            })}
          </li>
        </ul>
        <div className="mt-3 space-y-2 text-xs leading-relaxed text-stone-500 dark:text-stone-500">
          <p>
            <span className="font-semibold text-stone-600 dark:text-stone-400">*</span>{" "}
            {t("account.rollingFootnote")}
          </p>
          <p>
            <span className="font-medium text-stone-600 dark:text-stone-400">{t("account.exampleTitle")}</span>{" "}
            {tr("account.exampleIntro", {
              dailyMax: String(props.dailyMax),
              rollingMax: String(props.rollingMax),
            })}
          </p>
          {props.rollingStory ? (
            <ul className="list-disc space-y-1.5 pl-4 text-stone-500 dark:text-stone-500">
              <li>
                <span className="font-medium text-stone-600 dark:text-stone-400">{t("account.labelCannot")}</span>{" "}
                {tr("account.storyFail", {
                  name: t("account.exampleName"),
                  d0: exampleDays[0]!,
                  d1: exampleDays[1]!,
                  d2: exampleDays[2]!,
                  t0: String(props.rollingStory.fail.tri[0]),
                  t1: String(props.rollingStory.fail.tri[1]),
                  t2: String(props.rollingStory.fail.tri[2]),
                  rollingMax: String(props.rollingMax),
                  extraDay: exampleDays[props.rollingStory.fail.extraIdx]!,
                  nextExpr: props.rollingStory.fail.next.join(" + "),
                  sumAfter: String(props.rollingStory.fail.sumAfter),
                })}
              </li>
              <li>
                <span className="font-medium text-stone-600 dark:text-stone-400">{t("account.labelCan")}</span>{" "}
                {tr("account.storyPass", {
                  d0: exampleDays[0]!,
                  d1: exampleDays[1]!,
                  d2: exampleDays[2]!,
                  a0: String(props.rollingStory.pass.tri0[0]),
                  a1: String(props.rollingStory.pass.tri0[1]),
                  a2: String(props.rollingStory.pass.tri0[2]),
                  preSum: String(props.rollingMax - 2),
                  tri1Expr: props.rollingStory.pass.tri1.join(" + "),
                  sumAfter: String(props.rollingStory.pass.sumAfter),
                  rollingMax: String(props.rollingMax),
                  thirdDay: String(props.rollingStory.pass.tri1[2]),
                  dailyMax: String(props.dailyMax),
                })}
              </li>
              <li>
                <span className="font-medium text-stone-600 dark:text-stone-400">{t("account.labelSlide")}</span>{" "}
                {tr("account.storySlide", { rollingMax: String(props.rollingMax) })}
              </li>
            </ul>
          ) : (
            <ul className="list-disc space-y-1.5 pl-4 text-stone-500 dark:text-stone-500">
              <li>
                <span className="font-medium text-stone-600 dark:text-stone-400">{t("account.labelCannot")}</span>{" "}
                {tr("account.genericCannot", { rollingMax: String(props.rollingMax) })}
              </li>
              <li>
                <span className="font-medium text-stone-600 dark:text-stone-400">{t("account.labelCan")}</span>{" "}
                {tr("account.genericCan", {
                  rollingMax: String(props.rollingMax),
                  dailyMax: String(props.dailyMax),
                })}
              </li>
              <li>
                <span className="font-medium text-stone-600 dark:text-stone-400">{t("account.labelSlide")}</span>{" "}
                {t("account.genericSlide")}
              </li>
            </ul>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-stone-200 dark:border-stone-700 bg-surface p-6 shadow-sm">
        <h2 className="font-serif text-xl text-stone-900 dark:text-stone-50">{t("account.sectionContact")}</h2>
        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex flex-wrap justify-between gap-2 border-b border-stone-100 dark:border-stone-800 py-2">
            <dt className="text-stone-500 dark:text-stone-500">{t("account.dtEmail")}</dt>
            <dd className="text-right font-medium text-stone-900 dark:text-stone-50">{props.email}</dd>
          </div>
          <div className="flex flex-wrap justify-between gap-2 border-b border-stone-100 dark:border-stone-800 py-2">
            <dt className="text-stone-500 dark:text-stone-500">{t("account.dtPhone")}</dt>
            <dd className="text-right font-medium text-stone-900 dark:text-stone-50">{props.phone}</dd>
          </div>
          <div className="flex flex-wrap justify-between gap-2 border-b border-stone-100 dark:border-stone-800 py-2">
            <dt className="text-stone-500 dark:text-stone-500">{t("account.dtIdentity")}</dt>
            <dd className="max-w-md text-right text-stone-800 dark:text-stone-200">{identityLines}</dd>
          </div>
        </dl>
      </section>

      <section className="rounded-2xl border border-stone-200 dark:border-stone-700 bg-surface p-6 shadow-sm">
        <h2 className="font-serif text-xl text-stone-900 dark:text-stone-50">{t("account.sectionPrefs")}</h2>
        <dl className="mt-4 space-y-2 text-sm">
          <div className="border-b border-stone-100 dark:border-stone-800 py-2">
            <dt className="text-stone-500 dark:text-stone-500">{t("account.dtPreferredDates")}</dt>
            <dd className="mt-1 text-stone-800 dark:text-stone-200">{preferredDatesText}</dd>
          </div>
          <div className="border-b border-stone-100 dark:border-stone-800 py-2">
            <dt className="text-stone-500 dark:text-stone-500">{t("account.dtPreferredTimes")}</dt>
            <dd className="mt-1 text-stone-800 dark:text-stone-200">{preferredTimesText}</dd>
          </div>
          {props.wantsConsecutiveSlots != null && (
            <div className="border-b border-stone-100 dark:border-stone-800 py-2">
              <dt className="text-stone-500 dark:text-stone-500">{t("account.dtConsecutive")}</dt>
              <dd className="mt-1 text-stone-800 dark:text-stone-200">
                {props.wantsConsecutiveSlots
                  ? t("account.prefsConsecutiveYes")
                  : t("account.prefsConsecutiveNo")}
              </dd>
            </div>
          )}
        </dl>
      </section>

      <section className="rounded-2xl border border-stone-200 dark:border-stone-700 bg-surface p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <h2 className="font-serif text-xl text-stone-900 dark:text-stone-50">{t("account.sectionBookings")}</h2>
          <div className="flex flex-wrap gap-2">
            <a
              href={withBasePath("/api/v1/account/bookings.ics")}
              className="rounded-full border border-stone-300 dark:border-stone-600 bg-surface px-5 sm:px-4 py-2 text-xs font-medium text-stone-800 dark:text-stone-200 hover:bg-stone-50 dark:hover:bg-stone-800"
              download
            >
              {t("account.downloadIcs")}
            </a>
          </div>
        </div>
        <p className="mt-2 text-xs text-stone-500 dark:text-stone-500">{t("account.icsNote")}</p>

        <ul className="mt-6 space-y-6">
          {props.bookings.length === 0 && (
            <li className="text-sm text-stone-500 dark:text-stone-500">{t("account.emptyBookings")}</li>
          )}
          {props.bookings.map((b) => {
            const loc = locale === "en" ? "en-HK" : "zh-HK";
            const stLabel = statusLabel(b.status, t);
            return (
              <li
                key={b.id}
                className="rounded-xl border border-stone-100 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/80 dark:bg-stone-900/80 p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-stone-900 dark:text-stone-50">
                    {tr("account.statusLine", { status: stLabel })}
                  </span>
                  <span className="text-xs text-stone-500 dark:text-stone-500">
                    {tr("account.requestedAtLine", {
                      time: new Date(b.requestedAtIso).toLocaleString(loc, { timeZone: "Asia/Hong_Kong" }),
                    })}
                  </span>
                </div>
                <ul className="mt-3 space-y-3 text-sm">
                  {b.merged.map((m, idx) => {
                    const start = new Date(m.startIso);
                    const end = new Date(m.endIso);
                    const rangeStart = start.toLocaleString(loc, {
                      timeZone: "Asia/Hong_Kong",
                      weekday: "short",
                      month: "numeric",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    });
                    const rangeEnd = end.toLocaleString(loc, {
                      timeZone: "Asia/Hong_Kong",
                      hour: "2-digit",
                      minute: "2-digit",
                    });
                    return (
                      <li
                        key={`${b.id}-${idx}`}
                        className="rounded-lg border border-stone-100 bg-surface px-3 py-2 shadow-sm dark:border-stone-800"
                      >
                        <p className="font-medium text-stone-800 dark:text-stone-200">
                          {rangeStart} — {rangeEnd}
                          <span className="ml-2 text-stone-500 dark:text-stone-500">
                            {tr("account.sessionsVenue", {
                              sessions: String(m.sessionCount),
                              venue: displayVenueLabel(m.venueLabel, locale),
                            })}
                          </span>
                        </p>
                        <a
                          href={buildGoogleCalendarCreateUrl({
                            title: tr("account.gcalTitle", {
                              brand: t("brand.fantasiaSpace"),
                              sessions: String(m.sessionCount),
                            }),
                            start,
                            end,
                            description: [
                              tr("account.gcalLineId", { id: b.id }),
                              tr("account.gcalLineStatus", { status: stLabel }),
                              props.calDescription,
                            ].join("\n\n"),
                          })}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 inline-block text-xs font-medium text-violet-700 underline"
                        >
                          {t("account.addGoogleCal")}
                        </a>
                      </li>
                    );
                  })}
                </ul>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="rounded-2xl border border-stone-200 dark:border-stone-700 bg-surface p-6 shadow-sm">
        <h2 className="font-serif text-xl text-stone-900 dark:text-stone-50">{t("account.shortcuts")}</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          {props.canBook ? (
            <Link
              href="/booking"
              className="rounded-full bg-stone-900 px-6 py-2.5 text-sm text-white hover:bg-stone-800"
            >
              {t("account.goBooking")}
            </Link>
          ) : (
            <span className="rounded-full bg-stone-200 px-6 py-2.5 text-sm text-stone-500 dark:text-stone-500">
              {t("account.bookingLocked")}
            </span>
          )}
          <Link
            href="/account/passkeys"
            className="rounded-full border border-stone-300 dark:border-stone-600 bg-surface px-6 py-2.5 text-sm text-stone-800 dark:text-stone-200 hover:bg-stone-50 dark:hover:bg-stone-800"
          >
            {t("account.managePasskeys")}
          </Link>
          <Link href="/booking/history" className="text-sm text-stone-700 dark:text-stone-300 underline">
            {t("account.textHistory")}
          </Link>
        </div>
      </section>

      <div className="flex flex-wrap gap-3 border-t border-stone-200 dark:border-stone-700 pt-8">
        <LogoutButton />
        <Link
          href="/"
          className="rounded-full border border-stone-300 dark:border-stone-600 px-6 py-2.5 text-sm text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800"
        >
          {t("account.backHome")}
        </Link>
      </div>
    </main>
  );
}
