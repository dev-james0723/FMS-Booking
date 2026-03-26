"use client";

import { useEffect, useState } from "react";
import { withBasePath } from "@/lib/base-path";

type BookingRow = {
  id: string;
  status: string;
  requestedAt: string;
  usesBonusSlot: boolean;
  slots: { startsAt: string; venueLabel: string | null }[];
};

export function BookingHistoryPanel() {
  const [rows, setRows] = useState<BookingRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const res = await fetch(withBasePath("/api/v1/booking/history"));
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error?.message ?? "無法載入");
        return;
      }
      setRows(data.bookings ?? []);
    })();
  }, []);

  if (error) {
    return <p className="text-sm text-red-700">{error}</p>;
  }

  if (rows.length === 0) {
    return <p className="text-sm text-stone-500">暫未有預約申請紀錄。</p>;
  }

  return (
    <ul className="space-y-4">
      {rows.map((r) => (
        <li
          key={r.id}
          className="rounded-xl border border-stone-200 bg-white p-4 text-sm shadow-sm"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-mono text-xs text-stone-500">{r.id.slice(0, 8)}…</span>
            <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs">{r.status}</span>
          </div>
          <p className="mt-2 text-xs text-stone-500">
            提交時間：{new Date(r.requestedAt).toLocaleString("zh-HK", { timeZone: "Asia/Hong_Kong" })}
            {r.usesBonusSlot ? " · 使用 bonus 時段" : ""}
          </p>
          <ul className="mt-3 space-y-1 text-stone-800">
            {r.slots.map((s, i) => (
              <li key={i}>
                {new Date(s.startsAt).toLocaleString("zh-HK", {
                  timeZone: "Asia/Hong_Kong",
                  weekday: "short",
                  month: "numeric",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}{" "}
                {s.venueLabel ? `· ${s.venueLabel}` : ""}
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ul>
  );
}
