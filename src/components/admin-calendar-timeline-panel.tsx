"use client";

import { useCallback, useEffect, useState } from "react";
import {
  DaySlotsTimeline,
  summarizeDaySlotsText,
  type TimelineSlotInput,
} from "@/components/day-slots-timeline";
import { formatHkRange } from "@/lib/booking/day-timeline";
import { withBasePath } from "@/lib/base-path";

type BookingRow = {
  allocationId: string;
  requestId: string;
  requestStatus: string;
  userId: string;
  email: string;
  nameZh: string;
  phone: string;
  whatsappUrl: string | null;
  userCategoryLabel: string;
  instagramFollow: { label: string; detail: string };
  genderNote: string;
  identityLabelsZh: string[];
};

type SlotRow = {
  id: string;
  startsAt: string;
  endsAt: string;
  capacityTotal: number;
  isOpen: boolean;
  venueLabel: string | null;
  used: number;
  remaining: number;
  bookings: BookingRow[];
};

function hkTodayYmd(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Hong_Kong" });
}

export function AdminCalendarTimelinePanel() {
  const [date, setDate] = useState(hkTodayYmd);
  const [slots, setSlots] = useState<SlotRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    const q = new URLSearchParams({ date });
    const res = await fetch(withBasePath(`/api/v1/admin/calendar/day?${q}`));
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data?.error?.message ?? "載入失敗");
      setSlots([]);
      return;
    }
    setSlots(data.slots ?? []);
  }, [date]);

  useEffect(() => {
    const id = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(id);
  }, [load]);

  const timelineSlots: TimelineSlotInput[] = slots.map((s) => ({
    id: s.id,
    startsAt: s.startsAt,
    endsAt: s.endsAt,
    remaining: s.remaining,
    capacityTotal: s.capacityTotal,
    isOpen: s.isOpen,
    venueLabel: s.venueLabel,
  }));

  const summaryText = summarizeDaySlotsText(date, timelineSlots);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-4 text-sm">
        <label className="text-slate-400">
          選擇日期（yyyy-MM-dd，香港）
          <input
            className="ml-2 rounded border border-slate-600 bg-slate-950 px-2 py-1 text-white"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </label>
        <button
          type="button"
          onClick={() => void load()}
          className="rounded bg-slate-700 px-3 py-1 text-white hover:bg-slate-600"
        >
          載入
        </button>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="rounded-lg border border-slate-700 bg-slate-950/60 p-4">
        <p className="text-xs text-slate-500">時間軸 · 06:00 – 20:00（香港時間）</p>
        <div className="mt-4">
          <DaySlotsTimeline dateKey={date} slots={timelineSlots} variant="admin" />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-slate-700 bg-slate-950/80 p-4 text-sm text-slate-200">
          <h3 className="font-medium text-white">當日摘要（文字）</h3>
          <div className="mt-3 space-y-3 text-xs">
            {summaryText.bookedLines.length > 0 && (
              <div>
                <p className="font-semibold text-red-300">已滿／已被預約</p>
                <ul className="mt-1 list-inside list-disc text-slate-300">
                  {summaryText.bookedLines.map((l) => (
                    <li key={l}>{l}</li>
                  ))}
                </ul>
              </div>
            )}
            {summaryText.availableLines.length > 0 && (
              <div>
                <p className="font-semibold text-emerald-300">仍有名額</p>
                <ul className="mt-1 list-inside list-disc text-slate-300">
                  {summaryText.availableLines.map((l) => (
                    <li key={l}>{l}</li>
                  ))}
                </ul>
              </div>
            )}
            {summaryText.closedLines.length > 0 && (
              <div>
                <p className="font-semibold text-slate-400">已關閉</p>
                <ul className="mt-1 list-inside list-disc text-slate-400">
                  {summaryText.closedLines.map((l) => (
                    <li key={l}>{l}</li>
                  ))}
                </ul>
              </div>
            )}
            {summaryText.bookedLines.length === 0 &&
              summaryText.availableLines.length === 0 &&
              summaryText.closedLines.length === 0 && (
                <p className="text-slate-500">此日沒有時段。</p>
              )}
          </div>
        </div>

        <div className="rounded-lg border border-slate-700 bg-slate-950/80 p-4 text-sm text-slate-200">
          <h3 className="font-medium text-white">預約者詳情（按時段）</h3>
          <p className="mt-1 text-xs text-slate-500">
            點擊電話號碼可透過 WhatsApp 聯絡（如號碼格式無法辨識則只顯示文字）。
          </p>
          <ul className="mt-4 space-y-4">
            {slots.map((s) => (
              <li key={s.id} className="border-t border-slate-800 pt-3 first:border-t-0 first:pt-0">
                <p className="text-slate-100">
                  {formatHkRange(new Date(s.startsAt), new Date(s.endsAt))}
                  {!s.isOpen && (
                    <span className="ml-2 text-slate-500">· 時段已關閉</span>
                  )}
                </p>
                {s.venueLabel && (
                  <p className="text-xs text-slate-500">{s.venueLabel}</p>
                )}
                {s.bookings.length === 0 ? (
                  <p className="mt-1 text-xs text-slate-500">此格尚無有效預約。</p>
                ) : (
                  <ul className="mt-2 space-y-2 text-xs">
                    {s.bookings.map((b) => (
                      <li
                        key={b.allocationId}
                        className="rounded-md bg-slate-900/80 px-2 py-2 text-slate-300"
                      >
                        <div>
                          <span className="text-slate-400">姓名：</span>
                          {b.nameZh}
                        </div>
                        <div>
                          <span className="text-slate-400">電話：</span>
                          {b.whatsappUrl ? (
                            <a
                              href={b.whatsappUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-medium text-sky-400 underline hover:text-sky-300"
                            >
                              {b.phone}
                            </a>
                          ) : (
                            <span>{b.phone}</span>
                          )}
                        </div>
                        <div>
                          <span className="text-slate-400">Email：</span>
                          {b.email}
                        </div>
                        <div>
                          <span className="text-slate-400">類別：</span>
                          {b.userCategoryLabel}
                        </div>
                        <div>
                          <span className="text-slate-400">IG 追蹤：</span>
                          {b.instagramFollow.detail}（{b.instagramFollow.label}）
                        </div>
                        <div>
                          <span className="text-slate-400">性別：</span>
                          {b.genderNote}
                        </div>
                        {b.identityLabelsZh.length > 0 && (
                          <div>
                            <span className="text-slate-400">身份標籤：</span>
                            {b.identityLabelsZh.join("、")}
                          </div>
                        )}
                        <div>
                          <span className="text-slate-400">預約狀態：</span>
                          {b.requestStatus}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
