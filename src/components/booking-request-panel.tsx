"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { withBasePath } from "@/lib/base-path";
import {
  displayVenueLabel,
  formatSlotDateZhHk,
  formatSlotTimeRangeEn,
} from "@/lib/booking-slot-display";
import {
  addDaysToDateKey,
  buildMonthGrid,
  daysInCalendarMonth,
  isHkDayBookable,
  parseCampaignDateKeysFromSettings,
  slotStartsAtToHkDateKey,
} from "@/lib/hk-calendar-client";
import { CAMPAIGN_EXPERIENCE_RANGE_LABEL_ZH } from "@/lib/booking/campaign-constants";
import { buildPreviewSlotsForHkDay } from "@/lib/booking/preview-slots";
import { formatInstantForBookingOpensZhHk, HK_TZ } from "@/lib/time";

type SlotRow = {
  id: string;
  startsAt: string;
  endsAt: string;
  remaining: number;
  venueLabel: string | null;
};

type LimitsPayload = {
  tier: string;
  limits: { dailyMax: number; rollingMax: number };
  todayKey: string;
  countsByDay: Record<string, number>;
  todayCommitted: number;
  todayRemaining: number;
  provisional: {
    wouldExceedDaily: boolean;
    wouldExceedRolling: boolean;
    firstViolatingDate: string | null;
    rollingSum: number;
  };
};

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

