"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { startAuthentication } from "@simplewebauthn/browser";
import { withBasePath } from "@/lib/base-path";
import { useTranslation } from "@/lib/i18n/use-translation";

function LoginForm() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/account";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [passkeyLoading, setPasskeyLoading] = useState(false);

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
      router.push(`/account/change-password?next=${encodeURIComponent(next)}`);
    } else {
      router.push(next);
    }
    router.refresh();
    setLoading(false);
  }

  async function onPasskeyLogin() {
    setError(null);
    if (!email.trim()) {
      setError(t("login.errEmailFirst"));
      return;
    }
    setPasskeyLoading(true);
    try {
      const optRes = await fetch(withBasePath("/api/v1/auth/passkey/login-options"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
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
          email: email.trim(),
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
        router.push(`/account/change-password?next=${encodeURIComponent(next)}`);
      } else {
        router.push(next);
      }
      router.refresh();
    } catch {
      setError(t("login.errNetwork"));
    } finally {
      setPasskeyLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-sm space-y-4 rounded-2xl border border-stone-200 dark:border-stone-700 bg-surface p-8 shadow-sm">
      <h1 className="font-serif text-2xl text-stone-900 dark:text-stone-50">{t("login.title")}</h1>
      <p className="text-xs text-stone-500 dark:text-stone-500">{t("login.hint")}</p>
      {error && (
        <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
      )}
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
      <div className="relative py-2 text-center text-xs text-stone-400 dark:text-stone-500 before:absolute before:inset-x-8 before:top-1/2 before:h-px before:bg-stone-200 dark:before:bg-stone-600">
        <span className="relative bg-surface px-2">{t("login.or")}</span>
      </div>
      <button
        type="button"
        disabled={passkeyLoading || loading || !email.trim()}
        onClick={() => void onPasskeyLogin()}
        className="w-full rounded-full border border-stone-300 dark:border-stone-600 bg-surface py-2.5 text-sm text-stone-800 dark:text-stone-200 hover:bg-stone-50 dark:hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {passkeyLoading ? t("login.passkeyVerifying") : t("login.passkey")}
      </button>
      <p className="text-center text-[11px] text-stone-500 dark:text-stone-500">
        {t("login.passkeyFootnote")}
      </p>
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
