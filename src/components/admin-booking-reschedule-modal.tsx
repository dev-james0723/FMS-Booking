"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { withBasePath } from "@/lib/base-path";
import { displayVenueLabel, formatSlotListLineZhDateEnRange } from "@/lib/booking-slot-display";
import { buildMonthGrid, daysInCalendarMonth, slotStartsAtToHkDateKey } from "@/lib/hk-calendar-client";
import { HK_TZ } from "@/lib/time";

type VenueTab = "studio_room" | "open_space";

type CurrentSlot = {
  id: string;
  startsAt: string;
  endsAt: string;
  venueLabel: string | null;
};

type AvailSlot = {
  id: string;
  startsAt: string;
  endsAt: string;
  remaining: number;
  isOpen: boolean;
  venueLabel: string | null;
};

function hkTodayKey(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: HK_TZ });
}

function monthRangeKeys(year: number, month1: number): { from: string; to: string } {
  const padM = String(month1).padStart(2, "0");
  const last = daysInCalendarMonth(year, month1);
  return {
    from: `${year}-${padM}-01`,
    to: `${year}-${padM}-${String(last).padStart(2, "0")}`,
  };
}

function initialMonthFromSlots(slots: CurrentSlot[]): { year: number; month1: number } {
  if (slots.length === 0) {
    const t = hkTodayKey();
    const [y, m] = t.split("-").map(Number);
    return { year: y, month1: m };
  }
  const key = slotStartsAtToHkDateKey(slots[0].startsAt);
  const [y, m] = key.split("-").map(Number);
  return { year: y, month1: m };
}