export function BookingRequestPanel() {
  const [settings, setSettings] = useState<Record<string, unknown> | null>(null);
  const [monthSlots, setMonthSlots] = useState<SlotRow[]>([]);
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

  const [nowMs, setNowMs] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNowMs(Date.now()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  const todayKey = hkTodayKeyFromMs(nowMs);

  const campaign = useMemo(
    () => parseCampaignDateKeysFromSettings(settings),
    [settings]
  );

  const maxAdvanceDays = useMemo(() => {
    const v = settings?.max_advance_booking_days;
    return typeof v === "number" && Number.isFinite(v) ? v : 3;
  }, [settings]);

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
  }, []);

  const loadMonthSlots = useCallback(async () => {
    setLoading(true);
    setError(null);
    const q = new URLSearchParams({ from: monthRange.from, to: monthRange.to });
    const res = await fetch(withBasePath(`/api/v1/booking/availability?${q}`));
    const data = await res.json();
    if (!res.ok) {
      setError(data?.error?.message ?? "無法載入時段");
      setMonthSlots([]);
      setLoading(false);
      return;
    }
    setMonthSlots(data.slots.filter((s: SlotRow) => s.remaining > 0));
    setLoading(false);
  }, [monthRange.from, monthRange.to]);

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

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

  const dailyMax = limits?.limits.dailyMax ?? 3;
  const countsByDay = limits?.countsByDay ?? {};

  const bookingOpensAt =
    typeof settings?.booking_opens_at === "string" ? settings.booking_opens_at : null;
  const bookingLive = bookingOpensAt ? nowMs >= new Date(bookingOpensAt).getTime() : false;
  const bookingOpensAtLabelZh =
    bookingOpensAt != null
      ? formatInstantForBookingOpensZhHk(new Date(bookingOpensAt))
      : null;

  const slotsForSelectedDay = useMemo(() => {
    if (!selectedDayKey) return [];
    if (!bookingLive) {
      return buildPreviewSlotsForHkDay(selectedDayKey);
    }
    return monthSlots.filter((s) => slotStartsAtToHkDateKey(s.startsAt) === selectedDayKey);
  }, [monthSlots, selectedDayKey, bookingLive]);

  const availableCountByDay = useMemo(() => {
    const m = new Map<string, number>();
    for (const s of monthSlots) {
      const k = slotStartsAtToHkDateKey(s.startsAt);
      m.set(k, (m.get(k) ?? 0) + 1);
    }
    return m;
  }, [monthSlots]);

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
      const s = monthSlots.find((x) => x.id === id);
      if (s && slotStartsAtToHkDateKey(s.startsAt) === dayKey) n++;
    }
    return n;
  }

  function tryToggleSlot(id: string) {
    if (!bookingLive) return;
    const slot = monthSlots.find((s) => s.id === id);
    if (!slot) return;

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
        `此日（${dayKey}）已達您身分類別之每日上限：最多 ${dailyMax} 格（每格 30 分鐘），無法再多選一格。`
      );
      window.setTimeout(() => setDailyCapHint(null), 4500);
      return;
    }

    setSelected((prev) => new Set(prev).add(id));
  }

  async function submit() {
    setSubmitting(true);
    setError(null);
    setDone(null);
    const res = await fetch(withBasePath("/api/v1/booking/request"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slotIds: [...selected] }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data?.error?.message ?? "提交失敗");
      setSubmitting(false);
      return;
    }
    setDone(data.bookingRequestId ?? "OK");
    setSelected(new Set());
    await loadMonthSlots();
    setSubmitting(false);
  }

  const lastBookableKey =
    campaign.start && campaign.end
      ? (() => {
          const raw = addDaysToDateKey(todayKey, maxAdvanceDays);
          return raw < campaign.end ? raw : campaign.end;
        })()
      : null;

  const weekdays = ["日", "一", "二", "三", "四", "五", "六"];

  return (
    <div className="space-y-6">
      {!bookingLive && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          預約尚未正式開放。請先於月曆點選活動期內日子，預覽 30 分鐘一格的時段版面；時段在開放前會鎖定，無法選取或提交。
          {bookingOpensAtLabelZh ? (
            <span className="mt-2 block text-xs text-amber-900/85">
              正式開始預約時間（香港）：{bookingOpensAtLabelZh}
            </span>
          ) : null}
        </p>
      )}

      <div className="space-y-3">
        <p className="text-sm text-stone-600 dark:text-stone-400">
          活動日（香港）：{CAMPAIGN_EXPERIENCE_RANGE_LABEL_ZH} · 最多提前 {maxAdvanceDays} 個曆日預約 · 每隔 30
          分鐘
        </p>
        <button
          type="button"
          onClick={() => void loadMonthSlots()}
          className="flex w-full min-h-12 items-center justify-center rounded-lg border border-blue-950/40 bg-blue-950 px-4 py-3 text-center text-sm font-medium text-white shadow-sm transition hover:bg-blue-900 active:bg-blue-950 sm:min-h-[3rem] sm:text-base focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-800"
        >
          重新整理
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-900">
          {error}
        </div>
      )}
      {done && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-900">
          預約已提交（參考編號：{done}）。主辦方審核後將以電郵通知。
          <Link href="/booking/history" className="ml-2 underline">
            查看紀錄
          </Link>
        </div>
      )}

      {dailyCapHint && (
        <p
          className="rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-900 motion-safe:animate-pulse"
          role="status"
        >
          {dailyCapHint}
        </p>
      )}

      <div className="space-y-3">
        <Link
          href="/booking/calendar"
          className="flex w-full min-h-12 items-center justify-center rounded-lg border border-emerald-950/30 bg-emerald-900 px-4 py-3 text-center text-sm font-medium text-white shadow-sm transition hover:bg-emerald-950 active:bg-emerald-950 sm:min-h-[3rem] sm:text-base focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800"
        >
          月曆總覽（時間軸）
        </Link>

        {limits && (
          <div className="rounded-lg border border-stone-200 dark:border-stone-700 bg-surface px-4 py-3 text-sm text-stone-700 dark:text-stone-300 shadow-sm">
            <p className="font-medium text-stone-900 dark:text-stone-50">節數追蹤（香港日期）</p>
            <p className="mt-1 text-xs text-stone-600 dark:text-stone-400">
              今日（{limits.todayKey}）已用 {limits.todayCommitted} 節，尚可 {limits.todayRemaining} 節（每日上限{" "}
              {limits.limits.dailyMax}）。身份層級：{limits.tier === "extended" ? "教學／延伸" : "一般"}。
            </p>
            <p className="mt-1 text-xs text-stone-500 dark:text-stone-500">
              您帳戶目前的每日選取上限為 {limits.limits.dailyMax}{" "}
              格（每格 30 分鐘）。若於同一日已選滿上限後再選，將顯示紅色提示並無法加入。
            </p>
            {selected.size > 0 &&
              (limits.provisional.wouldExceedDaily || limits.provisional.wouldExceedRolling) && (
                <p className="mt-2 text-sm font-medium text-red-800">
                  目前所選時段會超出上限：
                  {limits.provisional.wouldExceedDaily && (
                    <span className="block">
                      同一日超過 {limits.limits.dailyMax} 節
                      {limits.provisional.firstViolatingDate
                        ? `（${limits.provisional.firstViolatingDate}）`
                        : ""}
                      。
                    </span>
                  )}
                  {limits.provisional.wouldExceedRolling && (
                    <span className="block">
                      連續 3 個曆日內合計 {limits.provisional.rollingSum} 節，超過上限 {limits.limits.rollingMax}{" "}
                      節。
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
            {viewYear} 年 {viewMonth} 月（香港）
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
              上一個月
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
              下一個月
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
            const bookable = inCampaignRange
              ? bookingLive
                ? isHkDayBookable({
                    dateKey: dk,
                    todayKey,
                    campaignStart: campaign.start!,
                    campaignEnd: campaign.end!,
                    maxAdvanceDays,
                  })
                : true
              : false;
            const avail = availableCountByDay.get(dk) ?? 0;
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
                {bookingLive && bookable && avail > 0 && (
                  <span
                    className={`mt-0.5 h-1.5 w-1.5 rounded-full ${
                      isSelected ? "bg-emerald-300" : "bg-emerald-500"
                    }`}
                    title={`尚有 ${avail} 格可預約`}
                  />
                )}
                {bookingLive && bookable && avail === 0 && (
                  <span className="mt-0.5 text-[9px] text-stone-400 dark:text-stone-500">滿</span>
                )}
              </button>
            );
          })}
        </div>

        <p className="mt-3 text-xs text-stone-500 dark:text-stone-500">
          {bookingLive ? (
            <>
              請先選擇一日；綠點代表該日仍有可預約時段。可預約範圍：由今日起計最多 {maxAdvanceDays}{" "}
              個曆日內，且不晚於 {lastBookableKey ?? "—"}。
            </>
          ) : (
            <>
              開放預約前，可點選活動期（{CAMPAIGN_EXPERIENCE_RANGE_LABEL_ZH}）內任何一日，預覽該日時段（版面與正式開放後相同節奏，但不可選取）。正式開放後，僅可選擇由今日起計最多{" "}
              {maxAdvanceDays} 個曆日內、且不晚於 {lastBookableKey ?? "—"} 的日子。
            </>
          )}
        </p>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-medium text-stone-800 dark:text-stone-200">
          {selectedDayKey
            ? bookingLive
              ? `${selectedDayKey} 可選時段`
              : `${selectedDayKey} 時段預覽（尚未開放選取）`
            : "請在上面的月曆上選擇一日"}
        </h3>

        {loading && bookingLive ? (
          <p className="text-sm text-stone-500 dark:text-stone-500">載入時段中…</p>
        ) : !selectedDayKey ? (
          <p className="text-sm text-stone-500 dark:text-stone-500">
            {bookingLive
              ? "選擇日期後，此處將列出該日所有仍可預約的時段。"
              : "選擇活動日後，將列出該日 06:00–20:00（首日為 11:00–20:00）的 30 分鐘時段預覽，僅供體驗操作。"}
          </p>
        ) : slotsForSelectedDay.length === 0 ? (
          <p className="text-sm text-stone-500 dark:text-stone-500">此日暫無可預約時段（或已全部滿額）。</p>
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
                          {formatSlotDateZhHk(s.startsAt)}
                        </span>
                        <span className="mt-0.5 block text-sm font-medium text-stone-800 dark:text-stone-200">
                          {formatSlotTimeRangeEn(s.startsAt, s.endsAt)}
                        </span>
                        <span className="mt-1 block text-xs text-stone-500 dark:text-stone-500">
                          {displayVenueLabel(s.venueLabel)} · 預覽（未開放）
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
                      <span className="block font-medium">{formatSlotDateZhHk(s.startsAt)}</span>
                      <span
                        className={`mt-0.5 block text-sm font-medium ${on ? "text-white" : "text-stone-800 dark:text-stone-200"}`}
                      >
                        {formatSlotTimeRangeEn(s.startsAt, s.endsAt)}
                      </span>
                      <span className={`mt-1 block text-xs ${on ? "text-stone-200" : "text-stone-500 dark:text-stone-500"}`}>
                        {displayVenueLabel(s.venueLabel)} · 剩 {s.remaining}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
            {!bookingLive && selectedDayKey ? (
              <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-950">
                而家尚未開始預約，請留意正式開放時間
                {bookingOpensAtLabelZh ? `：${bookingOpensAtLabelZh}` : "（請以主辦公布為準）"}。
              </p>
            ) : null}
          </>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3 border-t border-stone-200 dark:border-stone-700 pt-6">
        <button
          type="button"
          disabled={
            selected.size === 0 ||
            submitting ||
            !bookingLive ||
            (limits != null &&
              selected.size > 0 &&
              (limits.provisional.wouldExceedDaily || limits.provisional.wouldExceedRolling))
          }
          onClick={() => void submit()}
          className="rounded-full bg-stone-900 px-6 py-2.5 text-sm text-white disabled:opacity-40"
        >
          {submitting ? "提交中…" : `提交預約（已選 ${selected.size} 節）`}
        </button>
        <Link href="/booking/history" className="text-sm text-stone-700 dark:text-stone-300 underline">
          預約紀錄
        </Link>
      </div>

      <p className="text-xs text-stone-500 dark:text-stone-500">
        一般使用者：每日最多 3 格（1.5 小時）；教學／合資格延伸：每日最多 8 格（4
        小時）。任何連續 3 個曆日亦有總節數上限（見上方「節數追蹤」）。實際批核視乎供應及主辦安排。
      </p>
    </div>
  );
}
