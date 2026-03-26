"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { withBasePath } from "@/lib/base-path";
import { displayVenueLabel, formatSlotListLineZhDateEnRange } from "@/lib/booking-slot-display";

type BookingRow = {
  id: string;
  status: string;
  requestedAt: string;
  user: { id: string; email: string; nameZh: string | null };
  slots: { startsAt: string; endsAt: string; venueLabel: string | null }[];
};

export function AdminBookingsPanel() {
  const searchParams = useSearchParams();
  const userIdFilter = searchParams.get("userId")?.trim() ?? "";

  const [rows, setRows] = useState<BookingRow[]>([]);
  const [filter, setFilter] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    const params = new URLSearchParams();
    if (filter) params.set("status", filter);
    if (userIdFilter) params.set("userId", userIdFilter);
    const q = params.toString() ? `?${params.toString()}` : "";
    const res = await fetch(withBasePath(`/api/v1/admin/bookings${q}`));
    const data = await res.json();
    if (!res.ok) {
      setError(data?.error?.message ?? "載入失敗");
      return;
    }
    setRows(data.bookings ?? []);
  }, [filter, userIdFilter]);

  useEffect(() => {
    const id = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(id);
  }, [load]);

  async function act(
    id: string,
    path: "approve" | "reject" | "waitlist",
    note?: string
  ) {
    setBusy(id + path);
    const init: RequestInit = { method: "PATCH" };
    if (path === "reject") {
      init.headers = { "Content-Type": "application/json" };
      init.body = JSON.stringify({ note: note ?? null });
    }
    const res = await fetch(withBasePath(`/api/v1/admin/bookings/${id}/${path}`), init);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      alert(data?.error?.message ?? "操作失敗");
    }
    await load();
    setBusy(null);
  }

  return (
    <div className="space-y-6">
      {userIdFilter && (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-sky-800/80 bg-sky-950/40 px-4 py-3 text-sm text-sky-100">
          <span>正在按用戶篩選預約（與「登記用戶」聯動）。</span>
          <Link
            href={`/admin/users?highlight=${encodeURIComponent(userIdFilter)}`}
            className="text-sky-300 underline hover:text-white"
          >
            返回該用戶於登記列表
          </Link>
          <Link href="/admin/bookings" className="text-slate-400 underline hover:text-white">
            清除篩選
          </Link>
        </div>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <label className="text-sm text-slate-400">
          狀態篩選
          <select
            className="ml-2 rounded border border-slate-600 bg-slate-950 px-2 py-1 text-white"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="">全部</option>
            <option value="pending">pending</option>
            <option value="approved">approved</option>
            <option value="rejected">rejected</option>
            <option value="waitlisted">waitlisted</option>
          </select>
        </label>
        <button
          type="button"
          onClick={() => void load()}
          className="text-sm text-slate-400 underline"
        >
          重新整理
        </button>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="overflow-x-auto rounded-lg border border-slate-700">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-slate-700 bg-slate-950 text-slate-400">
            <tr>
              <th className="px-3 py-2">用戶</th>
              <th className="px-3 py-2">狀態</th>
              <th className="px-3 py-2">時段</th>
              <th className="px-3 py-2">操作</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-slate-800">
                <td className="px-3 py-3 align-top text-slate-200">
                  <div className="font-medium">{r.user.nameZh ?? "—"}</div>
                  <div className="text-xs text-slate-500">{r.user.email}</div>
                  <div className="mt-1 font-mono text-[10px] text-slate-600">預約 {r.id.slice(0, 8)}…</div>
                  <Link
                    href={`/admin/users?highlight=${encodeURIComponent(r.user.id)}`}
                    className="mt-1 inline-block text-[10px] text-sky-400 underline hover:text-sky-300"
                  >
                    登記用戶資料
                  </Link>
                </td>
                <td className="px-3 py-3 align-top">
                  <span className="rounded bg-slate-800 px-2 py-0.5 text-xs">{r.status}</span>
                </td>
                <td className="px-3 py-3 align-top text-xs text-slate-300">
                  <ul className="space-y-1">
                    {r.slots.map((s, i) => (
                      <li key={i}>
                        {formatSlotListLineZhDateEnRange(s.startsAt, s.endsAt)}
                        {s.venueLabel != null && s.venueLabel !== ""
                          ? ` · ${displayVenueLabel(s.venueLabel)}`
                          : ""}
                      </li>
                    ))}
                  </ul>
                </td>
                <td className="px-3 py-3 align-top">
                  {(r.status === "pending" || r.status === "waitlisted") && (
                    <div className="flex flex-col gap-1">
                      <button
                        type="button"
                        disabled={!!busy}
                        onClick={() => void act(r.id, "approve")}
                        className="rounded bg-emerald-700 px-2 py-1 text-xs text-white hover:bg-emerald-600 disabled:opacity-40"
                      >
                        批核
                      </button>
                      {r.status === "pending" && (
                        <button
                          type="button"
                          disabled={!!busy}
                          onClick={() => void act(r.id, "waitlist")}
                          className="rounded bg-amber-700 px-2 py-1 text-xs text-white hover:bg-amber-600 disabled:opacity-40"
                        >
                          後補
                        </button>
                      )}
                      <button
                        type="button"
                        disabled={!!busy}
                        onClick={() => {
                          const note = window.prompt("拒絕原因（可留空）");
                          if (note === null) return;
                          void act(r.id, "reject", note);
                        }}
                        className="rounded bg-red-900/80 px-2 py-1 text-xs text-white hover:bg-red-800 disabled:opacity-40"
                      >
                        拒絕
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {rows.length === 0 && !error && (
        <p className="text-sm text-slate-500">暫無紀錄。</p>
      )}
    </div>
  );
}