export function AdminBookingRescheduleModal(props: {
  open: boolean;
  onClose: () => void;
  bookingId: string;
  venue: VenueTab;
  currentSlots: CurrentSlot[];
  onApplied: () => void;
}) {
  const { open, onClose, bookingId, venue, currentSlots, onApplied } = props;

  const [{ year, month1 }, setYm] = useState(() => initialMonthFromSlots(currentSlots));
  const [selectedDayKey, setSelectedDayKey] = useState<string | null>(null);
  const [removeIds, setRemoveIds] = useState<Set<string>>(() => new Set());
  const [addIds, setAddIds] = useState<Set<string>>(() => new Set());
  const [avail, setAvail] = useState<AvailSlot[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setYm(initialMonthFromSlots(currentSlots));
    setSelectedDayKey(null);
    setRemoveIds(new Set());
    setAddIds(new Set());
  }, [open, bookingId, currentSlots]);

  const loadAvail = useCallback(async () => {
    if (!open) return;
    setLoadError(null);
    const { from, to } = monthRangeKeys(year, month1);
    const params = new URLSearchParams();
    params.set("venue", venue);
    params.set("from", from);
    params.set("to", to);
    params.set("excludeRequestId", bookingId);
    const res = await fetch(withBasePath(`/api/v1/admin/bookings/availability?${params}`));
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setLoadError(data?.error?.message ?? "載入時段失敗");
      setAvail([]);
      return;
    }
    setAvail(data.slots ?? []);
  }, [open, year, month1, venue, bookingId]);

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => void loadAvail(), 0);
    return () => window.clearTimeout(t);
  }, [open, loadAvail]);

  const currentIdSet = useMemo(() => new Set(currentSlots.map((s) => s.id)), [currentSlots]);

  const keptIds = useMemo(() => {
    const k = new Set<string>();
    for (const id of currentIdSet) {
      if (!removeIds.has(id)) k.add(id);
    }
    return k;
  }, [currentIdSet, removeIds]);

  const finalCount = useMemo(() => {
    let n = 0;
    for (const id of keptIds) n++;
    for (const id of addIds) {
      if (!keptIds.has(id)) n++;
    }
    return n;
  }, [keptIds, addIds]);

  const daySlots = useMemo(() => {
    if (!selectedDayKey) return [];
    return avail.filter((s) => slotStartsAtToHkDateKey(s.startsAt) === selectedDayKey);
  }, [avail, selectedDayKey]);

  const weekdays = ["日", "一", "二", "三", "四", "五", "六"];

  async function submit() {
    if (finalCount < 1) {
      alert("更改後須至少保留一個時段。");
      return;
    }
    if (removeIds.size === 0 && addIds.size === 0) {
      alert("請選擇要釋放的時段和／或要新增的替換時段。");
      return;
    }
    setBusy(true);
    const res = await fetch(
      withBasePath(`/api/v1/admin/bookings/${bookingId}/reschedule`),
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          removeSlotIds: [...removeIds],
          addSlotIds: [...addIds],
        }),
      }
    );
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      alert(data?.error?.message ?? "更改失敗");
      return;
    }
    onApplied();
    onClose();
  }

  if (!open) return null;

  const title = `${year} 年 ${month1} 月`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div
        className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl border border-slate-600 bg-slate-950 p-4 shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-reschedule-title"
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-700 pb-3">
          <div>
            <h2 id="admin-reschedule-title" className="text-lg font-semibold text-white">
              更改時段
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              先勾選要釋放的原有時段，再於月曆選日並點選可加入的新時段（已滿或他人已佔用的節數不會出現為可選）。
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded px-2 py-1 text-sm text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            關閉
          </button>
        </div>

        <div className="mt-4 space-y-4">
          <section>
            <p className="mb-2 text-sm font-medium text-slate-200">原有時段（勾選＝釋放該節）</p>
            <ul className="space-y-2 rounded-lg border border-slate-700 bg-slate-900/60 p-3">
              {currentSlots.map((s) => (
                <li key={s.id} className="flex flex-wrap items-center gap-2 text-xs text-slate-300">
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      checked={removeIds.has(s.id)}
                      onChange={(e) => {
                        const next = new Set(removeIds);
                        if (e.target.checked) next.add(s.id);
                        else next.delete(s.id);
                        setRemoveIds(next);
                      }}
                      className="rounded border-slate-500"
                    />
                    <span>
                      {formatSlotListLineZhDateEnRange(s.startsAt, s.endsAt)}
                      {s.venueLabel != null && s.venueLabel !== ""
                        ? ` · ${displayVenueLabel(s.venueLabel)}`
                        : ""}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          </section>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="rounded border border-slate-600 px-2 py-1 text-xs text-slate-300 hover:bg-slate-800"
                onClick={() =>
                  setYm((prev) => {
                    if (prev.month1 <= 1) return { year: prev.year - 1, month1: 12 };
                    return { year: prev.year, month1: prev.month1 - 1 };
                  })
                }
              >
                ← 上月
              </button>
              <span className="text-sm text-slate-200">{title}</span>
              <button
                type="button"
                className="rounded border border-slate-600 px-2 py-1 text-xs text-slate-300 hover:bg-slate-800"
                onClick={() =>
                  setYm((prev) => {
                    if (prev.month1 >= 12) return { year: prev.year + 1, month1: 1 };
                    return { year: prev.year, month1: prev.month1 + 1 };
                  })
                }
              >
                下月 →
              </button>
            </div>
            {loadError && <p className="text-xs text-red-400">{loadError}</p>}
          </div>

          <div className="rounded-lg border border-slate-700 p-3">
            <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-slate-500">
              {weekdays.map((w) => (
                <div key={w} className="py-1 font-medium">
                  {w}
                </div>
              ))}
              {buildMonthGrid(year, month1).map((cell, idx) => {
                if (!cell.dateKey) {
                  return <div key={`pad-${idx}`} />;
                }
                const key = cell.dateKey;
                const dayList = avail.filter((s) => slotStartsAtToHkDateKey(s.startsAt) === key);
                const pickable = dayList.filter(
                  (s) => !keptIds.has(s.id) && s.isOpen && s.remaining > 0
                ).length;
                const selected = selectedDayKey === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelectedDayKey(key)}
                    className={`rounded py-1.5 text-xs ${
                      selected
                        ? "bg-sky-700 text-white"
                        : "bg-slate-800/80 text-slate-300 hover:bg-slate-800"
                    }`}
                  >
                    <div>{Number(key.slice(8, 10))}</div>
                    {dayList.length > 0 && (
                      <div className="text-[9px] text-slate-400">
                        {pickable > 0 ? `${pickable} 可選` : "—"}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <section>
            <p className="mb-2 text-sm font-medium text-slate-200">
              {selectedDayKey ? `${selectedDayKey} 可加入的時段` : "請在月曆上選擇一天"}
            </p>
            {!selectedDayKey ? (
              <p className="text-xs text-slate-500">選日後會列出該日可選的新時段。</p>
            ) : daySlots.length === 0 ? (
              <p className="text-xs text-slate-500">此日沒有時段資料。</p>
            ) : (
              <ul className="space-y-2 rounded-lg border border-slate-700 bg-slate-900/60 p-3">
                {daySlots.map((s) => {
                  const isKept = keptIds.has(s.id);
                  const canPick = !isKept && s.isOpen && s.remaining > 0;
                  const chosen = addIds.has(s.id);
                  const line = formatSlotListLineZhDateEnRange(s.startsAt, s.endsAt);
                  const v =
                    s.venueLabel != null && s.venueLabel !== ""
                      ? ` · ${displayVenueLabel(s.venueLabel)}`
                      : "";

                  if (isKept) {
                    return (
                      <li key={s.id} className="text-xs text-slate-500">
                        {line}
                        {v}
                        <span className="ml-2 rounded bg-slate-800 px-1.5 py-0.5">已保留</span>
                      </li>
                    );
                  }

                  if (!s.isOpen) {
                    return (
                      <li key={s.id} className="text-xs text-slate-500">
                        {line}
                        {v}
                        <span className="ml-2 text-amber-600/90">已關閉</span>
                      </li>
                    );
                  }

                  if (!canPick) {
                    return (
                      <li key={s.id} className="text-xs text-slate-500">
                        {line}
                        {v}
                        <span className="ml-2 text-red-400/90">已滿</span>
                      </li>
                    );
                  }

                  return (
                    <li key={s.id}>
                      <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-200">
                        <input
                          type="checkbox"
                          checked={chosen}
                          onChange={(e) => {
                            const next = new Set(addIds);
                            if (e.target.checked) next.add(s.id);
                            else next.delete(s.id);
                            setAddIds(next);
                          }}
                          className="rounded border-slate-500"
                        />
                        {line}
                        {v}
                      </label>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <p className="text-xs text-slate-400">
            將釋放 {removeIds.size} 節 · 將新增 {addIds.size} 節 · 更改後共{" "}
            <strong className="text-slate-200">{finalCount}</strong> 節
          </p>

          <div className="flex flex-wrap justify-end gap-2 border-t border-slate-700 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded border border-slate-600 px-3 py-1.5 text-sm text-slate-300 hover:bg-slate-800"
            >
              取消
            </button>
            <button
              type="button"
              disabled={busy || finalCount < 1}
              onClick={() => void submit()}
              className="rounded bg-sky-700 px-3 py-1.5 text-sm text-white hover:bg-sky-600 disabled:opacity-40"
            >
              {busy ? "處理中…" : "確認更改"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
