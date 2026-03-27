"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { withBasePath } from "@/lib/base-path";
import { displayVenueLabel, formatSlotListLineZhDateEnRange } from "@/lib/booking-slot-display";
import {
  bookingIdentityTypeLabelZh,
  quotaTierLabelZh,
} from "@/lib/identity-labels";

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
  bookingIdentityType: string;
  slotCount: number;
  slots: {
    id: string;
    startsAt: string;
    endsAt: string;
    venueLabel: string | null;
    allocationStatus: string;
  }[];
};

/** 橫向捲動時僅凍結「中文名」欄；寬度需與 sticky left 一致。 */
const STICKY_NAME_COL = "10rem" as const;

type UserRow = {
  id: string;
  email: string;
  createdAt: string;
  quotaTier: string;
  lastBookingAt: string | null;
  cooldown: { active: boolean; remainingMs: number; nextBookingAt: string | null };
  bookingUsage: {
    todayKey: string;
    todayCommitted: number;
    dailyMax: number;
    rollingSum: number;
    rollingMax: number;
  };
  category: { code: string; nameZh: string } | null;
  profile: {
    nameZh: string;
    nameEn: string | null;
    phone: string;
    age: number;
    instrumentField: string;
    bookingVenueKind: string;
    instrumentCategoryZh: string;
    identityLabels: string[];
    identityOtherText: string | null;
    preferredDates: string[];
    preferredTimeText: string | null;
    extraNotes: string | null;
    teacherRecommended: boolean;
    teacherName: string | null;
    teacherContact: string | null;
    individualEligible: boolean;
    teachingEligible: boolean;
  } | null;
  bookingRequests: BookingReq[];
};

type AdminUsersApiBody = {
  users?: UserRow[];
  error?: { message?: string };
};

type ApiErrorEnvelope = {
  error?: { message?: string };
};

