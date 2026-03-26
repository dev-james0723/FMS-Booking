"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { withBasePath } from "@/lib/base-path";

type SlotRow = {
  id: string;
  startsAt: string;
  endsAt: string;
  remaining: number;
  venueLabel: string | null;
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

export function BookingRequestPanel() {
  const [settings, setSettings] = useState<Record<string, unknown> | null>(null);
  const [slots, setSlots] = useState<SlotRow[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  const range = useMemo(() => {
    const today = new Date();
    const y = today.toLocaleDateString("en-CA", { timeZone: "Asia/Hong_Kong" });
    return { from: y, to: addDaysYmd(y, 7) };
  }, []);

  const loadSettings = useCallback(async () => {
    const res = await fetch(withBasePath("/api/v1/public/settings"));
    const data = await res.json();
    setSettings(data.settings ?? {});
  }, []);

  const loadSlots = useCallback(async () => {
    setLoading(true);
    setError(null);
    const q = new URLSearchParams({ from: range.from, to: range.to });
    const res = await fetch(withBasePath(`/api/v1/booking/availability?${q}`));
    const data = await res.json();
    if (!res.ok) {
      setError(data?.error?.message ?? "無法載入時段");
      setSlots([]);
      setLoading(false);
      return;
    }
    setSlots(data.slots.filter((s: SlotRow) => s.remaining > 0));
    setLoading(false);
  }, [range.from, range.to]);

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  useEffect(() => {
    void loadSlots();
  }, [loadSlots]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
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
    await loadSlots();
    setSubmitting(false);
  }

  const bookingOpensAt =
    typeof settings?.booking_opens_at === "string" ? settings.booking_opens_at : null;
  const bookingLive = bookingOpensAt
    ? Date.now() >= new Date(bookingOpensAt).getTime()
    : false;

  return (
    <div className="space-y-6">
      {!bookingLive && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          預約申請尚未開放：你可以預覽以下時段，但「提交申請」會於開放後方可使用。
          <span className="mt-2 block text-xs text-amber-900/80">
            測試：將 <code className="rounded bg-white/80 px-1">booking_opens_at</code> 提早，或設定{" "}
            <code className="rounded bg-white/80 px-1">staging_simulated_now</code>（ISO 時間）。
          </span>
        </p>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-stone-600">
          顯示範圍（香港日期）：{range.from} 至 {range.to} · 每格 30 分鐘 · 剩餘名額 &gt; 0
        </p>
        <button
          type="button"
          onClick={() => void loadSlots()}
          className="text-sm text-stone-700 underline"
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
          申請已提交（參考編號：{done}）。主辦方審核後將以電郵通知。
          <Link href="/booking/history" className="ml-2 underline">
            查看紀錄
          </Link>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-stone-500">載入時段中…</p>
      ) : (
        <ul className="grid gap-2 sm:grid-cols-2">
          {slots.map((s) => {
            const on = selected.has(s.id);
            return (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => toggle(s.id)}
                  className={`w-full rounded-lg border px-3 py-3 text-left text-sm transition ${
                    on
                      ? "border-stone-900 bg-stone-900 text-white"
                      : "border-stone-200 bg-white hover:border-stone-400"
                  }`}
                >
                  <span className="block font-medium">
                    {new Date(s.startsAt).toLocaleString("zh-HK", {
                      timeZone: "Asia/Hong_Kong",
                      weekday: "short",
                      month: "numeric",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  <span className={`mt-1 block text-xs ${on ? "text-stone-200" : "text-stone-500"}`}>
                    {s.venueLabel ?? "場地"} · 剩 {s.remaining}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {!loading && slots.length === 0 && (
        <p className="text-sm text-stone-500">此範圍暫無可申請時段（或尚未建立時段資料）。</p>
      )}

      <div className="flex flex-wrap items-center gap-3 border-t border-stone-200 pt-6">
        <button
          type="button"
          disabled={selected.size === 0 || submitting || !bookingLive}
          onClick={() => void submit()}
          className="rounded-full bg-stone-900 px-6 py-2.5 text-sm text-white disabled:opacity-40"
        >
          {submitting ? "提交中…" : `提交申請（已選 ${selected.size} 節）`}
        </button>
        <Link href="/booking/history" className="text-sm text-stone-700 underline">
          申請紀錄
        </Link>
      </div>

      <p className="text-xs text-stone-500">
        個人使用者：每日最多 3 節；任何連續 3 日最多 7 節。教學使用者：每日最多 8 節；連續 3 日最多 16
        節。最多提前 3 個曆日預約。實際批核視乎供應及主辦安排。
      </p>
    </div>
  );
}
