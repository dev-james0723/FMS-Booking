"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { withBasePath } from "@/lib/base-path";
import {
  displayVenueLabel,
  formatSlotDateForLocale,
  formatSlotTimeRangeEn,
} from "@/lib/booking-slot-display";
import { ROLLING_WINDOW_CALENDAR_DAYS } from "@/lib/booking/booking-constants";
import { parseBookingTestMode } from "@/lib/booking/booking-portal-live";
import { shiftHkDateKey } from "@/lib/booking/hk-dates";
import {
  buildMonthGrid,
  daysInCalendarMonth,
  isHkDayBookable,
  parseCampaignDateKeysFromSettings,
  slotStartsAtToHkDateKey,
} from "@/lib/hk-calendar-client";
import {
  CAMPAIGN_EXPERIENCE_RANGE_LABEL_EN,
  CAMPAIGN_EXPERIENCE_RANGE_LABEL_ZH,
} from "@/lib/booking/campaign-constants";
import { buildPreviewSlotsForHkDay } from "@/lib/booking/preview-slots";
import { useTranslation } from "@/lib/i18n/use-translation";
import { sessionHoursParen } from "@/lib/i18n/session-hours";
import {
  formatInstantForBookingOpensEn,
  formatInstantForBookingOpensZhHk,
  HK_TZ,
} from "@/lib/time";
import {
  BookingIconCampaignRange,
  BookingIconMentorStudent,
  BookingIconPerson,
  BookingIconTeaching,
} from "@/components/booking-quota-icons";
import { BookingRulesVisual } from "@/components/booking-rules-visual";
import { BookingConfirmedModal } from "@/components/booking-confirmed-modal";
import { RegistrationErrorModal } from "@/components/registration-error-modal";
import { useSiteMe } from "@/lib/auth/use-site-me";
import {
  CAMERA_RENTAL_HERO_PATH,
  CAMERA_RENTAL_QR_PATH,
  CAMERA_RENTAL_STRIPE_CHECKOUT_URL,
  CAMERA_USAGE_GUIDE_DRIVE_URL,
} from "@/lib/booking/camera-rental";

type SlotRow = {
  id: string;
  startsAt: string;
  endsAt: string;
  remaining: number;
  venueLabel: string | null;
};

type LimitsPayload = {
  quotaTier: string;
  tier: string;
  limits: { dailyMax: number; rollingMax: number };
  todayKey: string;
  countsByDay: Record<string, number>;
  todayCommitted: number;
  todayRemaining: number;
  rollingSumCommitted?: number;
  rollingWindow?: { calendarDays: number; startKey: string; endKey: string };
  eligibility?: {
    individualEligible: boolean;
    teachingEligible: boolean;
    dualEligible: boolean;
  };
  cooldown?: { active: boolean; remainingMs: number; nextBookingAt: string | null };
  provisional: {
    wouldExceedDaily: boolean;
    wouldExceedRolling: boolean;
    firstViolatingDate: string | null;
    rollingSum: number;
  };
};

function QuotaBlockStrip({
  filled,
  total,
  filledClassName,
  emptyClassName,
}: {
  filled: number;
  total: number;
  filledClassName: string;
  emptyClassName: string;
}) {
  const n = Math.max(0, total);
  const f = Math.min(n, Math.max(0, filled));
  return (
    <div className="mt-2 flex gap-1" aria-hidden>
      {Array.from({ length: n }, (_, i) => (
        <span
          key={i}
          className={`h-2.5 min-w-0 flex-1 rounded-sm ${i < f ? filledClassName : emptyClassName}`}
        />
      ))}
    </div>
  );
}

function hkTodayKeyFromMs(ms: number): string {
  return new Date(ms).toLocaleDateString("en-CA", { timeZone: HK_TZ });
}

function padMonthDay(n: number): string {
  return String(n).padStart(2, "0");
}

function defaultHkMonthKey(todayKey: string, cStart: string | null, cEnd: string | null): string {
  if (!cStart || !cEnd) return "2026-04";
  let y: number;
  let m: number;
  if (todayKey < cStart) {
    y = Number(cStart.slice(0, 4));
    m = Number(cStart.slice(5, 7));
  } else if (todayKey > cEnd) {
    y = Number(cEnd.slice(0, 4));
    m = Number(cEnd.slice(5, 7));
  } else {
    y = Number(todayKey.slice(0, 4));
    m = Number(todayKey.slice(5, 7));
  }
  if (!monthTouchesCampaign(y, m, cStart, cEnd)) {
    y = Number(cStart.slice(0, 4));
    m = Number(cStart.slice(5, 7));
  }
  return `${y}-${padMonthDay(m)}`;
}

function shiftCalendarMonth(y: number, m: number, delta: number): [number, number] {
  let nm = m + delta;
  let ny = y;
  while (nm > 12) {
    nm -= 12;
    ny += 1;
  }
  while (nm < 1) {
    nm += 12;
    ny -= 1;
  }
  return [ny, nm];
}

function monthTouchesCampaign(y: number, m: number, cStart: string, cEnd: string): boolean {
  const dim = daysInCalendarMonth(y, m);
  const first = `${y}-${padMonthDay(m)}-01`;
  const last = `${y}-${padMonthDay(m)}-${padMonthDay(dim)}`;
  return !(last < cStart || first > cEnd);
}

export type BookingRequestVenue = "studio_room" | "open_space";

