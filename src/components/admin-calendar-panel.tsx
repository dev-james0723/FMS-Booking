"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { withBasePath } from "@/lib/base-path";
import { displayVenueLabel, formatSlotListLineZhDateEnRange } from "@/lib/booking-slot-display";

type SlotRow = {
  id: string;
  startsAt: string;
  endsAt: string;
  capacityTotal: number;
  used: number;
  remaining: number;
  venueLabel: string | null;
  isOpen: boolean;
  bookings: { requestId: string; requestStatus: string; userEmail: string }[];
};

function addDaysYmd(from: string, days: number): string {
  const [y, m, d] = from.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(dt.getUTCDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

export function AdminCalendarPanel() {
  const range = useMemo(() => {
    const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Hong_Kong" });
    return { from: today, to: addDaysYmd(today, 7) };
  }, []);

  const [from, setFrom] = useState(range.from);
  const [to, setTo] = useState(range.to);
  const [slots, setSlots] = useState<SlotRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    const q = new URLSearchParams({ from, to });
    const res = await fetch(withBasePath(`/api/v1/admin/calendar?${q}`));
    const data = await res.json();
    if (!res.ok) {
      setError(data?.error?.message ?? "載入失敗");
      setSlots([]);
      return;
    }
    setSlots(data.slots ?? []);
  }, [from, to]);

  useEffect(() => {
    const id = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(id);
  }, [load]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-4 text-sm">
        <label className="text-slate-400">
          由（yyyy-MM-dd）
          <input
            className="ml-2 rounded border border-slate-600 bg-slate-950 px-2 py-1 text-white"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </label>
        <label className="text-slate-400">
          至
          <input
            className="ml-2 rounded border border-slate-600 bg-slate-950 px-2 py-1 text-white"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </label>
        <button
          type="button"
          onClick={() => void load()}
          className="rounded bg-slate-700 px-3 py-1 text-white hover:bg-slate-600"
        >
          載入
        </button>
        <div className="flex w-full basis-full gap-4 text-xs text-slate-500">
          <Link href="/admin/users" className="underline hover:text-slate-300">
            登記用戶（對照身份與預約列表）
          </Link>
          <Link href="/admin/bookings" className="underline hover:text-slate-300">
            預約
          </Link>
        </div>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="space-y-2">
        {slots.map((s) => (
          <div
            key={s.id}
            className="rounded-lg border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm"
          >
            <div className="flex flex-wrap justify-between gap-2 text-slate-200">
              <span>{formatSlotListLineZhDateEnRange(s.startsAt, s.endsAt)}</span>
              <span className="text-slate-400">
                名額 {s.used}/{s.capacityTotal} · 剩 {s.remaining}
                {!s.isOpen ? " · 已關閉" : ""}
              </span>
            </div>
            {s.venueLabel != null && s.venueLabel !== "" && (
              <div className="text-xs text-slate-500">{displayVenueLabel(s.venueLabel)}</div>
            )}
            {s.bookings.length > 0 && (
              <ul className="mt-2 space-y-1 border-t border-slate-800 pt-2 text-xs text-slate-400">
                {s.bookings.map((b) => (
                  <li key={b.requestId + b.userEmail}>
                    {b.userEmail} · {b.requestStatus}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>

      {slots.length === 0 && !error && (
        <p className="text-sm text-slate-500">此範圍沒有時段資料。</p>
      )}
    </div>
  );
}
