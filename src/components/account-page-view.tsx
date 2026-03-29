"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import type { BookingVenueKind } from "@prisma/client";
import { withBasePath } from "@/lib/base-path";
import { buildMonthGrid } from "@/lib/hk-calendar-client";
import { accountPageHeading } from "@/lib/i18n/account-page-heading";
import { useTranslation } from "@/lib/i18n/use-translation";
import {
  joinSessionSumExpr,
  sessionCountWithHoursPack,
  sessionHoursParen,
} from "@/lib/i18n/session-hours";
import type { Locale } from "@/lib/i18n/types";
import { AccountAmbassadorReferralSection } from "@/components/account-ambassador-referral-section";
import type { AmbassadorReferralPayload } from "@/lib/referral/ambassador-referral-payload";
import {
  BookingIconCalendarRolling,
  BookingIconMentorStudent,
  BookingIconPerson,
  BookingIconTeaching,
} from "@/components/booking-quota-icons";

const PREFERRED_TIME_LABELS: Record<string, string> = {
  slot_6_9: "6 AM - 9 AM",
  slot_9_12: "9 AM - 12 NOON",
  slot_12_15: "12 NOON - 3 PM",
  slot_15_18: "3 PM - 6 PM",
  slot_18_20: "6 PM - 8 PM",
};

/** Hours width for 6:00–20:00 day band (matches registration slots). */
const PREFERRED_SLOT_DAY_SEGMENTS: { id: keyof typeof PREFERRED_TIME_LABELS; flex: number }[] = [
  { id: "slot_6_9", flex: 3 },
  { id: "slot_9_12", flex: 3 },
  { id: "slot_12_15", flex: 3 },
  { id: "slot_15_18", flex: 3 },
  { id: "slot_18_20", flex: 2 },
];

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

export type AccountPageViewProps = {
  nameZh: string;
  email: string;
  phone: string;
  /** Registration routing: studio room vs open space (large instruments). */
  bookingVenueKind: BookingVenueKind;
  /** Free-text instrument / field from registration (e.g. 鋼琴 or list label). */
  instrumentField: string;
  /** `UserCategory.code` (e.g. personal | teaching); null if unset. */
  userCategoryCode: string | null;
  identityKeys: string[];
  preferredDateIsos: string[];
  preferredTimeText: string | null;
  wantsConsecutiveSlots: boolean | null;
  quotaTier: "individual" | "teaching";
  dailyMax: number;
  rollingMax: number;
  todayKey: string;
  todayCommitted: number;
  todayRemaining: number;
  rollingUsed: number;
  rollingStory: RollingLimitStoryPayload | null;
  /** D Ambassador display name when this account registered via a referral link. */
  referrerNameZh: string | null;
  /** Registration / account opt-in to D Ambassador (loads referral tools when true). */
  wantsAmbassador: boolean;
  /**
   * Server-rendered ambassador payload when opted in (`undefined` if not opted in).
   * `null` means the server could not build it; the client will retry via API.
   */
  ambassadorReferralInitial?: AmbassadorReferralPayload | null;
  /** Server-resolved (cookie locale); studio channel only, else null. */
  sharedQuotaVenuesNote: string | null;
  /** Locale used for `sharedQuotaVenuesNote` (cookie at request time). */
  accountCopyLocale: Locale;
};

const EXAMPLE_DATE_ISOS = ["2026-04-05", "2026-04-06", "2026-04-07"] as const;

/** Stock: passkeys Unsplash photo-1633265486064. Logout: open-door portal image (local PNG). */
function AccountQuickNavTile(props: {
  imageSrc: string;
  /** CSS `background-position` (e.g. piano focal left). */
  imagePosition?: string;
  borderClassName: string;
  overlayClassName: string;
  overlayHoverClassName: string;
  textClassName: string;
  activeOpacityClassName?: string;
  className: string;
  children: ReactNode;
} & ({ kind: "link"; href: string } | { kind: "button"; onClick: () => void })) {
  const bgUrl = `url("${withBasePath(props.imageSrc)}")`;
  const sharedInner = (
    <>
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 bg-cover bg-no-repeat opacity-[0.92] saturate-[0.52] contrast-[0.97] dark:opacity-[0.88] dark:saturate-[0.48]"
        style={{
          backgroundImage: bgUrl,
          backgroundPosition: props.imagePosition ?? "center",
        }}
      />
      <span
        aria-hidden
        className={`pointer-events-none absolute inset-0 z-[1] transition-colors ${props.overlayClassName} ${props.overlayHoverClassName}`}
      />
      <span
        className={`relative z-[2] flex min-h-0 w-full flex-1 flex-col items-center justify-center gap-0.5 text-center ${props.textClassName}`}
      >
        {props.children}
      </span>
    </>
  );

  const shellClass = [
    "relative isolate flex h-full w-full min-h-0 flex-col overflow-hidden transition-[transform,opacity]",
    props.borderClassName,
    props.activeOpacityClassName ?? "active:opacity-90",
    props.className,
  ].join(" ");

  if (props.kind === "link") {
    return (
      <Link href={props.href} className={shellClass}>
        {sharedInner}
      </Link>
    );
  }
  return (
    <button type="button" onClick={props.onClick} className={shellClass}>
      {sharedInner}
    </button>
  );
}

