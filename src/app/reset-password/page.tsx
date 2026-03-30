"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { PasskeySetupAfterResetModal } from "@/components/passkey-setup-after-reset-modal";
import { withBasePath } from "@/lib/base-path";
import { useTranslation } from "@/lib/i18n/use-translation";
import { safeNextPath } from "@/lib/safe-next-path";

function ResetPasswordForm() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = safeNextPath(searchParams.get("next"), "/account");
  const token = searchParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPasskeyModal, setShowPasskeyModal] = useState(false);
  const [passkeysSupported, setPasskeysSupported] = useState(false);

  useEffect(() => {
    setPasskeysSupported(
      typeof window !== "undefined" && typeof window.PublicKeyCredential !== "undefined"
    );
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!token || token.length < 32) {
      setError(t("forgotPassword.invalidLink"));
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(t("forgotPassword.errPasswordMismatch"));
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(withBasePath("/api/v1/auth/forgot-password/complete"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          emailToken: token,
          newPassword,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(
          typeof data?.error?.message === "string" ? data.error.message : t("forgotPassword.invalidLink")
        );
        setLoading(false);
        return;
      }
      if (passkeysSupported) {
        setShowPasskeyModal(true);
      } else {
        router.refresh();
        router.push(next);
      }
    } catch {
      setError(t("login.errNetwork"));
    } finally {
      setLoading(false);
    }
  }

  function finishToNext() {
    setShowPasskeyModal(false);
    router.refresh();
    router.push(next);
  }

  if (!token || token.length < 32) {
    return (
      <div className="mx-auto max-w-sm space-y-4 rounded-2xl border border-stone-200 bg-surface p-8 shadow-sm dark:border-stone-700">
        <h1 className="font-serif text-2xl text-stone-900 dark:text-stone-50">
          {t("forgotPassword.resetTitle")}
        </h1>
        <p className="text-sm text-red-700 dark:text-red-400">{t("forgotPassword.invalidLink")}</p>
        <Link
          href={`/forgot-password?next=${encodeURIComponent(next)}`}
          className="block w-full rounded-full bg-stone-900 py-2.5 text-center text-sm text-white dark:bg-stone-100 dark:text-stone-900"
        >
          {t("forgotPassword.title")}
        </Link>
      </div>
    );
  }

  return (
    <>
      <PasskeySetupAfterResetModal
        open={showPasskeyModal}
        passkeysSupported={passkeysSupported}
        onLater={finishToNext}
      />
      <form
        onSubmit={onSubmit}
        className="mx-auto max-w-sm space-y-4 rounded-2xl border border-stone-200 bg-surface p-8 shadow-sm dark:border-stone-700"
      >
        <h1 className="font-serif text-2xl text-stone-900 dark:text-stone-50">
          {t("forgotPassword.resetTitle")}
        </h1>
        <p className="text-center text-xs">
          <Link
            href={`/login?next=${encodeURIComponent(next)}`}
            className="text-stone-600 underline dark:text-stone-400"
          >
            {t("forgotPassword.backToLogin")}
          </Link>
        </p>
        {error && <p className="text-sm text-red-700 dark:text-red-400">{error}</p>}
        <label className="block text-sm">
          {t("forgotPassword.newPassword")}
          <input
            type="password"
            required
            minLength={10}
            maxLength={128}
            autoComplete="new-password"
            className="mt-1 w-full rounded-lg border border-stone-300 bg-surface-input px-4 py-2 dark:border-stone-700"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
        </label>
        <label className="block text-sm">
          {t("forgotPassword.confirmPassword")}
          <input
            type="password"
            required
            minLength={10}
            maxLength={128}
            autoComplete="new-password"
            className="mt-1 w-full rounded-lg border border-stone-300 bg-surface-input px-4 py-2 dark:border-stone-700"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </label>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-stone-900 py-2.5 text-sm text-white hover:bg-stone-800 disabled:opacity-50 dark:bg-stone-100 dark:text-stone-900"
        >
          {loading ? t("forgotPassword.saving") : t("forgotPassword.savePassword")}
        </button>
      </form>
    </>
  );
}

export default function ResetPasswordPage() {
  const { t } = useTranslation();
  return (
    <main className="flex flex-1 flex-col justify-center px-5 py-16 sm:px-4">
      <Suspense
        fallback={<p className="text-center text-stone-500 dark:text-stone-500">{t("login.loading")}</p>}
      >
        <ResetPasswordForm />
      </Suspense>
    </main>
  );
}