export function AdminUsersPanel() {
  const [rows, setRows] = useState<UserRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const highlightId = searchParams.get("highlight")?.trim() ?? "";
  const rowRefs = useRef<Record<string, HTMLTableRowElement | null>>({});

  const load = useCallback(async () => {
    setError(null);
    const res = await fetch(withBasePath("/api/v1/admin/users"), {
      credentials: "include",
    });
    const raw = await res.text();
    let data: AdminUsersApiBody | null = null;
    if (raw.trim()) {
      try {
        data = JSON.parse(raw) as AdminUsersApiBody;
      } catch {
        setError(`伺服器回應不是有效 JSON（HTTP ${res.status}）`);
        return;
      }
    } else if (!res.ok) {
      setError(`載入失敗（HTTP ${res.status}，無回應內容）`);
      return;
    }
    if (!res.ok) {
      setError(data?.error?.message ?? "載入失敗");
      return;
    }
    setRows(data?.users ?? []);
  }, []);

  const deleteUser = useCallback(
    async (userId: string, email: string) => {
      const ok = window.confirm(
        `確定要從資料庫永久刪除此用戶？\n\n${email}\n\n此操作無法還原，相關預約與登記資料亦會一併刪除或解除關聯。`
      );
      if (!ok) return;

      setDeletingId(userId);
      setError(null);
      try {
        const res = await fetch(withBasePath(`/api/v1/admin/users/${encodeURIComponent(userId)}`), {
          method: "DELETE",
          credentials: "include",
        });
        const raw = await res.text();
        let body: ApiErrorEnvelope | null = null;
        if (raw.trim()) {
          try {
            body = JSON.parse(raw) as ApiErrorEnvelope;
          } catch {
            setError(`刪除失敗：伺服器回應不是有效 JSON（HTTP ${res.status}）`);
            return;
          }
        }
        if (!res.ok) {
          setError(body?.error?.message ?? `刪除失敗（HTTP ${res.status}）`);
          return;
        }
        setRows((prev) => prev.filter((u) => u.id !== userId));
      } finally {
        setDeletingId(null);
      }
    },
    []
  );

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
          預約（全部）
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
                style={{ width: STICKY_NAME_COL, minWidth: STICKY_NAME_COL, left: 0 }}
                className="sticky z-30 box-border border-r border-slate-600 bg-slate-950 px-3 py-2 align-top shadow-[6px_0_14px_-4px_rgba(0,0,0,0.55)]"
              >
                中文名
              </th>
              <th className="min-w-[8.5rem] px-3 py-2">電話</th>
              <th className="min-w-[7.5rem] px-3 py-2">類別</th>
              <th className="min-w-[11rem] px-3 py-2">配額／資格</th>
              <th className="px-3 py-2">英文名</th>
              <th className="px-3 py-2">Email</th>
              <th className="px-3 py-2">樂器／領域</th>
              <th className="min-w-[10rem] px-3 py-2">預約系統／分類</th>
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
                    style={{ width: STICKY_NAME_COL, minWidth: STICKY_NAME_COL, left: 0 }}
                    className={`sticky z-20 box-border border-r border-slate-600 px-3 py-3 align-top shadow-[6px_0_14px_-4px_rgba(0,0,0,0.55)] ${stickyBg} text-slate-200`}
                  >
                    <div className="break-words">{p?.nameZh ?? "—"}</div>
                    <details className="mt-2 text-[11px] text-slate-500">
                      <summary className="cursor-pointer text-slate-400 hover:text-slate-200">
                        更多登記欄位
                      </summary>
                      <div className="mt-2 space-y-1 border-l border-slate-600 pl-2 text-slate-400">
                        {p ? (
                          <>
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
                            <p>
                              <span className="text-slate-500">老師推薦：</span>
                              {p.teacherRecommended ? "是" : "否"}
                              {p.teacherRecommended && (p.teacherName || p.teacherContact) ? (
                                <span className="block text-slate-500">
                                  {p.teacherName ?? "—"} · {p.teacherContact ?? "—"}
                                </span>
                              ) : null}
                            </p>
                            <p>
                              <span className="text-slate-500">預約身份資格：</span>
                              個人{p.individualEligible ? "✓" : "✗"} · 教學
                              {p.teachingEligible ? "✓" : "✗"}
                            </p>
                          </>
                        ) : (
                          <p className="text-slate-500">此用戶沒有登記檔案紀錄。</p>
                        )}
                        <div className="mt-3 border-t border-slate-700 pt-2">
                          <button
                            type="button"
                            disabled={deletingId === u.id}
                            onClick={() => void deleteUser(u.id, u.email)}
                            className="text-left text-red-400 underline decoration-red-400/70 hover:text-red-300 hover:decoration-red-300 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {deletingId === u.id ? "刪除中…" : "刪除用戶"}
                          </button>
                        </div>
                      </div>
                    </details>
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 align-top text-slate-300">
                    {p?.phone ?? "—"}
                  </td>
                  <td className="max-w-[7.5rem] px-3 py-3 align-top text-xs text-slate-400">
                    <span className="line-clamp-4 break-words">{u.category?.nameZh ?? "—"}</span>
                  </td>
                  <td className="max-w-[13rem] px-3 py-3 align-top text-[11px] leading-snug text-slate-300">
                    <p className="font-medium text-slate-200">{quotaTierLabelZh(u.quotaTier)}</p>
                    <p className="mt-1 text-slate-500">
                      今日 {u.bookingUsage.todayCommitted}/{u.bookingUsage.dailyMax} 節（{u.bookingUsage.todayKey}）
                    </p>
                    <p className="text-slate-500">
                      連續 3 日最多 {u.bookingUsage.rollingSum}/{u.bookingUsage.rollingMax} 節
                    </p>
                    {u.cooldown.active && u.cooldown.nextBookingAt ? (
                      <p className="mt-1 text-amber-400/90">
                        冷卻中 · 下次可提交約 {fmt(u.cooldown.nextBookingAt)}
                      </p>
                    ) : (
                      <p className="mt-1 text-slate-600">可提交新預約（非冷卻）</p>
                    )}
                    <p className="mt-1 text-slate-600">
                      最近成功提交：{u.lastBookingAt ? fmt(u.lastBookingAt) : "—"}
                    </p>
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
                  <td className="max-w-[12rem] px-3 py-3 align-top text-xs leading-snug text-slate-200">
                    {p?.instrumentCategoryZh ?? "—"}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 align-top text-xs text-slate-400">
                    {fmtDate(u.createdAt)}
                  </td>
                  <td className="px-3 py-3 align-top text-xs text-slate-300">
                    {u.bookingRequests.length === 0 ? (
                      <span className="text-slate-500">尚未提交預約</span>
                    ) : (
                      <details className="group">
                        <summary className="cursor-pointer text-slate-200 hover:text-white">
                          {u.bookingRequests.length} 宗預約 ·
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
                                  預約於 {fmt(br.requestedAt)} · {br.slotCount} 節 · 今次身份
                                  {bookingIdentityTypeLabelZh(br.bookingIdentityType)}
                                </span>
                              </div>
                              <ul className="mt-1 space-y-0.5 text-[11px] text-slate-400">
                                {br.slots.map((s) => (
                                  <li key={s.id}>
                                    {formatSlotListLineZhDateEnRange(s.startsAt, s.endsAt)}
                                    {s.venueLabel != null && s.venueLabel !== ""
                                      ? ` · ${displayVenueLabel(s.venueLabel)}`
                                      : ""}
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
                        href={`/admin/bookings?userId=${encodeURIComponent(u.id)}&venue=${encodeURIComponent(p?.bookingVenueKind ?? "studio_room")}`}
                        className="text-xs text-sky-400 underline hover:text-sky-300"
                      >
                        在「預約」篩選
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
        提示：橫向捲動時僅「中文名」欄固定顯示，方便對照右側「預約紀錄」與「聯動」。日曆「Calendar
        時間軸」每格會顯示名額佔用（已用／總數）及預約者 Email。
      </p>
    </div>
  );
}
