"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { startRegistration } from "@simplewebauthn/browser";
import { withBasePath } from "@/lib/base-path";

type PasskeyRow = { id: string; createdAt: string; hint: string };

export function AccountPasskeysPanel() {
  const [items, setItems] = useState<PasskeyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addBusy, setAddBusy] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [webauthnSupported, setWebauthnSupported] = useState(false);

  const fetchList = useCallback(async () => {
    setError(null);
    const res = await fetch(withBasePath("/api/v1/account/passkeys"), { credentials: "same-origin" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(typeof data?.error?.message === "string" ? data.error.message : "無法載入");
      setItems([]);
      return;
    }
    setItems(Array.isArray(data?.passkeys) ? data.passkeys : []);
  }, []);

  useEffect(() => {
    setWebauthnSupported(
      typeof window !== "undefined" && typeof window.PublicKeyCredential !== "undefined"
    );
  }, []);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    void fetchList().finally(() => {
      if (alive) setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, [fetchList]);

  function formatDate(iso: string) {
    try {
      return new Date(iso).toLocaleString("zh-HK", {
        dateStyle: "medium",
        timeStyle: "short",
      });
    } catch {
      return iso;
    }
  }

  async function addPasskey() {
    setError(null);
    setAddBusy(true);
    try {
      const optRes = await fetch(withBasePath("/api/v1/account/passkeys/register-options"), {
        method: "POST",
        credentials: "same-origin",
      });
      const optData = await optRes.json().catch(() => ({}));
      if (!optRes.ok) {
        setError(
          typeof optData?.error?.message === "string"
            ? optData.error.message
            : "無法開始新增通行密鑰"
        );
        return;
      }
      const options = optData?.options;
      const enrollmentChallengeId = optData?.enrollmentChallengeId;
      if (!options || typeof enrollmentChallengeId !== "string") {
        setError("伺服器回應異常，請稍後再試。");
        return;
      }
      let attResp;
      try {
        attResp = await startRegistration({ optionsJSON: options });
      } catch (e) {
        console.error(e);
        setError("已取消驗證，或此瀏覽器／網址不支援 Face ID／指紋。");
        return;
      }
      const verRes = await fetch(withBasePath("/api/v1/account/passkeys/register-verify"), {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enrollmentChallengeId, credential: attResp }),
      });
      const verData = await verRes.json().catch(() => ({}));
      if (!verRes.ok) {
        setError(
          typeof verData?.error?.message === "string"
            ? verData.error.message
            : "新增通行密鑰失敗"
        );
        return;
      }
      await fetchList();
    } finally {
      setAddBusy(false);
    }
  }

  async function removePasskey(id: string) {
    if (
      !confirm(
        "確定要移除此通行密鑰？移除後請使用其他已綁定裝置或電郵＋密碼登入。"
      )
    ) {
      return;
    }
    setError(null);
    setDeletingId(id);
    try {
      const res = await fetch(withBasePath(`/api/v1/account/passkeys/${encodeURIComponent(id)}`), {
        method: "DELETE",
        credentials: "same-origin",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data?.error?.message === "string" ? data.error.message : "移除失敗");
        return;
      }
      setItems((prev) => prev.filter((p) => p.id !== id));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-6 rounded-2xl border border-stone-200 dark:border-stone-700 bg-surface p-8 shadow-sm">
      <div>
        <h1 className="font-serif text-2xl text-stone-900 dark:text-stone-50">通行密鑰（Passkey）</h1>
        <p className="mt-2 text-xs text-stone-600 dark:text-stone-400">
          管理已綁定的 Face ID、Touch ID、指紋或 Windows Hello 等登入方式。您可新增多部裝置，亦可移除不再使用的密鑰。
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-stone-500 dark:text-stone-500">載入中…</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-stone-600 dark:text-stone-400">目前未有通行密鑰。您可按下方新增（須瀏覽器支援）。</p>
      ) : (
        <ul className="space-y-2">
          {items.map((p) => (
            <li
              key={p.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-stone-200 dark:border-stone-700 px-3 py-3 text-sm"
            >
              <div>
                <p className="font-medium text-stone-900 dark:text-stone-50">裝置識別碼（節略）· {p.hint}</p>
                <p className="text-xs text-stone-500 dark:text-stone-500">新增於 {formatDate(p.createdAt)}</p>
              </div>
              <button
                type="button"
                disabled={deletingId === p.id}
                onClick={() => void removePasskey(p.id)}
                className="shrink-0 rounded-lg border border-stone-300 dark:border-stone-600 px-3 py-1.5 text-xs text-stone-800 dark:text-stone-200 hover:bg-stone-50 dark:hover:bg-stone-800 disabled:opacity-50"
              >
                {deletingId === p.id ? "移除中…" : "移除"}
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="border-t border-stone-200 dark:border-stone-700 pt-4">
        <button
          type="button"
          disabled={addBusy || !webauthnSupported}
          onClick={() => void addPasskey()}
          className="w-full rounded-full bg-stone-900 py-2.5 text-sm text-white hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {addBusy ? "處理中…" : "新增通行密鑰"}
        </button>
        {!webauthnSupported && (
          <p className="mt-2 text-xs text-amber-800">
            此瀏覽器不支援 WebAuthn，無法新增。請改用 Safari、Chrome 或 Edge，並以 HTTPS 或 localhost 開啟。
          </p>
        )}
      </div>

      <p className="text-center text-sm">
        <Link href="/account" className="text-stone-700 dark:text-stone-300 underline decoration-stone-400 underline-offset-2">
          返回帳戶概覽
        </Link>
      </p>
    </div>
  );
}