function formatExampleDayLabel(iso: string, locale: Locale): string {
  const [y, mo, da] = iso.split("-").map((x) => parseInt(x, 10));
  if (!y || !mo || !da) return iso;
  const d = new Date(y, mo - 1, da);
  return d.toLocaleDateString(locale === "en" ? "en-HK" : "zh-HK", {
    month: "long",
    day: "numeric",
  });
}

/** Short span for narrative, e.g. "5–7 Apr" / "4月5日至7日". */
function formatExampleWindowSpan(
  isos: readonly [string, string, string],
  locale: Locale
): string {
  const [a, , c] = isos;
  const pa = a.split("-").map((x) => parseInt(x, 10));
  const pc = c.split("-").map((x) => parseInt(x, 10));
  const [y1, m1, d1] = pa;
  const [y3, m3, d3] = pc;
  if (!y1 || !m1 || !d1 || !y3 || !m3 || !d3) return `${a}–${c}`;
  if (locale === "en") {
    const s = new Date(y1, m1 - 1, d1);
    const e = new Date(y3, m3 - 1, d3);
    const mon = s.toLocaleDateString("en-HK", { month: "short" });
    return `${s.getDate()}–${e.getDate()} ${mon}`;
  }
  if (y1 === y3 && m1 === m3) {
    return `${m1}月${d1}日至${d3}日`;
  }
  return `${y1}年${m1}月${d1}日至${y3}年${m3}月${d3}日`;
}

function RollingTripleStrip(props: {
  caption: string;
  dayLabels: readonly [string, string, string];
  counts: readonly [number, number, number];
  locale: Locale;
  rollingMax: number;
  t: (path: string) => string;
  tr: (path: string, vars: Record<string, string>) => string;
}) {
  const total = props.counts[0]! + props.counts[1]! + props.counts[2]!;
  const over = total > props.rollingMax;
  return (
    <div className="rounded-lg border border-stone-200 bg-stone-50/90 px-3 py-2.5 dark:border-stone-600 dark:bg-stone-900/50">
      <p className="text-[11px] font-medium text-stone-600 dark:text-stone-400">{props.caption}</p>
      <div className="mt-2 grid grid-cols-3 gap-1.5">
        {props.dayLabels.map((day, i) => (
          <div
            key={day}
            className="rounded-md border border-stone-200/90 bg-surface px-1.5 py-2 text-center dark:border-stone-600"
          >
            <div className="text-[10px] font-semibold leading-tight text-stone-800 dark:text-stone-100">
              {day}
            </div>
            <div className="mt-1 text-[11px] tabular-nums text-stone-600 dark:text-stone-400">
              {sessionCountWithHoursPack(props.locale, props.counts[i]!)}
            </div>
          </div>
        ))}
      </div>
      <p
        className={`mt-2 text-center text-[11px] font-medium tabular-nums ${
          over ? "text-rose-600 dark:text-rose-400" : "text-stone-700 dark:text-stone-300"
        }`}
      >
        {props.t("account.rollingExampleStripTotal")}：{" "}
        {props.tr("account.rollingExampleStripVersusCap", {
          totalPack: sessionCountWithHoursPack(props.locale, total),
          maxPack: sessionCountWithHoursPack(props.locale, props.rollingMax),
        })}
      </p>
    </div>
  );
}

