"use client";

import { useState, Suspense, useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { startAuthentication, startRegistration } from "@simplewebauthn/browser";
import type { PublicKeyCredentialCreationOptionsJSON } from "@simplewebauthn/types";
import { withBasePath } from "@/lib/base-path";
import { googleAuthStartUrl } from "@/lib/auth/google-auth-start-url";

const googleAuthEnabled =
  typeof process.env.NEXT_PUBLIC_GOOGLE_AUTH_CLIENT_ID === "string" &&
  process.env.NEXT_PUBLIC_GOOGLE_AUTH_CLIENT_ID.length > 0;

function AdminLoginForm() {
  const router = useRouter();
  const pathname = usePathname();
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

  useEffect(() => {
    const g = searchParams.get("google");
    if (!g) return;
    const map: Record<string, string> = {
      cfg: "此伺服器尚未設定 Google 登入。",
      denied: "已取消 Google 登入。",
      bad: "無法完成 Google 登入，請重試。",
      state: "登入逾時，請重新使用 Google 登入。",
      token: "無法驗證 Google 帳戶，請重試。",
      profile: "Google 帳戶未提供已驗證的電郵地址。",
      noaccount: "此 Google 帳戶並非已登記的管理員電郵。",
    };
    const msg = map[g];
    if (msg) setError(msg);
    const p = new URLSearchParams(searchParams.toString());
    p.delete("google");
    const q = p.toString();
    router.replace(q ? `${pathname}?${q}` : pathname);
  }, [searchParams, router, pathname]);

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
        <div className="py-1">
          {googleAuthEnabled ? (
            <a
              href={googleAuthStartUrl("admin", next)}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-600 bg-slate-900 py-2.5 text-sm font-medium text-slate-100 hover:bg-slate-800"
            >
              <svg className="size-5 shrink-0" viewBox="0 0 24 24" aria-hidden>
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              使用 Google 帳戶登入
            </a>
          ) : (
            <p className="text-center text-xs leading-relaxed text-slate-500">
              此站尚未啟用 Google 登入。請於環境變數設定 NEXT_PUBLIC_GOOGLE_AUTH_CLIENT_ID 與 GOOGLE_AUTH_CLIENT_SECRET（見
              .env.example），並在 Google Cloud 設定 OAuth 重新導向 URI，然後重新啟動網站。
            </p>
          )}
        </div>
        <div className="relative py-1 text-center text-xs text-slate-500 before:absolute before:inset-x-0 before:top-1/2 before:h-px before:bg-slate-700">
          <span className="relative bg-slate-950 px-2">或</span>
        </div>
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