export function BookingRequestPanel(props: {
  venueKind: BookingRequestVenue;
  bookingPathPrefix: string;
  /** Studio portal: 「其他選擇時段途徑」— rendered above relocated 「規則速覽」. */
  studioAlternatePathCallout?: ReactNode;
}) {
  const { venueKind, bookingPathPrefix, studioAlternatePathCallout } = props;
  const { user } = useSiteMe();
  const { t, tr, locale } = useTranslation();
  const calendarOverviewLinkLabel =
    venueKind === "open_space" || user?.bookingVenueKind === "open_space"
      ? t("booking.request.linkCalendarOverviewOpenSpace")
      : t("booking.request.linkCalendarOverviewStudioRoom");
  const campaignRange =
    locale === "en" ? CAMPAIGN_EXPERIENCE_RANGE_LABEL_EN : CAMPAIGN_EXPERIENCE_RANGE_LABEL_ZH;
  const weekdays = useMemo(
    () =>
      locale === "en"
        ? (["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const)
        : (["日", "一", "二", "三", "四", "五", "六"] as const),
    [locale]
  );

  const [settings, setSettings] = useState<Record<string, unknown> | null>(null);
  const [allMonthSlots, setAllMonthSlots] = useState<SlotRow[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [selectedDayKey, setSelectedDayKey] = useState<string | null>(null);
  const [monthOverride, setMonthOverride] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [limits, setLimits] = useState<LimitsPayload | null>(null);
  const [blockFlashSlotId, setBlockFlashSlotId] = useState<string | null>(null);
  const [dailyCapHint, setDailyCapHint] = useState<string | null>(null);
  const [dailyCapModalOpen, setDailyCapModalOpen] = useState(false);
  const [serverEffectiveNowMs, setServerEffectiveNowMs] = useState<number | null>(null);
  const [dualEligible, setDualEligible] = useState(false);
  const [bookingPortalOpen, setBookingPortalOpen] = useState(false);
  const [meGatesLoaded, setMeGatesLoaded] = useState(false);
  const [bookingIdentityChoice, setBookingIdentityChoice] = useState<
    "individual" | "teaching_or_with_students"
  >("individual");

  type CamPref = null | "no" | "yes";
  type CamPay = null | "paid_before" | "pay_after" | "need_choice";
  const [camPref, setCamPref] = useState<CamPref>(null);
  const [camPay, setCamPay] = useState<CamPay>(null);
  const [camModalOpen, setCamModalOpen] = useState(false);
  const [camModalPaidPick, setCamModalPaidPick] = useState<boolean | null>(null);

  const cameraSubmitBlocking =
    camPref === null ||
    (camPref === "yes" && camPay !== "paid_before" && camPay !== "pay_after");

  const [nowMs, setNowMs] = useState(() => Date.now());
  useEffect(() => {
    if (serverEffectiveNowMs != null) return;
    const id = window.setInterval(() => setNowMs(Date.now()), 60_000);
    return () => window.clearInterval(id);
  }, [serverEffectiveNowMs]);

  const todayKey = hkTodayKeyFromMs(serverEffectiveNowMs ?? nowMs);

  const campaign = useMemo(
    () => parseCampaignDateKeysFromSettings(settings),
    [settings]
  );

  const defaultMonthKey = useMemo(
    () => defaultHkMonthKey(todayKey, campaign.start, campaign.end),
    [todayKey, campaign.start, campaign.end]
  );

  const viewMonthKey = monthOverride ?? defaultMonthKey;
  const viewYear = Number(viewMonthKey.slice(0, 4));
  const viewMonth = Number(viewMonthKey.slice(5, 7));

  const monthRange = useMemo(() => {
    const dim = daysInCalendarMonth(viewYear, viewMonth);
    const padM = padMonthDay(viewMonth);
    return {
      from: `${viewYear}-${padM}-01`,
      to: `${viewYear}-${padM}-${padMonthDay(dim)}`,
    };
  }, [viewYear, viewMonth]);

  const loadSettings = useCallback(async () => {
    const res = await fetch(withBasePath("/api/v1/public/settings"));
    const data = await res.json();
    setSettings(data.settings ?? {});
    const iso =
      data && typeof data === "object" && typeof data.booking_effective_now_iso === "string"
        ? data.booking_effective_now_iso
        : null;
    if (iso) {
      const parsed = new Date(iso).getTime();
      setServerEffectiveNowMs(Number.isNaN(parsed) ? null : parsed);
    } else {
      setServerEffectiveNowMs(null);
    }
  }, []);

  const loadMonthSlots = useCallback(async () => {
    setLoading(true);
    setError(null);
    const q = new URLSearchParams({
      from: monthRange.from,
      to: monthRange.to,
      venue: venueKind,
    });
    const res = await fetch(withBasePath(`/api/v1/booking/availability?${q}`));
    const data = await res.json();
    if (!res.ok) {
      setError(data?.error?.message ?? t("booking.request.loadSlotsError"));
      setAllMonthSlots([]);
      setLoading(false);
      return;
    }
    setAllMonthSlots(Array.isArray(data.slots) ? data.slots : []);
    setLoading(false);
  }, [monthRange.from, monthRange.to, t, venueKind]);

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const res = await fetch(withBasePath("/api/v1/me"), { credentials: "same-origin" });
      if (cancelled) return;
      if (!res.ok) {
        setMeGatesLoaded(true);
        return;
      }
      const data = (await res.json().catch(() => null)) as {
        user?: { bookingEligibility?: { dualEligible?: boolean } | null };
        gates?: { bookingPortalOpen?: boolean };
      } | null;
      const d = data?.user?.bookingEligibility?.dualEligible === true;
      const open = data?.gates?.bookingPortalOpen === true;
      if (!cancelled) {
        setDualEligible(d);
        setBookingPortalOpen(open);
        setMeGatesLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    void loadMonthSlots();
  }, [loadMonthSlots]);

  const selectedKey = [...selected].sort().join(",");

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const q =
        selected.size > 0
          ? `?extra=${encodeURIComponent([...selected].join(","))}`
          : "";
      const res = await fetch(withBasePath(`/api/v1/booking/limits${q}`), {
        credentials: "same-origin",
      });
      if (cancelled) return;
      if (!res.ok) {
        setLimits(null);
        return;
      }
      const data = await res.json().catch(() => null);
      if (data && typeof data === "object" && "limits" in data) {
        const raw = data as LimitsPayload & { countsByDay?: Record<string, number> };
        setLimits({
          ...raw,
          countsByDay: raw.countsByDay ?? {},
        });
      } else {
        setLimits(null);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- selectedKey encodes Set contents; avoids churn
  }, [selectedKey]);

  const dailyMax = limits?.limits.dailyMax ?? 5;
  const countsByDay = limits?.countsByDay ?? {};

  const bookingOpensAt =
    typeof settings?.booking_opens_at === "string" ? settings.booking_opens_at : null;
  const bookingTestMode = parseBookingTestMode(settings?.booking_test_mode);
  const bookingOpensPassed =
    bookingOpensAt != null && nowMs >= new Date(bookingOpensAt).getTime();
  /** Test mode must win even if `/me` gate desyncs; otherwise QA cannot pick dates. */
  const bookingLive =
    bookingTestMode || (meGatesLoaded ? bookingPortalOpen : bookingOpensPassed);

  useEffect(() => {
    if (!bookingLive) return;
    const tick = () => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        void loadMonthSlots();
      }
    };
    const id = window.setInterval(tick, 45_000);
    window.addEventListener("focus", tick);
    return () => {
      window.clearInterval(id);
      window.removeEventListener("focus", tick);
    };
  }, [bookingLive, loadMonthSlots]);

  const bookingOpensAtLabel =
    bookingOpensAt != null
      ? locale === "en"
        ? formatInstantForBookingOpensEn(new Date(bookingOpensAt))
        : formatInstantForBookingOpensZhHk(new Date(bookingOpensAt))
      : null;

  const slotsForSelectedDay = useMemo(() => {
    if (!selectedDayKey) return [];
    if (!bookingLive) {
      return buildPreviewSlotsForHkDay(selectedDayKey);
    }
    return allMonthSlots
      .filter((s) => slotStartsAtToHkDateKey(s.startsAt) === selectedDayKey)
      .slice()
      .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
  }, [allMonthSlots, selectedDayKey, bookingLive]);

  const freeSlotsByDay = useMemo(() => {
    const m = new Map<string, number>();
    for (const s of allMonthSlots) {
      if (s.remaining <= 0) continue;
      const k = slotStartsAtToHkDateKey(s.startsAt);
      m.set(k, (m.get(k) ?? 0) + 1);
    }
    return m;
  }, [allMonthSlots]);

  const totalSlotsByDay = useMemo(() => {
    const m = new Map<string, number>();
    for (const s of allMonthSlots) {
      const k = slotStartsAtToHkDateKey(s.startsAt);
      m.set(k, (m.get(k) ?? 0) + 1);
    }
    return m;
  }, [allMonthSlots]);

  const monthGrid = useMemo(
    () => buildMonthGrid(viewYear, viewMonth),
    [viewYear, viewMonth]
  );

  const [prevYm, nextYm] = useMemo(() => {
    return [shiftCalendarMonth(viewYear, viewMonth, -1), shiftCalendarMonth(viewYear, viewMonth, 1)];
  }, [viewYear, viewMonth]);

  const prevNavDisabled =
    !campaign.start ||
    !campaign.end ||
    !monthTouchesCampaign(prevYm[0], prevYm[1], campaign.start, campaign.end);
  const nextNavDisabled =
    !campaign.start ||
    !campaign.end ||
    !monthTouchesCampaign(nextYm[0], nextYm[1], campaign.start, campaign.end);

  function selectedCountOnDay(dayKey: string, sel: Set<string>): number {
    let n = 0;
    for (const id of sel) {
      const s = allMonthSlots.find((x) => x.id === id);
      if (s && slotStartsAtToHkDateKey(s.startsAt) === dayKey) n++;
    }
    return n;
  }

  function tryToggleSlot(id: string) {
    if (!bookingLive) return;
    const slot = allMonthSlots.find((s) => s.id === id);
    if (!slot || slot.remaining <= 0) return;

    if (selected.has(id)) {
      setSelected((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      return;
    }

    const dayKey = slotStartsAtToHkDateKey(slot.startsAt);
    const committed = countsByDay[dayKey] ?? 0;
    const selectedOnDay = selectedCountOnDay(dayKey, selected);
    if (committed + selectedOnDay >= dailyMax) {
      setBlockFlashSlotId(id);
      window.setTimeout(() => setBlockFlashSlotId(null), 650);
      setDailyCapHint(
        tr("booking.request.dailyCapHint", {
          dayKey,
          dailyMax: String(dailyMax),
          dailyMaxH: sessionHoursParen(locale, dailyMax),
        })
      );
      window.setTimeout(() => setDailyCapHint(null), 4500);
      setDailyCapModalOpen(true);
      return;
    }

    setSelected((prev) => new Set(prev).add(id));
  }

  function cancelCamModal() {
    setCamModalOpen(false);
    setCamModalPaidPick(null);
    if (camPref === "yes" && camPay === null) {
      setCamPref(null);
    }
  }

  function confirmCamModal() {
    if (camModalPaidPick === null) return;
    if (camModalPaidPick) {
      setCamPay("paid_before");
    } else {
      setCamPay("need_choice");
    }
    setCamModalOpen(false);
    setCamModalPaidPick(null);
  }

  async function submit() {
    setSubmitting(true);
    setError(null);
    setDone(null);
    if (camPref === null) {
      setError(t("booking.request.cameraSubmitPickRentalHint"));
      setSubmitting(false);
      return;
    }
    if (camPref === "yes" && camPay !== "paid_before" && camPay !== "pay_after") {
      setError(t("booking.request.cameraSubmitCompletePaymentFlowHint"));
      setSubmitting(false);
      return;
    }
    const payload: {
      slotIds: string[];
      bookingIdentityType?: "individual" | "teaching_or_with_students";
      cameraRentalOptIn: boolean;
      cameraRentalPaymentChoice: "paid_before_booking" | "pay_after_booking" | null;
    } = {
      slotIds: [...selected],
      cameraRentalOptIn: camPref === "yes",
      cameraRentalPaymentChoice:
        camPref === "yes"
          ? camPay === "paid_before"
            ? "paid_before_booking"
            : "pay_after_booking"
          : null,
    };
    if (dualEligible) {
      payload.bookingIdentityType = bookingIdentityChoice;
    }
    const res = await fetch(withBasePath("/api/v1/booking/request"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data?.error?.message ?? t("booking.request.submitError"));
      setSubmitting(false);
      return;
    }
    setDone(data.bookingRequestId ?? "OK");
    setSelected(new Set());
    setCamPref(null);
    setCamPay(null);
    await loadMonthSlots();
    setSubmitting(false);
  }

  const lastBookableKey =
    campaign.start && campaign.end
      ? (() => {
          const raw = shiftHkDateKey(todayKey, ROLLING_WINDOW_CALENDAR_DAYS - 1);
          return raw <= campaign.end ? raw : campaign.end;
        })()
      : null;

  const submitDisabledNoSelection = selected.size === 0 || submitting || !bookingLive;
  const submitDisabledLimits =
    limits != null &&
    selected.size > 0 &&
    (limits.provisional.wouldExceedDaily || limits.provisional.wouldExceedRolling);
  const submitDisabledCooldown = limits?.cooldown?.active === true;
  const submitDisabled =
    submitDisabledNoSelection ||
    cameraSubmitBlocking ||
    submitDisabledCooldown ||
    submitDisabledLimits;

  return (
    <div className="space-y-6">
      {!bookingLive && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-5 sm:px-4 py-3 text-sm text-amber-950">
          {t("booking.request.notOpenBanner")}
          {bookingOpensAtLabel ? (
            <span className="mt-2 block text-xs text-amber-900/85">
              {tr("booking.request.bookingOpensLine", { time: bookingOpensAtLabel })}
            </span>
          ) : null}
        </p>
      )}

      <div className="space-y-4">
        <div className="flex gap-3 rounded-xl border border-stone-200 bg-stone-50/90 px-4 py-3 dark:border-stone-700 dark:bg-stone-900/35">
          <BookingIconCampaignRange className="mt-0.5 h-9 w-9 shrink-0 text-blue-800 dark:text-blue-400" />
          <p className="text-sm leading-relaxed text-stone-700 dark:text-stone-300">
            {tr("booking.request.campaignLine", {
              range: campaignRange,
              windowDays: String(ROLLING_WINDOW_CALENDAR_DAYS),
            })}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void loadMonthSlots()}
          className="flex w-full min-h-12 items-center justify-center rounded-lg border border-blue-950/40 bg-blue-950 px-5 sm:px-4 py-3 text-center text-sm font-medium text-white shadow-sm transition hover:bg-blue-900 active:bg-blue-950 sm:min-h-[3rem] sm:text-base focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-800"
        >
          {t("booking.request.refresh")}
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-5 sm:px-4 py-2 text-sm text-red-900">
          {error}
        </div>
      )}
      <BookingConfirmedModal
        open={Boolean(done)}
        bookingRequestId={done ?? ""}
        historyHref={`${bookingPathPrefix}/history`}
        onDismiss={() => setDone(null)}
      />

      {dailyCapHint && (
        <p
          className="rounded-lg border border-red-300 bg-red-50 px-5 sm:px-4 py-2 text-sm text-red-900 motion-safe:animate-pulse"
          role="status"
        >
          {dailyCapHint}
        </p>
      )}

      <div className="space-y-3">
        <Link
          href={`${bookingPathPrefix}/calendar`}
          className="flex w-full min-h-12 items-center justify-center rounded-lg border border-emerald-950/30 bg-emerald-900 px-5 sm:px-4 py-3 text-center text-sm font-medium text-white shadow-sm transition hover:bg-emerald-950 active:bg-emerald-950 sm:min-h-[3rem] sm:text-base focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800"
        >
          {calendarOverviewLinkLabel}
        </Link>

        {limits && (
          <div className="rounded-lg border border-stone-200 dark:border-stone-700 bg-surface px-5 sm:px-4 py-4 text-sm text-stone-700 dark:text-stone-300 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-medium text-stone-900 dark:text-stone-50">
                {t("booking.request.limitsTitle")}
              </h3>
              <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-stone-200 bg-stone-100 py-0.5 pl-1.5 pr-2.5 text-xs font-medium text-stone-700 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-200">
                {limits.quotaTier === "teaching" || limits.tier === "teaching" ? (
                  <BookingIconTeaching className="h-4 w-4 text-indigo-700 dark:text-indigo-300" />
                ) : (
                  <span className="flex items-center gap-0.5">
                    <BookingIconPerson className="h-3.5 w-3.5 text-sky-700 dark:text-sky-300" />
                    <BookingIconMentorStudent className="h-3.5 w-3.5 text-teal-700 dark:text-teal-300" />
                  </span>
                )}
                {limits.quotaTier === "teaching" || limits.tier === "teaching"
                  ? t("booking.request.tierTeachingQuota")
                  : t("booking.request.tierIndividualQuota")}
              </span>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div
                className="rounded-lg border border-stone-200/90 bg-white px-3 py-3 dark:border-stone-600 dark:bg-stone-900/50"
                role="group"
                aria-label={tr("booking.request.limitsMeterAriaToday", {
                  date: limits.todayKey,
                  used: String(limits.todayCommitted),
                  max: String(limits.limits.dailyMax),
                  remaining: String(limits.todayRemaining),
                  usedH: sessionHoursParen(locale, limits.todayCommitted),
                  maxH: sessionHoursParen(locale, limits.limits.dailyMax),
                  remainingH: sessionHoursParen(locale, limits.todayRemaining),
                })}
              >
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400">
                    {t("booking.request.limitsCardToday")}
                  </p>
                  <p className="font-mono text-[11px] text-stone-400 dark:text-stone-500">
                    {limits.todayKey}
                  </p>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <div className="rounded-md bg-stone-50 px-2.5 py-2 dark:bg-stone-800/80">
                    <p className="text-[11px] font-medium text-stone-500 dark:text-stone-400">
                      {t("booking.request.limitsUsedLabel")}
                    </p>
                    <p className="mt-0.5 text-2xl font-semibold tabular-nums text-stone-900 dark:text-stone-50">
                      {limits.todayCommitted}
                      <span className="ml-1 text-sm font-normal text-stone-500 dark:text-stone-400">
                        {t("booking.request.limitsSessionsUnit")}
                      </span>
                      <span className="ml-1 text-xs font-normal text-stone-500 dark:text-stone-500">
                        {sessionHoursParen(locale, limits.todayCommitted)}
                      </span>
                    </p>
                  </div>
                  <div className="rounded-md bg-emerald-50 px-2.5 py-2 dark:bg-emerald-950/35">
                    <p className="text-[11px] font-medium text-emerald-800/90 dark:text-emerald-300/90">
                      {t("booking.request.limitsLeftLabel")}
                    </p>
                    <p className="mt-0.5 text-2xl font-semibold tabular-nums text-emerald-800 dark:text-emerald-200">
                      {limits.todayRemaining}
                      <span className="ml-1 text-sm font-normal text-emerald-700/80 dark:text-emerald-300/70">
                        {t("booking.request.limitsSessionsUnit")}
                      </span>
                      <span className="ml-1 text-xs font-normal text-emerald-800/80 dark:text-emerald-300/80">
                        {sessionHoursParen(locale, limits.todayRemaining)}
                      </span>
                    </p>
                  </div>
                </div>
                <p className="mt-2 text-[11px] text-stone-500 dark:text-stone-400">
                  {t("booking.request.limitsDailyCapShort")} · {limits.limits.dailyMax}{" "}
                  {t("booking.request.limitsSessionsUnit")}
                  {sessionHoursParen(locale, limits.limits.dailyMax)}
                </p>
                <QuotaBlockStrip
                  filled={limits.todayCommitted}
                  total={limits.limits.dailyMax}
                  filledClassName="bg-blue-600 dark:bg-blue-500"
                  emptyClassName="bg-stone-200 dark:bg-stone-600"
                />
              </div>

              {limits.rollingSumCommitted != null ? (
                <div
                  className="rounded-lg border border-stone-200/90 bg-white px-3 py-3 dark:border-stone-600 dark:bg-stone-900/50"
                  role="group"
                  aria-label={tr("booking.request.limitsMeterAriaRolling", {
                    used: String(limits.rollingSumCommitted),
                    max: String(limits.limits.rollingMax),
                    remaining: String(
                      Math.max(0, limits.limits.rollingMax - limits.rollingSumCommitted)
                    ),
                    usedH: sessionHoursParen(locale, limits.rollingSumCommitted),
                    maxH: sessionHoursParen(locale, limits.limits.rollingMax),
                    remainingH: sessionHoursParen(
                      locale,
                      Math.max(0, limits.limits.rollingMax - limits.rollingSumCommitted)
                    ),
                  })}
                >
                  <p className="text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400">
                    {t("booking.request.limitsCardRolling")}
                  </p>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <div className="rounded-md bg-stone-50 px-2.5 py-2 dark:bg-stone-800/80">
                      <p className="text-[11px] font-medium text-stone-500 dark:text-stone-400">
                        {t("booking.request.limitsUsedLabel")}
                      </p>
                      <p className="mt-0.5 text-2xl font-semibold tabular-nums text-stone-900 dark:text-stone-50">
                        {limits.rollingSumCommitted}
                        <span className="ml-1 text-sm font-normal text-stone-500 dark:text-stone-400">
                          {t("booking.request.limitsSessionsUnit")}
                        </span>
                        <span className="ml-1 text-xs font-normal text-stone-500 dark:text-stone-500">
                          {sessionHoursParen(locale, limits.rollingSumCommitted)}
                        </span>
                      </p>
                    </div>
                    <div className="rounded-md bg-violet-50 px-2.5 py-2 dark:bg-violet-950/35">
                      <p className="text-[11px] font-medium text-violet-900/85 dark:text-violet-300/90">
                        {t("booking.request.limitsLeftLabel")}
                      </p>
                      <p className="mt-0.5 text-2xl font-semibold tabular-nums text-violet-900 dark:text-violet-200">
                        {Math.max(0, limits.limits.rollingMax - limits.rollingSumCommitted)}
                        <span className="ml-1 text-sm font-normal text-violet-800/75 dark:text-violet-300/70">
                          {t("booking.request.limitsSessionsUnit")}
                        </span>
                        <span className="ml-1 text-xs font-normal text-violet-800/75 dark:text-violet-300/75">
                          {sessionHoursParen(
                            locale,
                            Math.max(0, limits.limits.rollingMax - limits.rollingSumCommitted)
                          )}
                        </span>
                      </p>
                    </div>
                  </div>
                  <p className="mt-2 text-[11px] text-stone-500 dark:text-stone-400">
                    {t("booking.request.limitsRollingCapShort")} · {limits.limits.rollingMax}{" "}
                    {t("booking.request.limitsSessionsUnit")}
                    {sessionHoursParen(locale, limits.limits.rollingMax)}
                  </p>
                  <QuotaBlockStrip
                    filled={limits.rollingSumCommitted}
                    total={limits.limits.rollingMax}
                    filledClassName="bg-violet-600 dark:bg-violet-500"
                    emptyClassName="bg-stone-200 dark:bg-stone-600"
                  />
                </div>
              ) : null}
            </div>

            {limits.rollingWindow ? (
              <div className="mt-3 flex flex-col gap-1.5 rounded-lg border border-dashed border-stone-300 bg-stone-50/80 px-3 py-2.5 dark:border-stone-600 dark:bg-stone-900/30 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-xs font-medium text-stone-600 dark:text-stone-400">
                  {t("booking.request.limitsWindowLabel")}
                </span>
                <span className="font-mono text-sm font-medium text-stone-800 dark:text-stone-200">
                  <span className="text-stone-500 dark:text-stone-500">{limits.rollingWindow.startKey}</span>
                  <span className="mx-2 text-stone-400 dark:text-stone-600" aria-hidden>
                    →
                  </span>
                  <span className="text-stone-500 dark:text-stone-500">{limits.rollingWindow.endKey}</span>
                </span>
              </div>
            ) : null}

            {limits.eligibility ? (
              <div className="mt-3">
                <p className="mb-1.5 text-xs font-medium text-stone-500 dark:text-stone-400">
                  {t("booking.request.limitsEligibilityLabel")}
                </p>
                <div className="flex flex-wrap gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium ${
                      limits.eligibility.individualEligible
                        ? "border-emerald-300/80 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200"
                        : "border-stone-200 bg-stone-100 text-stone-600 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-400"
                    }`}
                  >
                    <BookingIconPerson
                      className={`h-3.5 w-3.5 shrink-0 ${
                        limits.eligibility.individualEligible
                          ? "text-emerald-800 dark:text-emerald-200"
                          : "text-stone-400 dark:text-stone-500"
                      }`}
                    />
                    <span
                      className={`inline-block h-1.5 w-1.5 rounded-full ${
                        limits.eligibility.individualEligible
                          ? "bg-emerald-500"
                          : "bg-stone-400 dark:bg-stone-500"
                      }`}
                      aria-hidden
                    />
                    {t("booking.request.limitsEligibilityIndividual")} ·{" "}
                    {limits.eligibility.individualEligible ? t("booking.request.yes") : t("booking.request.no")}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium ${
                      limits.eligibility.teachingEligible
                        ? "border-emerald-300/80 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200"
                        : "border-stone-200 bg-stone-100 text-stone-600 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-400"
                    }`}
                  >
                    <BookingIconTeaching
                      className={`h-3.5 w-3.5 shrink-0 ${
                        limits.eligibility.teachingEligible
                          ? "text-emerald-800 dark:text-emerald-200"
                          : "text-stone-400 dark:text-stone-500"
                      }`}
                    />
                    <span
                      className={`inline-block h-1.5 w-1.5 rounded-full ${
                        limits.eligibility.teachingEligible
                          ? "bg-emerald-500"
                          : "bg-stone-400 dark:bg-stone-500"
                      }`}
                      aria-hidden
                    />
                    {t("booking.request.limitsEligibilityTeaching")} ·{" "}
                    {limits.eligibility.teachingEligible ? t("booking.request.yes") : t("booking.request.no")}
                  </span>
                </div>
              </div>
            ) : null}

            {limits.cooldown?.active && limits.cooldown.nextBookingAt ? (
              <p className="mt-3 rounded-md border border-amber-200/90 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-100">
                {tr("booking.request.cooldownLine", {
                  until: new Date(limits.cooldown.nextBookingAt).toLocaleString(
                    locale === "en" ? "en-GB" : "zh-HK",
                    {
                      timeZone: HK_TZ,
                      year: "numeric",
                      month: "numeric",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    }
                  ),
                })}
              </p>
            ) : null}

            <p className="mt-3 border-t border-stone-200 pt-3 text-xs text-stone-500 dark:text-stone-500 dark:border-stone-700">
              {tr("booking.request.limitsPickHint", {
                dailyMax: String(limits.limits.dailyMax),
                dailyMaxH: sessionHoursParen(locale, limits.limits.dailyMax),
              })}
            </p>

            {selected.size > 0 &&
              (limits.provisional.wouldExceedDaily || limits.provisional.wouldExceedRolling) && (
                <p className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-900 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
                  {t("booking.request.wouldExceedTitle")}
                  {limits.provisional.wouldExceedDaily && (
                    <span className="mt-1 block font-normal">
                      {tr("booking.request.exceedDaily", {
                        dailyMax: String(limits.limits.dailyMax),
                        dailyMaxH: sessionHoursParen(locale, limits.limits.dailyMax),
                        datePart: limits.provisional.firstViolatingDate
                          ? tr("booking.request.exceedDailyDate", {
                              date: limits.provisional.firstViolatingDate,
                            })
                          : "",
                      })}
                    </span>
                  )}
                  {limits.provisional.wouldExceedRolling && (
                    <span className="mt-1 block font-normal">
                      {tr("booking.request.exceedRolling", {
                        rollingSum: String(limits.provisional.rollingSum),
                        rollingMax: String(limits.limits.rollingMax),
                        rollingSumH: sessionHoursParen(locale, limits.provisional.rollingSum),
                        rollingMaxH: sessionHoursParen(locale, limits.limits.rollingMax),
                      })}
                    </span>
                  )}
                </p>
              )}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-stone-200 dark:border-stone-700 bg-surface p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-medium text-stone-900 dark:text-stone-50">
            {tr("booking.request.monthTitle", {
              year: String(viewYear),
              month: String(viewMonth),
            })}
          </h2>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={prevNavDisabled}
              onClick={() => {
                setSelectedDayKey(null);
                const [ny, nm] = prevYm;
                setMonthOverride(`${ny}-${padMonthDay(nm)}`);
              }}
              className="rounded-lg border border-stone-300 dark:border-stone-600 px-3 py-1.5 text-sm text-stone-800 dark:text-stone-200 hover:bg-stone-50 dark:hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {t("booking.request.prevMonth")}
            </button>
            <button
              type="button"
              disabled={nextNavDisabled}
              onClick={() => {
                setSelectedDayKey(null);
                const [ny, nm] = nextYm;
                setMonthOverride(`${ny}-${padMonthDay(nm)}`);
              }}
              className="rounded-lg border border-stone-300 dark:border-stone-600 px-3 py-1.5 text-sm text-stone-800 dark:text-stone-200 hover:bg-stone-50 dark:hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {t("booking.request.nextMonth")}
            </button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-7 gap-1 text-center text-xs font-medium text-stone-500 dark:text-stone-500">
          {weekdays.map((w) => (
            <div key={w} className="py-1">
              {w}
            </div>
          ))}
        </div>

        <div className="mt-1 grid grid-cols-7 gap-1">
          {monthGrid.map((cell, idx) => {
            const dk = cell.dateKey;
            if (!dk) {
              return <div key={`e-${idx}`} className="aspect-square min-h-[2.75rem]" />;
            }
            const inCampaignRange =
              Boolean(campaign.start && campaign.end) &&
              dk >= campaign.start! &&
              dk <= campaign.end!;
            const inRollingWindow =
              inCampaignRange &&
              isHkDayBookable({
                dateKey: dk,
                todayKey,
                campaignStart: campaign.start!,
                campaignEnd: campaign.end!,
                rollingWindowCalendarDays: ROLLING_WINDOW_CALENDAR_DAYS,
              });
            const bookable = inCampaignRange ? (bookingLive ? inRollingWindow : true) : false;
            const notYetOpen =
              bookingLive && inCampaignRange && dk >= todayKey && !inRollingWindow;
            const free = freeSlotsByDay.get(dk) ?? 0;
            const total = totalSlotsByDay.get(dk) ?? 0;
            const isSelected = selectedDayKey === dk;
            return (
              <button
                key={dk}
                type="button"
                disabled={!bookable}
                onClick={() => {
                  if (bookable) setSelectedDayKey(dk);
                }}
                className={`relative flex aspect-square min-h-[2.75rem] flex-col items-center justify-center rounded-lg border text-sm transition ${
                  !bookable
                    ? "cursor-not-allowed border-stone-100 dark:border-stone-800 bg-stone-50 dark:bg-stone-900 text-stone-300"
                    : isSelected
                      ? "border-stone-900 bg-stone-900 text-white shadow-sm"
                      : "border-stone-200 dark:border-stone-700 bg-surface text-stone-800 dark:text-stone-200 hover:border-stone-400 dark:border-stone-500"
                }`}
              >
                <span className="font-medium">{Number(dk.slice(8, 10))}</span>
                {bookingLive && bookable && free > 0 && (
                  <span
                    className={`mt-0.5 h-1.5 w-1.5 rounded-full ${
                      isSelected ? "bg-emerald-300" : "bg-emerald-500"
                    }`}
                    title={tr("booking.request.dotTitle", {
                      n: String(free),
                      nH: sessionHoursParen(locale, free),
                    })}
                  />
                )}
                {bookingLive && bookable && free === 0 && total > 0 && (
                  <span className="mt-0.5 text-[9px] text-stone-400 dark:text-stone-500">
                    {t("booking.request.fullLabel")}
                  </span>
                )}
                {bookingLive && bookable && total === 0 && (
                  <span className="mt-0.5 text-[9px] text-stone-400 dark:text-stone-500">
                    {t("booking.request.noInventoryLabel")}
                  </span>
                )}
                {notYetOpen && (
                  <span className="mt-0.5 text-[9px] font-medium text-amber-700/90 dark:text-amber-400/90">
                    {t("booking.request.notYetOpenLabel")}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <p className="mt-3 text-xs text-stone-500 dark:text-stone-500">
          {bookingLive ? (
            <>
              {bookingTestMode
                ? tr("booking.request.hintPickDayTestMode", {
                    range: campaignRange,
                    windowDays: String(ROLLING_WINDOW_CALENDAR_DAYS),
                    lastDay: lastBookableKey ?? t("booking.request.dash"),
                  })
                : tr("booking.request.hintPickDayLive", {
                    windowDays: String(ROLLING_WINDOW_CALENDAR_DAYS),
                    lastDay: lastBookableKey ?? t("booking.request.dash"),
                  })}
            </>
          ) : (
            <>
              {tr("booking.request.hintPickDayPreview", {
                range: campaignRange,
                windowDays: String(ROLLING_WINDOW_CALENDAR_DAYS),
                lastDay: lastBookableKey ?? t("booking.request.dash"),
              })}
            </>
          )}
        </p>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-medium text-stone-800 dark:text-stone-200">
          {selectedDayKey
            ? bookingLive
              ? tr("booking.request.slotsTitleLive", { day: selectedDayKey })
              : tr("booking.request.slotsTitlePreview", { day: selectedDayKey })
            : t("booking.request.slotsTitleNone")}
        </h3>

        {loading && bookingLive ? (
          <p className="text-sm text-stone-500 dark:text-stone-500">{t("booking.request.loadingSlots")}</p>
        ) : !selectedDayKey ? (
          <p className="text-sm text-stone-500 dark:text-stone-500">
            {bookingLive ? t("booking.request.emptyHintLive") : t("booking.request.emptyHintPreview")}
          </p>
        ) : slotsForSelectedDay.length === 0 ? (
          <p className="text-sm text-stone-500 dark:text-stone-500">{t("booking.request.noSlotsDay")}</p>
        ) : (
          <>
            <ul className="grid gap-2 sm:grid-cols-2">
              {slotsForSelectedDay.map((s) => {
                const on = selected.has(s.id);
                const flash = blockFlashSlotId === s.id;
                if (!bookingLive) {
                  return (
                    <li key={s.id}>
                      <div className="w-full cursor-not-allowed rounded-lg border border-dashed border-stone-300 dark:border-stone-600 bg-stone-50 dark:bg-stone-900 px-3 py-3 text-left text-sm text-stone-600 dark:text-stone-400">
                        <span className="block font-medium text-stone-700 dark:text-stone-300">
                          {formatSlotDateForLocale(s.startsAt, locale)}
                        </span>
                        <span className="mt-0.5 block text-sm font-medium text-stone-800 dark:text-stone-200">
                          {formatSlotTimeRangeEn(s.startsAt, s.endsAt)}
                        </span>
                        <span className="mt-1 block text-xs text-stone-500 dark:text-stone-500">
                          {displayVenueLabel(s.venueLabel, locale)} · {t("booking.request.previewSlotSuffix")}
                        </span>
                      </div>
                    </li>
                  );
                }
                const full = s.remaining <= 0;
                if (full) {
                  return (
                    <li key={s.id}>
                      <div
                        className="w-full cursor-not-allowed rounded-lg border-2 border-red-600/90 bg-red-50 px-3 py-3 text-left text-sm dark:border-red-500/85 dark:bg-red-950/40"
                        aria-disabled
                      >
                        <span className="block font-medium text-stone-800 dark:text-stone-100">
                          {formatSlotDateForLocale(s.startsAt, locale)}
                        </span>
                        <span className="mt-0.5 block text-sm font-medium text-stone-900 dark:text-stone-50">
                          {formatSlotTimeRangeEn(s.startsAt, s.endsAt)}
                        </span>
                        <span className="mt-1 block text-xs text-stone-600 dark:text-stone-300">
                          {displayVenueLabel(s.venueLabel, locale)}
                        </span>
                        <span className="mt-2 block text-xs font-semibold text-red-800 dark:text-red-200">
                          {t("booking.timeline.statusFull")}
                        </span>
                      </div>
                    </li>
                  );
                }
                return (
                  <li key={s.id}>
                    <button
                      type="button"
                      onClick={() => tryToggleSlot(s.id)}
                      className={`w-full rounded-lg border px-3 py-3 text-left text-sm transition ${
                        flash ? "booking-slot-deny-flash" : ""
                      } ${
                        on
                          ? "border-stone-900 bg-stone-900 text-white"
                          : "border-stone-200 dark:border-stone-700 bg-surface hover:border-stone-400 dark:border-stone-500"
                      }`}
                    >
                      <span className="block font-medium">{formatSlotDateForLocale(s.startsAt, locale)}</span>
                      <span
                        className={`mt-0.5 block text-sm font-medium ${on ? "text-white" : "text-stone-800 dark:text-stone-200"}`}
                      >
                        {formatSlotTimeRangeEn(s.startsAt, s.endsAt)}
                      </span>
                      <span className={`mt-1 block text-xs ${on ? "text-stone-200" : "text-stone-500 dark:text-stone-500"}`}>
                        {displayVenueLabel(s.venueLabel, locale)}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
            {!bookingLive && selectedDayKey ? (
              <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-950">
                {tr("booking.request.notOpenYet", {
                  suffix: bookingOpensAtLabel
                    ? `：${bookingOpensAtLabel}`
                    : t("booking.request.notOpenFallback"),
                })}
              </p>
            ) : null}
          </>
        )}
      </div>

      <div className="rounded-xl border border-stone-200 dark:border-stone-700 bg-surface p-4 shadow-sm space-y-4">
        <h2 className="text-base font-medium text-stone-900 dark:text-stone-50">
          {t("booking.request.cameraSectionTitle")}
        </h2>
        <p className="text-sm leading-relaxed text-stone-700 dark:text-stone-300">
          {t("booking.request.cameraQuestion")}
        </p>
        <div className="overflow-hidden rounded-lg border border-stone-200 bg-white dark:border-stone-600 dark:bg-stone-950">
          {/* eslint-disable-next-line @next/next/no-img-element -- static marketing asset */}
          <img
            src={withBasePath(CAMERA_RENTAL_HERO_PATH)}
            alt={t("booking.request.cameraHeroAlt")}
            className="mx-auto block max-h-64 w-full object-contain"
          />
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-8">
          <label className="flex cursor-pointer items-center gap-2.5 text-sm text-stone-800 dark:text-stone-200">
            <input
              type="checkbox"
              checked={camPref === "no"}
              onChange={(e) => {
                if (e.target.checked) {
                  setCamPref("no");
                  setCamPay(null);
                  setCamModalOpen(false);
                } else {
                  setCamPref(null);
                }
              }}
              className="h-4 w-4 shrink-0 rounded border-stone-400"
            />
            <span>{t("booking.request.cameraNoNeed")}</span>
          </label>
          <label className="flex cursor-pointer items-center gap-2.5 text-sm text-stone-800 dark:text-stone-200">
            <input
              type="checkbox"
              checked={camPref === "yes"}
              onChange={(e) => {
                if (e.target.checked) {
                  setCamPref("yes");
                  setCamPay(null);
                  setCamModalPaidPick(null);
                  setCamModalOpen(true);
                } else {
                  setCamPref(null);
                  setCamPay(null);
                }
              }}
              className="h-4 w-4 shrink-0 rounded border-stone-400"
            />
            <span>{t("booking.request.cameraNeed")}</span>
          </label>
        </div>

        {camPref === "yes" && camPay === "paid_before" ? (
          <div className="pt-1">
            <button
              type="button"
              onClick={() =>
                window.open(CAMERA_USAGE_GUIDE_DRIVE_URL, "_blank", "noopener,noreferrer")
              }
              className="rounded-lg border border-emerald-800/40 bg-emerald-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-950"
            >
              {t("booking.request.cameraOpenGuideButton")}
            </button>
          </div>
        ) : null}

        {camPref === "yes" && camPay === "need_choice" ? (
          <div className="flex flex-wrap gap-2 pt-1">
            <button
              type="button"
              onClick={() => {
                setCamModalPaidPick(null);
                setCamModalOpen(true);
              }}
              className="rounded-lg border border-stone-300 bg-stone-100 px-4 py-2.5 text-sm font-medium text-stone-900 shadow-sm transition hover:bg-stone-200 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-100 dark:hover:bg-stone-700"
            >
              {t("booking.request.cameraPayFirstButton")}
            </button>
            <button
              type="button"
              onClick={() => setCamPay("pay_after")}
              className="rounded-lg border border-blue-900/30 bg-blue-950 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-blue-900"
            >
              {t("booking.request.cameraPayAfterButton")}
            </button>
          </div>
        ) : null}
      </div>

      {camModalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="presentation"
          onClick={cancelCamModal}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="camera-pay-modal-title"
            className="max-h-[min(90vh,640px)] w-full max-w-lg overflow-y-auto rounded-xl border border-stone-200 bg-white p-5 shadow-xl dark:border-stone-600 dark:bg-stone-900"
            onClick={(e) => e.stopPropagation()}
          >
            <h3
              id="camera-pay-modal-title"
              className="text-base font-semibold text-stone-900 dark:text-stone-50"
            >
              {t("booking.request.cameraPayModalTitle")}
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-stone-700 dark:text-stone-300">
              {t("booking.request.cameraPayInstruction")}
            </p>
            <a
              href={CAMERA_RENTAL_STRIPE_CHECKOUT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex text-sm font-medium text-blue-700 underline underline-offset-2 dark:text-blue-400"
            >
              {t("booking.request.cameraPayLinkLabel")}
            </a>
            <div className="mt-4 flex justify-center rounded-lg border border-stone-200 bg-white p-3 dark:border-stone-600">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={withBasePath(CAMERA_RENTAL_QR_PATH)}
                alt={t("booking.request.cameraQrAlt")}
                width={200}
                height={200}
                className="h-48 w-48 object-contain"
              />
            </div>
            <p className="mt-5 text-sm font-medium text-stone-900 dark:text-stone-100">
              {t("booking.request.cameraPaidPrompt")}
            </p>
            <div className="mt-2 space-y-2">
              <label className="flex cursor-pointer items-center gap-2.5 text-sm text-stone-800 dark:text-stone-200">
                <input
                  type="radio"
                  name="cameraPaidPick"
                  checked={camModalPaidPick === true}
                  onChange={() => setCamModalPaidPick(true)}
                  className="h-4 w-4 shrink-0"
                />
                <span>{t("booking.request.cameraPaidYes")}</span>
              </label>
              <label className="flex cursor-pointer items-center gap-2.5 text-sm text-stone-800 dark:text-stone-200">
                <input
                  type="radio"
                  name="cameraPaidPick"
                  checked={camModalPaidPick === false}
                  onChange={() => setCamModalPaidPick(false)}
                  className="h-4 w-4 shrink-0"
                />
                <span>{t("booking.request.cameraPaidNo")}</span>
              </label>
            </div>
            <div className="mt-6 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={cancelCamModal}
                className="rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium text-stone-800 dark:border-stone-600 dark:text-stone-200"
              >
                {t("booking.request.cameraModalCancel")}
              </button>
              <button
                type="button"
                disabled={camModalPaidPick === null}
                onClick={confirmCamModal}
                className="rounded-lg bg-stone-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-40 dark:bg-stone-100 dark:text-stone-900"
              >
                {t("booking.request.cameraModalConfirm")}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {bookingLive && dualEligible && (
        <div className="rounded-lg border border-stone-200 dark:border-stone-700 bg-surface px-5 sm:px-4 py-3 text-sm">
          <p className="font-medium text-stone-900 dark:text-stone-50">
            {t("booking.request.thisBookingIdentityTitle")}
          </p>
          <div className="mt-2 space-y-2">
            <label className="flex cursor-pointer items-center gap-2.5">
              <input
                type="radio"
                name="bookingIdentity"
                checked={bookingIdentityChoice === "individual"}
                onChange={() => setBookingIdentityChoice("individual")}
                className="shrink-0"
              />
              <BookingIconPerson className="h-4 w-4 shrink-0 text-sky-700 dark:text-sky-300" />
              <span>{t("booking.request.identityIndividual")}</span>
            </label>
            <label className="flex cursor-pointer items-center gap-2.5">
              <input
                type="radio"
                name="bookingIdentity"
                checked={bookingIdentityChoice === "teaching_or_with_students"}
                onChange={() => setBookingIdentityChoice("teaching_or_with_students")}
                className="shrink-0"
              />
              <BookingIconTeaching className="h-4 w-4 shrink-0 text-indigo-800 dark:text-indigo-300" />
              <span>{t("booking.request.identityTeaching")}</span>
            </label>
          </div>
        </div>
      )}

      <div className="space-y-2 border-t border-stone-200 dark:border-stone-700 pt-6">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={submitDisabled}
            onClick={() => void submit()}
            className="rounded-full bg-stone-900 px-6 py-2.5 text-sm text-white disabled:opacity-40"
          >
            {submitting
              ? t("booking.request.submitting")
              : tr("booking.request.submitWithCount", {
                  n: String(selected.size),
                  nH: sessionHoursParen(locale, selected.size),
                })}
          </button>
          <Link href={`${bookingPathPrefix}/history`} className="text-sm text-stone-700 dark:text-stone-300 underline">
            {t("booking.request.linkHistory")}
          </Link>
        </div>
        {!submitDisabledNoSelection && submitDisabled && (
          <p className="text-xs text-amber-800 dark:text-amber-200/90">
            {cameraSubmitBlocking
              ? t("booking.request.submitDisabledCamera")
              : submitDisabledCooldown
                ? t("booking.request.submitDisabledCooldown")
                : limits?.provisional.wouldExceedDaily
                  ? t("booking.request.submitDisabledDaily")
                  : limits?.provisional.wouldExceedRolling
                    ? t("booking.request.submitDisabledRolling")
                    : null}
          </p>
        )}
      </div>

      <RegistrationErrorModal
        open={dailyCapModalOpen}
        title={t("booking.request.dailyCapModalTitle")}
        message={
          limits?.quotaTier === "teaching" || limits?.tier === "teaching"
            ? t("booking.request.dailyCapModalBodyTeaching")
            : t("booking.request.dailyCapModalBodyIndividual")
        }
        okLabel={t("booking.request.dailyCapModalOk")}
        onDismiss={() => setDailyCapModalOpen(false)}
      />

      <p className="text-xs text-stone-500 dark:text-stone-500">{t("booking.request.footnote")}</p>

      <div className="mt-8 space-y-6">
        {studioAlternatePathCallout}
        <BookingRulesVisual
          t={t}
          tr={tr}
          windowDays={String(ROLLING_WINDOW_CALENDAR_DAYS)}
        />
      </div>
    </div>
  );
}
