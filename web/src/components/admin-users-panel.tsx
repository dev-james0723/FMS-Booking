"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

const HK = { timeZone: "Asia/Hong_Kong" } as const;

function fmt(dt: string) {
  return new Date(dt).toLocaleString("zh-HK", {
    ...HK,
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function fmtDate(dt: string) {
  return new Date(dt).toLocaleString("zh-HK", {
    ...HK,
    year: "numeric",
    month: "numeric",
    day: "numeric",
  });
}

type BookingReq = {
  id: string;
  status: string;
  requestedAt: string;
  slotCount: number;
  slots: {
    id: string;
    startsAt: string;
    endsAt: string;
    venueLabel: string | null;
    allocationStatus: string;
  }[];
};

/** Sticky 首三欄寬度需與 left 偏移一致（橫向捲動時凍結）。 */
const STICKY = {
  name: "10rem",
  phone: "8.5rem",
  cat: "7.5rem",
  /** cumulative left for 電話欄 */
  leftPhone: "10rem",
  /** cumulative left for 類別欄（中文名 + 電話） */
  leftCat: "18.5rem",
} as const;

type UserRow = {
  id: string;
  email: string;
  createdAt: string;
  category: { code: string; nameZh: string } | null;
  profile: {
    nameZh: string;
    nameEn: string | null;
    phone: string;
    age: number;
    instrumentField: string;
    identityLabels: string[];
    identityOtherText: string | null;
    preferredDates: string[];
    preferredTimeText: string | null;
    extraNotes: string | null;
  } | null;
  bookingRequests: BookingReq[];
};

export function AdminUsersPanel() {
  const [rows, setRows] = useState<UserRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const highlightId = searchParams.get("highlight")?.trim() ?? "";
  const rowRefs = useRef<Record<string, HTMLTableRowElement | null>>({});

  const load = useCallback(async () => {
    setError(null);
    const res = await fetch("/api/v1/admin/users");
    const data = await res.json();
    if (!res.ok) {
      setError(data?.error?.message ?? "載入失敗");
      return;
    }
    setRows(data.users ?? []);
  }, []);

  useEffect(() => {
    const id = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(id);
  }, [load]);

  useEffect(() => {
    if (!highlightId) return;
    const el = rowRefs.current[highlightId];
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [highlightId, rows]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-4 text-sm">
        <button
          type="button"
          onClick={() => void load()}
          className="text-slate-400 underline hover:text-white"
        >
          重新整理
        </button>
        <Link href="/admin/bookings" className="text-slate-400 underline hover:text-white">
          預約申請（全部）
        </Link>
        <Link href="/admin/calendar" className="text-slate-400 underline hover:text-white">
          日曆／時段
        </Link>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="overflow-x-auto rounded-lg border border-slate-700">
        <table className="w-full min-w-[1100px] text-left text-sm">
          <thead className="border-b border-slate-700 bg-slate-950 text-slate-400">
            <tr>
              <th
                style={{ width: STICKY.name, minWidth: STICKY.name, left: 0 }}
                className="sticky z-30 box-border bg-slate-950 px-3 py-2 align-top shadow-[4px_0_12px_-4px_rgba(0,0,0,0.5)]"
              >
                中文名
              </th>
              <th
                style={{ width: STICKY.phone, minWidth: STICKY.phone, left: STICKY.leftPhone }}
                className="sticky z-30 box-border bg-slate-950 px-3 py-2 align-top shadow-[4px_0_12px_-4px_rgba(0,0,0,0.5)]"
              >
                電話
              </th>
              <th
                style={{ width: STICKY.cat, minWidth: STICKY.cat, left: STICKY.leftCat }}
                className="sticky z-30 box-border border-r border-slate-600 bg-slate-950 px-3 py-2 align-top shadow-[6px_0_14px_-4px_rgba(0,0,0,0.55)]"
              >
                類別
              </th>
              <th className="px-3 py-2">英文名</th>
              <th className="px-3 py-2">Email</th>
              <th className="px-3 py-2">樂器／領域</th>
              <th className="px-3 py-2">登記日期</th>
              <th className="min-w-[240px] px-3 py-2">預約紀錄</th>
              <th className="px-3 py-2">聯動</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((u) => {
              const p = u.profile;
              const isHi = highlightId === u.id;
              const stickyBg = isHi ? "bg-slate-800" : "bg-slate-900";
              return (
                <tr
                  key={u.id}
                  ref={(el) => {
                    rowRefs.current[u.id] = el;
                  }}
                  className={`border-b border-slate-800 ${isHi ? "bg-slate-800/80 ring-1 ring-amber-500/60" : ""}`}
                >
                  <td
                    style={{ width: STICKY.name, minWidth: STICKY.name, left: 0 }}
                    className={`sticky z-20 box-border px-3 py-3 align-top shadow-[4px_0_12px_-4px_rgba(0,0,0,0.5)] ${stickyBg} text-slate-200`}
                  >
                    <div className="break-words">{p?.nameZh ?? "—"}</div>
                    {p && (
                      <details className="mt-2 text-[11px] text-slate-500">
                        <summary className="cursor-pointer text-slate-400 hover:text-slate-200">
                          更多登記欄位
                        </summary>
                        <div className="mt-2 space-y-1 border-l border-slate-600 pl-2 text-slate-400">
                          <p>
                            <span className="text-slate-500">身份：</span>
                            {p.identityLabels.length ? p.identityLabels.join("、") : "—"}
                            {p.identityOtherText ? (
                              <span className="block text-slate-500">
                                （其他說明：{p.identityOtherText}）
                              </span>
                            ) : null}
                          </p>
                          <p>
                            <span className="text-slate-500">意向日期：</span>
                            {p.preferredDates.length ? p.preferredDates.join("、") : "—"}
                          </p>
                          <p>
                            <span className="text-slate-500">希望時段：</span>
                            {p.preferredTimeText ?? "—"}
                          </p>
                          <p>
                            <span className="text-slate-500">補充：</span>
                            {p.extraNotes ?? "—"}
                          </p>
                        </div>
                      </details>
                    )}
                  </td>
                  <td
                    style={{ width: STICKY.phone, minWidth: STICKY.phone, left: STICKY.leftPhone }}
                    className={`sticky z-20 box-border whitespace-nowrap px-3 py-3 align-top shadow-[4px_0_12px_-4px_rgba(0,0,0,0.5)] ${stickyBg} text-slate-300`}
                  >
                    {p?.phone ?? "—"}
                  </td>
                  <td
                    style={{ width: STICKY.cat, minWidth: STICKY.cat, left: STICKY.leftCat }}
                    className={`sticky z-20 box-border border-r border-slate-600 px-3 py-3 align-top text-xs shadow-[6px_0_14px_-4px_rgba(0,0,0,0.55)] ${stickyBg} text-slate-400`}
                  >
                    <span className="line-clamp-4 break-words">{u.category?.nameZh ?? "—"}</span>
                  </td>
                  <td className="px-3 py-3 align-top text-slate-300">{p?.nameEn ?? "—"}</td>
                  <td className="px-3 py-3 align-top">
                    <span className="break-all text-slate-200">{u.email}</span>
                  </td>
                  <td
                    className="max-w-[140px] px-3 py-3 align-top text-xs text-slate-300"
                    title={p?.instrumentField}
                  >
                    {p?.instrumentField ? (
                      <span className="line-clamp-3">{p.instrumentField}</span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 align-top text-xs text-slate-400">
                    {fmtDate(u.createdAt)}
                  </td>
                  <td className="px-3 py-3 align-top text-xs text-slate-300">
                    {u.bookingRequests.length === 0 ? (
                      <span className="text-slate-500">尚未提交預約申請</span>
                    ) : (
                      <details className="group">
                        <summary className="cursor-pointer text-slate-200 hover:text-white">
                          {u.bookingRequests.length} 宗申請 ·
                          {u.bookingRequests.map((b) => b.status).join(" / ")}
                        </summary>
                        <ul className="mt-2 space-y-3 border-l border-slate-600 pl-3">
                          {u.bookingRequests.map((br) => (
                            <li key={br.id}>
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] uppercase">
                                  {br.status}
                                </span>
                                <span className="text-slate-500">
                                  申請於 {fmt(br.requestedAt)} · {br.slotCount} 節
                                </span>
                              </div>
                              <ul className="mt-1 space-y-0.5 text-[11px] text-slate-400">
                                {br.slots.map((s) => (
                                  <li key={s.id}>
                                    {fmt(s.startsAt)}
                                    {s.venueLabel ? ` · ${s.venueLabel}` : ""}
                                    <span className="text-slate-600"> ({s.allocationStatus})</span>
                                  </li>
                                ))}
                              </ul>
                            </li>
                          ))}
                        </ul>
                      </details>
                    )}
                  </td>
                  <td className="px-3 py-3 align-top">
                    <div className="flex flex-col gap-1.5">
                      <Link
                        href={`/admin/bookings?userId=${encodeURIComponent(u.id)}`}
                        className="text-xs text-sky-400 underline hover:text-sky-300"
                      >
                        在「預約申請」篩選
                      </Link>
                      <Link
                        href="/admin/calendar"
                        className="text-xs text-slate-500 underline hover:text-slate-300"
                      >
                        查看日曆時段
                      </Link>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {rows.length === 0 && !error && (
        <p className="text-sm text-slate-500">暫無已登記用戶。</p>
      )}

      <p className="text-xs text-slate-500">
        提示：橫向捲動時，「中文名、電話、類別」三欄會固定顯示，方便對照右側「預約紀錄」與「聯動」。日曆頁面可查看每格時段的整體佔用與申請者
        Email。
      </p>
    </div>
  );
}