function RollingSlideWindowsVisual(props: { t: (path: string) => string }) {
  return (
    <div className="mt-2 rounded-lg border border-stone-200 bg-stone-50/90 px-3 py-2.5 dark:border-stone-600 dark:bg-stone-900/50">
      <p className="text-[11px] font-medium text-stone-600 dark:text-stone-400">
        {props.t("account.rollingSlideWindowsCaption")}
      </p>
      <div
        className="mt-2 flex flex-wrap items-center justify-center gap-x-1 gap-y-1 text-[10px] font-semibold tracking-tight text-stone-800 dark:text-stone-100"
        aria-hidden
      >
        <span className="rounded-md border border-stone-300 bg-surface px-2 py-1 dark:border-stone-600">
          {props.t("account.rollingSlideWindow1")}
        </span>
        <span className="text-stone-400">→</span>
        <span className="rounded-md border border-stone-300 bg-surface px-2 py-1 dark:border-stone-600">
          {props.t("account.rollingSlideWindow2")}
        </span>
        <span className="text-stone-400">→</span>
        <span className="rounded-md border border-stone-300 bg-surface px-2 py-1 dark:border-stone-600">
          {props.t("account.rollingSlideWindow3")}
        </span>
      </div>
    </div>
  );
}

function QuotaSessionMeter({
  title,
  subtitle,
  used,
  max,
  icon,
}: {
  title: string;
  subtitle: string;
  used: number;
  max: number;
  icon: ReactNode;
}) {
  const pct = max > 0 ? Math.min(100, (used / max) * 100) : 0;
  const over = used > max;
  return (
    <div className="rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50/80 dark:bg-stone-900/50 p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 shrink-0 text-stone-500 dark:text-stone-400 [&_svg]:h-8 [&_svg]:w-8">
          {icon}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">{title}</p>
          <p className="mt-1 text-xs text-stone-600 dark:text-stone-400">{subtitle}</p>
          <div
            className="mt-3 h-2.5 overflow-hidden rounded-full bg-stone-200 dark:bg-stone-700"
            role="img"
            aria-label={subtitle}
          >
            <div
              className={`h-full rounded-full transition-[width] ${
                over ? "bg-rose-500 dark:bg-rose-400" : "bg-violet-600 dark:bg-violet-500"
              }`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
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

function normalizePrefsDateKey(iso: string): string | null {
  const parts = iso.trim().split("-");
  if (parts.length !== 3) return null;
  const y = parseInt(parts[0]!, 10);
  const mo = parseInt(parts[1]!, 10);
  const da = parseInt(parts[2]!, 10);
  if (!y || !mo || !da) return null;
  return `${y}-${String(mo).padStart(2, "0")}-${String(da).padStart(2, "0")}`;
}

function uniqueYearMonthsFromDateKeys(dateKeys: string[]): { year: number; month1: number }[] {
  const seen = new Set<string>();
  for (const raw of dateKeys) {
    const key = normalizePrefsDateKey(raw);
    if (!key) continue;
    seen.add(key.slice(0, 7));
  }
  return Array.from(seen)
    .sort()
    .map((ym) => {
      const [ys, ms] = ym.split("-");
      return { year: parseInt(ys!, 10), month1: parseInt(ms!, 10) };
    });
}

function uniqueYearMonthsFromPrefsIsos(isos: string[]): { year: number; month1: number }[] {
  const keys = isos.map(normalizePrefsDateKey).filter((k): k is string => k != null);
  return uniqueYearMonthsFromDateKeys(keys);
}

function AccountCalendarMonthReadonly(props: {
  year: number;
  month1: number;
  selected: Set<string>;
  weekdays: string[];
  monthTitle: string;
}) {
  const grid = buildMonthGrid(props.year, props.month1);
  return (
    <div className="min-w-[200px] flex-1 rounded-xl border border-stone-200 bg-stone-50/90 p-3 shadow-sm dark:border-stone-700 dark:bg-stone-900/80 sm:min-w-[220px] sm:p-4">
      <p className="text-center text-sm font-medium text-stone-800 dark:text-stone-200">
        {props.monthTitle}
      </p>
      <div className="mt-2 grid grid-cols-7 gap-1 text-center text-[10px] font-medium text-stone-500 dark:text-stone-500 sm:text-xs">
        {props.weekdays.map((w) => (
          <div key={w} className="py-0.5">
            {w}
          </div>
        ))}
        {grid.map((cell, idx) => {
          if (!cell.dateKey) {
            return <div key={`pad-${props.month1}-${idx}`} />;
          }
          const iso = cell.dateKey;
          const on = props.selected.has(iso);
          const dayNum = Number(iso.slice(8, 10));
          return (
            <div
              key={iso}
              className={`flex aspect-square max-h-9 items-center justify-center rounded-lg text-xs font-semibold sm:max-h-10 sm:text-sm ${
                on
                  ? "bg-violet-600 text-white shadow-sm dark:bg-violet-500"
                  : "bg-stone-200/40 text-stone-400 dark:bg-stone-800/90 dark:text-stone-600"
              }`}
            >
              {dayNum}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AccountPreferredTimesVisual(props: {
  raw: string | null;
  dash: string;
  t: (path: string) => string;
  plainSummary: string;
}) {
  const ids =
    props.raw
      ?.split(/[,，]\s*/)
      .map((p) => p.trim())
      .filter(Boolean) ?? [];

  function slotLabel(id: string): string {
    const path = `reg.slot.${id}`;
    const v = props.t(path);
    return v === path ? (PREFERRED_TIME_LABELS[id] ?? id) : v;
  }

  if (ids.length === 0) {
    return <p className="text-stone-800 dark:text-stone-200">{props.dash}</p>;
  }

  const labels = ids.map((id) => slotLabel(id));
  const known = new Set<string>(PREFERRED_SLOT_DAY_SEGMENTS.map((s) => s.id));
  const activeIds = new Set(ids.filter((id) => known.has(id)));

  return (
    <div className="space-y-3" aria-label={props.plainSummary}>
      <div className="flex flex-wrap gap-2">
        {labels.map((label, i) => (
          <span
            key={`${ids[i]}-${i}`}
            className="inline-flex items-center rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-medium text-violet-900 dark:border-violet-800 dark:bg-violet-950/60 dark:text-violet-200"
          >
            {label}
          </span>
        ))}
      </div>
      {activeIds.size > 0 && (
        <div>
          <div
            className="flex h-2.5 overflow-hidden rounded-full ring-1 ring-stone-200 dark:ring-stone-600"
            role="img"
            aria-hidden
          >
            {PREFERRED_SLOT_DAY_SEGMENTS.map((seg) => (
              <div
                key={seg.id}
                className={
                  activeIds.has(seg.id)
                    ? "bg-violet-600 dark:bg-violet-500"
                    : "bg-stone-200 dark:bg-stone-700"
                }
                style={{ flex: seg.flex }}
              />
            ))}
          </div>
          <div className="mt-1 flex justify-between px-0.5 font-mono text-[10px] tabular-nums text-stone-500 dark:text-stone-500">
            <span>6</span>
            <span>9</span>
            <span>12</span>
            <span>15</span>
            <span>18</span>
            <span>20</span>
          </div>
        </div>
      )}
    </div>
  );
}

export function AccountPageView(props: AccountPageViewProps) {
  const { t, tr, locale } = useTranslation();
  const dash = t("account.dash");
  const listSep = locale === "en" ? ", " : "、";

  const exampleDays = EXAMPLE_DATE_ISOS.map((iso) => formatExampleDayLabel(iso, locale));
  const exampleDayLabels = [exampleDays[0]!, exampleDays[1]!, exampleDays[2]!] as const;
  const exampleWindowSpan = formatExampleWindowSpan(EXAMPLE_DATE_ISOS, locale);

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

  const calWeekdays = [
    t("reg.weekday.sun"),
    t("reg.weekday.mon"),
    t("reg.weekday.tue"),
    t("reg.weekday.wed"),
    t("reg.weekday.thu"),
    t("reg.weekday.fri"),
    t("reg.weekday.sat"),
  ];
  const prefsDateSelected = new Set(
    props.preferredDateIsos.map(normalizePrefsDateKey).filter((k): k is string => k != null)
  );
  const prefsMonths = uniqueYearMonthsFromPrefsIsos(props.preferredDateIsos);
  const locTag = locale === "en" ? "en-HK" : "zh-HK";

  const tierLabel =
    props.quotaTier === "teaching"
      ? t("account.quotaTierTeaching")
      : t("account.quotaTierIndividual");
  const TierQuotaIcon = props.quotaTier === "teaching" ? BookingIconTeaching : BookingIconMentorStudent;

  const userCategoryText = (() => {
    const code = props.userCategoryCode;
    if (!code) return dash;
    const path = `account.userCategory.${code}`;
    const label = t(path);
    return label === path ? code : label;
  })();

  const accountPageTitle = accountPageHeading(locale, props.bookingVenueKind);
  const instrumentDisplay = props.instrumentField.trim() ? props.instrumentField.trim() : dash;
  const isStudioChannel = props.bookingVenueKind === "studio_room";

  async function handleLogout() {
    await fetch(withBasePath("/api/v1/auth/logout"), { method: "POST" });
    window.location.href = withBasePath("/");
  }

  return (
    <main className="mx-auto max-w-3xl space-y-10 px-5 sm:px-4 py-12">
      <header>
        <h1 className="font-serif text-3xl text-stone-900 dark:text-stone-50">{accountPageTitle}</h1>
        <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">
          {props.nameZh} · {props.email}
        </p>
      </header>

      {props.referrerNameZh ? (
        <section
          className="rounded-2xl border border-violet-200/80 bg-violet-50/90 p-5 shadow-sm dark:border-violet-800/50 dark:bg-violet-950/40"
          aria-label={t("account.referrerBannerAria")}
        >
          <p className="text-sm font-medium text-violet-950 dark:text-violet-100">
            {tr("account.referrerBanner", { name: props.referrerNameZh })}
          </p>
        </section>
      ) : null}

      <nav
        className="rounded-2xl border border-stone-200 dark:border-stone-700 bg-surface p-6 shadow-sm"
        aria-label={t("account.quickNavAria")}
      >
        {/*
          Viewports below md: 2×2 square tiles in the spirit of the mobile drawer home / theme cells (slightly tighter type).
          md and up: original pill row.
        */}
        <div className="grid grid-cols-2 gap-2 md:flex md:flex-wrap md:gap-3">
          <div className="aspect-square min-h-0 min-w-0 md:contents">
            <AccountQuickNavTile
              kind="link"
              href="/booking/history"
              imageSrc="/account/studio-booking-history-bg.png"
              imagePosition="28% center"
              borderClassName="border border-violet-600/90 shadow-sm"
              overlayClassName="bg-violet-800/72 dark:bg-violet-950/66"
              overlayHoverClassName="hover:bg-violet-700/64 dark:hover:bg-violet-900/58"
              textClassName="text-sm font-semibold leading-snug text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.55)] md:text-base"
              className="rounded-lg px-1.5 py-2 md:inline-flex md:h-auto md:min-h-[2.75rem] md:w-auto md:rounded-full md:px-4 md:py-2.5"
            >
              {t("account.quickNavStudioHistory")}
            </AccountQuickNavTile>
          </div>
          <div className="aspect-square min-h-0 min-w-0 md:contents">
            <AccountQuickNavTile
              kind="link"
              href="/booking/open-space/history"
              imageSrc="/account/open-space-booking-history-bg.png"
              imagePosition="center center"
              borderClassName="border border-teal-600/50 shadow-sm dark:border-teal-500/40"
              overlayClassName="bg-teal-950/58 dark:bg-teal-950/52"
              overlayHoverClassName="hover:bg-teal-900/50 dark:hover:bg-teal-950/46"
              textClassName="text-sm font-semibold leading-snug text-teal-50 drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)] dark:text-teal-100 md:text-base"
              className="rounded-lg px-1.5 py-2 md:inline-flex md:h-auto md:min-h-[2.75rem] md:w-auto md:rounded-full md:border-teal-600/50 md:px-4 md:py-2.5"
            >
              {t("account.quickNavOpenSpaceHistory")}
            </AccountQuickNavTile>
          </div>
          <div className="aspect-square min-h-0 min-w-0 md:contents">
            <AccountQuickNavTile
              kind="link"
              href="/account/passkeys"
              imageSrc="/account/passkeys-nav-bg.jpg"
              imagePosition="center center"
              borderClassName="border border-indigo-500/40 shadow-sm dark:border-indigo-500/40"
              overlayClassName="bg-slate-900/76 dark:bg-indigo-950/48"
              overlayHoverClassName="hover:bg-slate-800/72 dark:hover:bg-indigo-950/42"
              textClassName="text-sm font-semibold leading-snug text-indigo-100 drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)] md:text-base"
              className="rounded-lg px-1.5 py-2 hover:border-indigo-400/60 md:inline-flex md:h-auto md:min-h-[2.75rem] md:w-auto md:rounded-full md:px-4 md:py-2.5"
            >
              {t("account.quickNavPasskeysDetail")}
            </AccountQuickNavTile>
          </div>
          <div className="aspect-square min-h-0 min-w-0 md:contents">
            <AccountQuickNavTile
              kind="button"
              onClick={() => void handleLogout()}
              imageSrc="/account/logout-nav-bg.png"
              imagePosition="center center"
              borderClassName="border border-rose-700/45 shadow-sm dark:border-rose-600/40"
              overlayClassName="bg-rose-950/56 dark:bg-rose-950/52"
              overlayHoverClassName="hover:bg-rose-900/48 dark:hover:bg-rose-950/46"
              textClassName="text-sm font-semibold leading-snug text-rose-50 drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)] dark:text-rose-100 md:text-base"
              className="rounded-lg px-1.5 py-2 md:inline-flex md:h-auto md:min-h-[2.75rem] md:w-auto md:rounded-full md:px-4 md:py-2.5"
            >
              {t("account.logout")}
            </AccountQuickNavTile>
          </div>
        </div>
      </nav>

      <AccountAmbassadorReferralSection
        wantsAmbassador={props.wantsAmbassador}
        initialReferral={props.ambassadorReferralInitial}
      />

      <section className="rounded-2xl border border-stone-200 dark:border-stone-700 bg-surface p-6 shadow-sm">
        <h2 className="font-serif text-xl text-stone-900 dark:text-stone-50">{t("account.limitsTitle")}</h2>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-violet-200/80 bg-violet-50 text-violet-700 dark:border-violet-800 dark:bg-violet-950/50 dark:text-violet-300">
            <TierQuotaIcon className="h-7 w-7" />
          </span>
          <span className="inline-flex items-center rounded-full border border-stone-200 bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-700 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-200">
            {tierLabel}
          </span>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-stone-600 dark:text-stone-400">
          {tr("account.limitsIntro", {
            tier: tierLabel,
            dailyMax: String(props.dailyMax),
            rollingMax: String(props.rollingMax),
            dailyMaxH: sessionHoursParen(locale, props.dailyMax),
            rollingMaxH: sessionHoursParen(locale, props.rollingMax),
          })}
        </p>
        {isStudioChannel && props.sharedQuotaVenuesNote ? (
          <p className="mt-2 text-sm font-medium leading-relaxed text-violet-900 dark:text-violet-200">
            {locale === props.accountCopyLocale
              ? props.sharedQuotaVenuesNote
              : t("account.sharedQuotaVenuesNote")}
          </p>
        ) : null}
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <QuotaSessionMeter
            title={t("account.meterTodayTitle")}
            subtitle={tr("account.meterTodaySub", {
              used: String(props.todayCommitted),
              max: String(props.dailyMax),
              remaining: String(props.todayRemaining),
              usedH: sessionHoursParen(locale, props.todayCommitted),
              maxH: sessionHoursParen(locale, props.dailyMax),
              remainingH: sessionHoursParen(locale, props.todayRemaining),
            })}
            used={props.todayCommitted}
            max={props.dailyMax}
            icon={<BookingIconPerson className="h-8 w-8" />}
          />
          <QuotaSessionMeter
            title={t("account.meterRollingTitle")}
            subtitle={tr("account.meterRollingSub", {
              used: String(props.rollingUsed),
              max: String(props.rollingMax),
              maxH: sessionHoursParen(locale, props.rollingMax),
            })}
            used={props.rollingUsed}
            max={props.rollingMax}
            icon={<BookingIconCalendarRolling className="h-8 w-8" />}
          />
        </div>
        <div className="mt-5 rounded-xl border border-dashed border-stone-200 bg-stone-50/90 px-4 py-4 dark:border-stone-600 dark:bg-stone-900/40">
          <p className="text-center text-xs font-medium text-stone-600 dark:text-stone-400">
            {t("account.slidingDiagramCaption")}
          </p>
          <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-sm font-semibold text-stone-800 dark:text-stone-100">
            <span className="rounded-lg border border-stone-200 bg-surface px-3 py-2 shadow-sm dark:border-stone-600">
              {t("account.slidingDay1")}
            </span>
            <span className="text-stone-400">+</span>
            <span className="rounded-lg border border-stone-200 bg-surface px-3 py-2 shadow-sm dark:border-stone-600">
              {t("account.slidingDay2")}
            </span>
            <span className="text-stone-400">+</span>
            <span className="rounded-lg border border-stone-200 bg-surface px-3 py-2 shadow-sm dark:border-stone-600">
              {t("account.slidingDay3")}
            </span>
            <span className="ml-1 text-xs font-normal text-stone-500 dark:text-stone-500">≤ {props.rollingMax}</span>
          </div>
          <p className="mt-2 text-center text-[11px] leading-snug text-stone-500 dark:text-stone-500">
            {t("account.slidingDiagramHint")}
          </p>
        </div>
        <details className="group mt-4 text-xs leading-relaxed text-stone-500 dark:text-stone-500">
          <summary className="cursor-pointer select-none list-none font-medium text-blue-800 underline decoration-blue-800/40 underline-offset-2 hover:text-blue-900 [&::-webkit-details-marker]:hidden dark:text-blue-300 dark:decoration-blue-300/40 dark:hover:text-blue-200">
            {t("account.rollingDetailsSummary")}
          </summary>
          <div className="mt-3 space-y-3 border-l-2 border-stone-200 pl-3 dark:border-stone-600">
            <div className="rounded-lg border border-stone-200 bg-stone-50/80 px-3 py-3 dark:border-stone-600 dark:bg-stone-900/40">
              <p className="text-xs font-semibold text-stone-800 dark:text-stone-100">
                {t("account.rollingExplainTitle")}
              </p>
              <ol className="mt-2 list-decimal space-y-1.5 pl-4 text-[11px] leading-relaxed text-stone-600 dark:text-stone-400">
                <li>{t("account.rollingExplainStep1")}</li>
                <li>{t("account.rollingExplainStep2")}</li>
                <li>{t("account.rollingExplainStep3")}</li>
                <li>{t("account.rollingExplainStep4")}</li>
              </ol>
            </div>
            <p>
              <span className="font-medium text-stone-600 dark:text-stone-400">{t("account.exampleTitle")}</span>{" "}
              {tr("account.exampleIntro", {
                tier: tierLabel,
                dailyMax: String(props.dailyMax),
                rollingMax: String(props.rollingMax),
                dailyMaxH: sessionHoursParen(locale, props.dailyMax),
                rollingMaxH: sessionHoursParen(locale, props.rollingMax),
              })}
            </p>
            {props.rollingStory ? (
              <ul className="list-none space-y-3 pl-0 text-stone-500 dark:text-stone-500">
                <li className="space-y-2">
                  <div className="grid gap-2 sm:grid-cols-2">
                    <RollingTripleStrip
                      caption={t("account.rollingExampleFailBefore")}
                      dayLabels={exampleDayLabels}
                      counts={props.rollingStory.fail.tri}
                      locale={locale}
                      rollingMax={props.rollingMax}
                      t={t}
                      tr={tr}
                    />
                    <RollingTripleStrip
                      caption={tr("account.rollingExampleFailAfter", {
                        day: exampleDays[props.rollingStory.fail.extraIdx]!,
                      })}
                      dayLabels={exampleDayLabels}
                      counts={props.rollingStory.fail.next}
                      locale={locale}
                      rollingMax={props.rollingMax}
                      t={t}
                      tr={tr}
                    />
                  </div>
                  <p>
                    <span className="font-medium text-stone-600 dark:text-stone-400">
                      {t("account.labelCannot")}
                    </span>{" "}
                    {tr("account.storyFail", {
                      name: t("account.exampleName"),
                      d0: exampleDays[0]!,
                      d1: exampleDays[1]!,
                      d2: exampleDays[2]!,
                      t0Pack: sessionCountWithHoursPack(locale, props.rollingStory.fail.tri[0]!),
                      t1Pack: sessionCountWithHoursPack(locale, props.rollingStory.fail.tri[1]!),
                      t2Pack: sessionCountWithHoursPack(locale, props.rollingStory.fail.tri[2]!),
                      rollingMaxPack: sessionCountWithHoursPack(locale, props.rollingMax),
                      extraDay: exampleDays[props.rollingStory.fail.extraIdx]!,
                      nextExpr: joinSessionSumExpr(
                        locale,
                        props.rollingStory.fail.next,
                        locale === "en" ? " + " : "＋"
                      ),
                      sumAfterPack: sessionCountWithHoursPack(locale, props.rollingStory.fail.sumAfter),
                      windowSpan: exampleWindowSpan,
                    })}
                  </p>
                </li>
                <li className="space-y-2">
                  <div className="grid gap-2 sm:grid-cols-2">
                    <RollingTripleStrip
                      caption={t("account.rollingExamplePassBefore")}
                      dayLabels={exampleDayLabels}
                      counts={props.rollingStory.pass.tri0}
                      locale={locale}
                      rollingMax={props.rollingMax}
                      t={t}
                      tr={tr}
                    />
                    <RollingTripleStrip
                      caption={tr("account.rollingExamplePassAfter", {
                        day: exampleDays[2]!,
                      })}
                      dayLabels={exampleDayLabels}
                      counts={props.rollingStory.pass.tri1}
                      locale={locale}
                      rollingMax={props.rollingMax}
                      t={t}
                      tr={tr}
                    />
                  </div>
                  <p>
                    <span className="font-medium text-stone-600 dark:text-stone-400">{t("account.labelCan")}</span>{" "}
                    {tr("account.storyPass", {
                      d0: exampleDays[0]!,
                      d1: exampleDays[1]!,
                      d2: exampleDays[2]!,
                      a0Pack: sessionCountWithHoursPack(locale, props.rollingStory.pass.tri0[0]!),
                      a1Pack: sessionCountWithHoursPack(locale, props.rollingStory.pass.tri0[1]!),
                      a2Pack: sessionCountWithHoursPack(locale, props.rollingStory.pass.tri0[2]!),
                      preSumPack: sessionCountWithHoursPack(locale, props.rollingMax - 2),
                      tri1Expr: joinSessionSumExpr(
                        locale,
                        props.rollingStory.pass.tri1,
                        locale === "en" ? " + " : "＋"
                      ),
                      sumAfterPack: sessionCountWithHoursPack(locale, props.rollingStory.pass.sumAfter),
                      rollingMaxPack: sessionCountWithHoursPack(locale, props.rollingMax),
                      thirdDayPack: sessionCountWithHoursPack(locale, props.rollingStory.pass.tri1[2]!),
                      dailyMaxPack: sessionCountWithHoursPack(locale, props.dailyMax),
                      aOneH: sessionHoursParen(locale, 1),
                    })}
                  </p>
                </li>
                <li className="space-y-2">
                  <RollingSlideWindowsVisual t={t} />
                  <p>
                    <span className="font-medium text-stone-600 dark:text-stone-400">
                      {t("account.labelSlide")}
                    </span>{" "}
                    {tr("account.storySlide", {
                      rollingMaxPack: sessionCountWithHoursPack(locale, props.rollingMax),
                    })}
                  </p>
                </li>
              </ul>
            ) : (
              <ul className="list-disc space-y-1.5 pl-4 text-stone-500 dark:text-stone-500">
                <li>
                  <span className="font-medium text-stone-600 dark:text-stone-400">{t("account.labelCannot")}</span>{" "}
                  {tr("account.genericCannot", {
                    rollingMaxPack: sessionCountWithHoursPack(locale, props.rollingMax),
                  })}
                </li>
                <li>
                  <span className="font-medium text-stone-600 dark:text-stone-400">{t("account.labelCan")}</span>{" "}
                  {tr("account.genericCan", {
                    rollingMaxPack: sessionCountWithHoursPack(locale, props.rollingMax),
                    dailyMaxPack: sessionCountWithHoursPack(locale, props.dailyMax),
                  })}
                </li>
                <li className="space-y-2">
                  <RollingSlideWindowsVisual t={t} />
                  <p>
                    <span className="font-medium text-stone-600 dark:text-stone-400">
                      {t("account.labelSlide")}
                    </span>{" "}
                    {t("account.genericSlide")}
                  </p>
                </li>
              </ul>
            )}
          </div>
        </details>
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
            <dt className="text-stone-500 dark:text-stone-500">{t("account.dtInstrument")}</dt>
            <dd className="max-w-md text-right font-medium text-stone-900 dark:text-stone-50">{instrumentDisplay}</dd>
          </div>
          <div className="flex flex-wrap justify-between gap-2 border-b border-stone-100 dark:border-stone-800 py-2">
            <dt className="text-stone-500 dark:text-stone-500">{t("account.dtUserCategory")}</dt>
            <dd className="max-w-md text-right font-medium text-stone-900 dark:text-stone-50">{userCategoryText}</dd>
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
            <dd className="mt-3 text-stone-800 dark:text-stone-200">
              {props.preferredDateIsos.length === 0 ? (
                <p>{dash}</p>
              ) : (
                <div
                  className="flex flex-wrap gap-3"
                  role="group"
                  aria-label={preferredDatesText}
                >
                  {prefsMonths.map(({ year, month1 }) => (
                    <AccountCalendarMonthReadonly
                      key={`${year}-${month1}`}
                      year={year}
                      month1={month1}
                      selected={prefsDateSelected}
                      weekdays={calWeekdays}
                      monthTitle={new Date(year, month1 - 1, 1).toLocaleDateString(locTag, {
                        year: "numeric",
                        month: "long",
                      })}
                    />
                  ))}
                </div>
              )}
            </dd>
          </div>
          <div className="border-b border-stone-100 dark:border-stone-800 py-2">
            <dt className="text-stone-500 dark:text-stone-500">{t("account.dtPreferredTimes")}</dt>
            <dd className="mt-3 text-stone-800 dark:text-stone-200">
              <AccountPreferredTimesVisual
                raw={props.preferredTimeText}
                dash={dash}
                t={t}
                plainSummary={preferredTimesText}
              />
            </dd>
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
    </main>
  );
}
