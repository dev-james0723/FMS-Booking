"use client";

import { useState, Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { startAuthentication, startRegistration } from "@simplewebauthn/browser";
import type { PublicKeyCredentialCreationOptionsJSON } from "@simplewebauthn/types";
import { withBasePath } from "@/lib/base-path";

function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/admin/bookings";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [passkeyLoading, setPasskeyLoading] = useState(false);
  const [bindBusy, setBindBusy] = useState(false);
  const [postPasswordSuccess, setPostPasswordSuccess] = useState(false);
  /** Same JWT as httpOnly cookie; used when the browser does not persist the cookie for the next fetch (common on HTTP + Secure, or some mobile WebViews). */
  const [adminSessionToken, setAdminSessionToken] = useState<string | null>(null);
  const [webauthnSupported, setWebauthnSupported] = useState(false);

  function adminAuthHeaders(json = false): HeadersInit {
    const h: Record<string, string> = {};
    if (json) h["Content-Type"] = "application/json";
    if (adminSessionToken) h.Authorization = `Bearer ${adminSessionToken}`;
    return h;
  }

  useEffect(() => {
    setWebauthnSupported(
      typeof window !== "undefined" && typeof window.PublicKeyCredential !== "undefined"
    );
  }, []);

  async function passkeyLogin() {
    setError(null);
    setPasskeyLoading(true);
    try {
      const optRes = await fetch(withBasePath("/api/v1/admin/auth/passkey/login-options"), {
        method: "POST",
        credentials: "same-origin",
      });
      const optData = await optRes.json().catch(() => ({}));
      if (!optRes.ok) {
        setError(
          typeof optData?.error?.message === "string"
            ? optData.error.message
            : optRes.status === 404
              ? "尚未綁定生物辨識。請先以密碼登入，再依畫面提示綁定此裝置。"
              : `無法開始生物辨識登入（HTTP ${optRes.status}）`
        );
        return;
      }
      const options = optData?.options;
      const loginChallengeId = optData?.loginChallengeId;
      if (!options || typeof loginChallengeId !== "string") {
        setError("伺服器回應異常，請稍後再試。");
        return;
      }
      let assertion;
      try {
        assertion = await startAuthentication({ optionsJSON: options });
      } catch (e) {
        console.error(e);
        setError("已取消驗證，或此瀏覽器／網址不支援 Face ID／Touch ID。");
        return;
      }
      const verRes = await fetch(withBasePath("/api/v1/admin/auth/passkey/login-verify"), {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ loginChallengeId, credential: assertion }),
      });
      const verData = await verRes.json().catch(() => ({}));
      if (!verRes.ok) {
        setError(
          typeof verData?.error?.message === "string"
            ? verData.error.message
            : "生物辨識登入失敗"
        );
        return;
      }
      router.push(next);
      router.refresh();
    } finally {
      setPasskeyLoading(false);
    }
  }

  async function bindPasskeyOnThisDevice() {
    setError(null);
    setBindBusy(true);
    try {
      const optRes = await fetch(withBasePath("/api/v1/admin/auth/passkey/register-options"), {
        method: "POST",
        credentials: "include",
        headers: adminAuthHeaders(),
      });
      const raw = await optRes.text();
      let optData: {
        error?: { message?: string };
        options?: PublicKeyCredentialCreationOptionsJSON;
        enrollmentChallengeId?: string;
      } = {};
      try {
        optData = raw ? JSON.parse(raw) : {};
      } catch {
        optData = {};
      }
      if (!optRes.ok) {
        setError(
          typeof optData?.error?.message === "string"
            ? optData.error.message
            : raw
              ? `無法開始綁定（HTTP ${optRes.status}）`
              : `無法開始綁定（HTTP ${optRes.status}，無回應內容）`
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
        setError("已取消驗證，或此瀏覽器／網址不支援 Face ID／Touch ID。");
        return;
      }
      const verRes = await fetch(withBasePath("/api/v1/admin/auth/passkey/register-verify"), {
        method: "POST",
        credentials: "include",
        headers: adminAuthHeaders(true),
        body: JSON.stringify({ enrollmentChallengeId, credential: attResp }),
      });
      const verData = await verRes.json().catch(() => ({}));
      if (!verRes.ok) {
        setError(
          typeof verData?.error?.message === "string"
            ? verData.error.message
            : "綁定失敗"
        );
        return;
      }
    } finally {
      setBindBusy(false);
    }
    setAdminSessionToken(null);
    setPostPasswordSuccess(false);
    router.push(next);
    router.refresh();
  }

  function goToAdmin() {
    setAdminSessionToken(null);
    setPostPasswordSuccess(false);
    router.push(next);
    router.refresh();
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch(withBasePath("/api/v1/admin/auth/login"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(
        typeof data?.error?.message === "string"
          ? data.error.message
          : `登入失敗（HTTP ${res.status}）`
      );
      setLoading(false);
      return;
    }
    setLoading(false);
    if (typeof data?.sessionToken === "string" && data.sessionToken.length > 0) {
      setAdminSessionToken(data.sessionToken);
    }
    if (webauthnSupported) {
      setPostPasswordSuccess(true);
    } else {
      router.push(next);
      router.refresh();
    }
  }

  if (postPasswordSuccess) {
    return (
      <main className="flex min-h-[80vh] flex-col items-center justify-center px-5 sm:px-4">
        <div className="w-full max-w-sm space-y-4 rounded-xl border border-slate-700 bg-slate-950 p-8 shadow-xl">
          <h1 className="text-xl font-semibold text-white">登入成功</h1>
          <p className="text-sm text-slate-400">
            是否在此裝置綁定 Face ID 或 Touch ID？綁定後下次可直接使用生物辨識登入，無需再輸入密碼。
          </p>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button
            type="button"
            disabled={bindBusy}
            onClick={() => void bindPasskeyOnThisDevice()}
            className="w-full rounded-lg bg-white py-2.5 text-sm font-medium text-slate-900 hover:bg-slate-200 disabled:opacity-50"
          >
            {bindBusy ? "綁定中…" : "綁定 Face ID／Touch ID"}
          </button>
          <button
            type="button"
            disabled={bindBusy}
            onClick={goToAdmin}
            className="w-full rounded-lg border border-slate-600 py-2.5 text-sm font-medium text-slate-200 hover:bg-slate-900 disabled:opacity-50"
          >
            略過，進入後台
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-[80vh] flex-col items-center justify-center px-5 sm:px-4">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm space-y-4 rounded-xl border border-slate-700 bg-slate-950 p-8 shadow-xl"
      >
        <h1 className="text-xl font-semibold text-white">管理員登入</h1>
        <p className="text-xs text-slate-500">
          測試帳號：<span className="text-slate-400">super@staging.local</span>
          <br />
          預設密碼：<span className="text-slate-400">AdminStaging1!</span>
          （或您設定的 <code className="text-slate-500">SEED_ADMIN_PASSWORD</code>）
        </p>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <label className="block text-sm text-slate-300">
          Email
          <input
            type="email"
            required
            className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-white"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label className="block text-sm text-slate-300">
          密碼
          <input
            type="password"
            required
            className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-white"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        <button
          type="submit"
          disabled={loading || passkeyLoading}
          className="w-full rounded-lg bg-white py-2.5 text-sm font-medium text-slate-900 hover:bg-slate-200 disabled:opacity-50"
        >
          {loading ? "登入中…" : "登入"}
        </button>
        <div className="relative py-1 text-center text-xs text-slate-500 before:absolute before:inset-x-0 before:top-1/2 before:h-px before:bg-slate-700">
          <span className="relative bg-slate-950 px-2">或</span>
        </div>
        <button
          type="button"
          disabled={passkeyLoading || loading || !webauthnSupported}
          onClick={() => void passkeyLogin()}
          className="w-full rounded-lg border border-slate-600 bg-slate-900 py-2.5 text-sm font-medium text-slate-100 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {passkeyLoading ? "驗證中…" : "使用 Face ID 或 Touch ID 登入"}
        </button>
        {!webauthnSupported && (
          <p className="text-xs text-amber-600/90">
            此環境不支援 WebAuthn。請使用 Safari、Chrome 或 Edge，並以 HTTPS 或 localhost 開啟。
          </p>
        )}
        <p className="text-xs text-slate-500">
          首次使用生物辨識前，請先以電郵與密碼登入一次，並在成功後選擇「綁定 Face ID／Touch ID」。
        </p>
      </form>
    </main>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<p className="p-8 text-center text-slate-500">載入中…</p>}>
      <AdminLoginForm />
    </Suspense>
  );
}
