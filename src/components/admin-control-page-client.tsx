"use client";

import { useCallback, useEffect, useState } from "react";
import { withBasePath } from "@/lib/base-path";

export function AdminControlPageClient() {
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(withBasePath("/api/v1/admin/settings/booking-test-mode"));
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error?.message ?? "無法載入設定");
        setEnabled(null);
        return;
      }
      setEnabled(Boolean(data?.enabled));
    } catch {
      setError("無法載入設定");
      setEnabled(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function setMode(next: boolean) {
    if (saving || enabled === next) return;
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch(withBasePath("/api/v1/admin/settings/booking-test-mode"), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: next }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error?.message ?? "更新失敗");
        return;
      }
      setEnabled(Boolean(data?.enabled));
      setMessage(next ? "已啟用測試模式。" : "已關閉測試模式，網站已回復正式流程。");
    } catch {
      setError("更新失敗");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-white">控制</h1>
        <p className="mt-2 text-sm text-slate-400">
          預約系統測試模式：啟用後會略過主頁倒數與「預約尚未開放」限制，讓已登入用戶依現有活動日期（4 月 3 日—5 月 3
          日）及滾動窗口規則測試琴室與開放空間預約。關閉後還原為以「正式開放預約時間」為準，直至該時間前任何人都無法成功提交預約。
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-slate-400">載入中…</p>
      ) : enabled === null ? (
        <p className="text-sm text-rose-300">{error ?? "無法載入"}</p>
      ) : (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
          <button
            type="button"
            disabled={saving || enabled === true}
            onClick={() => void setMode(true)}
            className="rounded-lg border border-amber-500/60 bg-amber-600/20 px-5 py-3 text-sm font-medium text-amber-100 transition hover:bg-amber-600/30 disabled:cursor-not-allowed disabled:opacity-40"
          >
            啟用測試模式
          </button>
          <button
            type="button"
            disabled={saving || enabled === false}
            onClick={() => void setMode(false)}
            className="rounded-lg border border-slate-600 bg-slate-800 px-5 py-3 text-sm font-medium text-slate-100 transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            關閉測試模式
          </button>
        </div>
      )}

      {saving && <p className="text-sm text-slate-400">儲存中…</p>}
      {message && !saving && <p className="text-sm text-emerald-300">{message}</p>}
      {error && !loading && enabled !== null && <p className="text-sm text-rose-300">{error}</p>}

      {!loading && enabled === true && (
        <p className="rounded-lg border border-amber-700/50 bg-amber-950/40 px-4 py-3 text-xs text-amber-100/90">
          目前狀態：<span className="font-semibold">測試模式運作中</span>
          。正式上線前請記得關閉，以免公眾在開放日前預約。
        </p>
      )}
    </div>
  );
}
