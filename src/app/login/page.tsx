"use client";

import { useState, Suspense, useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { startAuthentication } from "@simplewebauthn/browser";
import { withBasePath } from "@/lib/base-path";
import { googleAuthStartUrl } from "@/lib/auth/google-auth-start-url";
import { useTranslation } from "@/lib/i18n/use-translation";

const googleAuthEnabled =
  typeof process.env.NEXT_PUBLIC_GOOGLE_AUTH_CLIENT_ID === "string" &&
  process.env.NEXT_PUBLIC_GOOGLE_AUTH_CLIENT_ID.length > 0;

function LoginForm() {
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/account";
  const loginTitle =
    next.includes("/open-space") ? t("login.titleOpenSpace") : next.startsWith("/booking") ? t("login.titlePianoStudio") : t("login.title");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [passkeyLoading, setPasskeyLoading] = useState(false);
  const [passkeysSupported, setPasskeysSupported] = useState(false);

  useEffect(() => {
    setPasskeysSupported(
      typeof window !== "undefined" && typeof window.PublicKeyCredential !== "undefined"
    );
  }, []);

  useEffect(() => {
    const g = searchParams.get("google");
    if (!g) return;
    const map: Record<string, string> = {
      cfg: t("login.googleNotConfigured"),
      denied: t("login.googleDenied"),
      bad: t("login.googleBad"),
      state: t("login.googleState"),
      token: t("login.googleToken"),
      profile: t("login.googleProfile"),
      noaccount: t("login.googleNoAccount"),
      disabled: t("login.googleDisabled"),
    };
    const msg = map[g];
    if (msg) setError(msg);
    const p = new URLSearchParams(searchParams.toString());
    p.delete("google");
    const q = p.toString();
    router.replace(q ? `${pathname}?${q}` : pathname);
  }, [searchParams, router, pathname, t]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch(withBasePath("/api/v1/auth/login"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data?.error?.message ?? t("login.errLoginFail"));
      setLoading(false);
      return;
    }
    if (data.mustChangePassword) {
      router.refresh();
      router.push(`/account/change-password?next=${encodeURIComponent(next)}`);
    } else {
      router.refresh();
      router.push(next);
    }
    setLoading(false);
  }

  async function onPasskeyLogin() {
    setError(null);
    setPasskeyLoading(true);
    try {
      const emailTrim = email.trim();
      const optRes = await fetch(withBasePath("/api/v1/auth/passkey/login-options"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(emailTrim ? { email: emailTrim } : {}),
      });
      const optData = await optRes.json().catch(() => ({}));
      if (!optRes.ok) {
        setError(
          typeof optData?.error?.message === "string"
            ? optData.error.message
            : t("login.errPasskey")
        );
        return;
      }
      const options = optData?.options;
      const loginChallengeId = optData?.loginChallengeId;
      if (!options || typeof loginChallengeId !== "string") {
        setError(t("login.errServer"));
        return;
      }
      let assertion;
      try {
        assertion = await startAuthentication({ optionsJSON: options });
      } catch (e) {
        console.error(e);
        setError(t("login.errPasskeyCancel"));
        return;
      }
      const verRes = await fetch(withBasePath("/api/v1/auth/passkey/login-verify"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          ...(emailTrim ? { email: emailTrim } : {}),
          loginChallengeId,
          credential: assertion,
        }),
      });
      const verData = await verRes.json().catch(() => ({}));
      if (!verRes.ok) {
        setError(
          typeof verData?.error?.message === "string" ? verData.error.message : t("login.errPasskeyFail")
        );
        return;
      }
      if (verData?.mustChangePassword) {
        router.refresh();
        router.push(`/account/change-password?next=${encodeURIComponent(next)}`);
      } else {
        router.refresh();
        router.push(next);
      }
    } catch {
      setError(t("login.errNetwork"));
    } finally {
      setPasskeyLoading(false);
    }
  }

  const passkeyFootnote = t("login.passkeyFootnote").trim();

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-sm space-y-4 rounded-2xl border border-stone-200 dark:border-stone-700 bg-surface p-8 shadow-sm">
      <h1 className="font-serif text-2xl text-stone-900 dark:text-stone-50">{loginTitle}</h1>
      <p className="text-xs text-stone-500 dark:text-stone-500">{t("login.hint")}</p>
      {error && (
        <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
      )}
      <button
        type="button"
        disabled={passkeyLoading || loading || !passkeysSupported}
        onClick={() => void onPasskeyLogin()}
        className="flex w-full items-center justify-center gap-3 rounded-full border border-stone-600 bg-stone-800 py-3 text-sm font-medium text-indigo-200 shadow-sm hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-stone-600 dark:bg-stone-800/95 dark:text-indigo-200/95 dark:hover:bg-stone-700"
      >
        <svg
          className="size-5 shrink-0 text-indigo-300 dark:text-indigo-300/90"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden
        >
          <circle cx="9" cy="7" r="3" strokeWidth="1.5" stroke="currentColor" />
          <path
            d="M5 20v-1.2a4.2 4.2 0 0 1 4.2-4.2h.6a4.1 4.1 0 0 1 2.1.57"
            strokeWidth="1.5"
            stroke="currentColor"
            strokeLinecap="round"
          />
          <path
            d="M15.5 10.5h4.25a.75.75 0 0 1 .75.75v2.5a.75.75 0 0 1-.75.75H17v2.25a.75.75 0 0 1-.75.75h-1a.75.75 0 0 1-.75-.75V10.5z"
            strokeWidth="1.5"
            stroke="currentColor"
            strokeLinejoin="round"
          />
          <path d="M17 13.5h1.25" strokeWidth="1.5" stroke="currentColor" strokeLinecap="round" />
        </svg>
        {passkeyLoading ? t("login.passkeyVerifying") : t("login.passkey")}
      </button>
      {passkeyFootnote !== "" && (
        <p className="text-center text-[11px] leading-relaxed text-stone-500 dark:text-stone-500">
          {passkeyFootnote}
        </p>
      )}
      {!passkeysSupported && (
        <p className="text-center text-[11px] text-amber-800 dark:text-amber-200/90">
          {t("reg.errWebauthnBrowser")}
        </p>
      )}
      <div className="relative py-2 text-center text-xs text-stone-400 dark:text-stone-500 before:absolute before:inset-x-8 before:top-1/2 before:h-px before:bg-stone-200 dark:before:bg-stone-600">
        <span className="relative bg-surface px-2">{t("login.or")}</span>
      </div>
      <div className="py-1">
        {googleAuthEnabled ? (
          <a
            href={googleAuthStartUrl("login", next)}
            className="flex w-full items-center justify-center gap-2 rounded-full border border-stone-300 bg-white py-2.5 text-sm font-medium text-stone-800 shadow-sm hover:bg-stone-50 dark:border-stone-600 dark:bg-stone-900 dark:text-stone-100 dark:hover:bg-stone-800"
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
            {t("login.googleContinue")}
          </a>
        ) : (
          <p className="text-center text-xs leading-relaxed text-stone-500 dark:text-stone-400">
            {t("login.googlePendingHint")}
          </p>
        )}
      </div>
      <div className="relative py-2 text-center text-xs text-stone-400 dark:text-stone-500 before:absolute before:inset-x-8 before:top-1/2 before:h-px before:bg-stone-200 dark:before:bg-stone-600">
        <span className="relative bg-surface px-2">{t("login.or")}</span>
      </div>
      <label className="block text-sm">
        Email
        <input
          type="email"
          required
          className="mt-1 w-full rounded-lg border border-stone-300 bg-surface-input px-4 py-2 sm:px-3 text-foreground dark:border-stone-700"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </label>
      <label className="block text-sm">
        {t("login.password")}
        <input
          type="password"
          required
          className="mt-1 w-full rounded-lg border border-stone-300 bg-surface-input px-4 py-2 sm:px-3 text-foreground dark:border-stone-700"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </label>
      <button
        type="submit"
        disabled={loading || passkeyLoading}
        className="w-full rounded-full bg-stone-900 py-2.5 text-sm text-white hover:bg-stone-800 disabled:opacity-50"
      >
        {loading ? t("login.signingIn") : t("login.signIn")}
      </button>
      <p className="text-center text-xs text-stone-500 dark:text-stone-500">
        {t("login.noAccount")}{" "}
        <Link href="/register" className="text-stone-800 dark:text-stone-200 underline">
          {t("login.goRegister")}
        </Link>
      </p>
    </form>
  );
}

export default function LoginPage() {
  return (
    <main className="flex flex-1 flex-col justify-center px-5 sm:px-4 py-16">
      <Suspense fallback={<p className="text-center text-stone-500 dark:text-stone-500">Loading…</p>}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
