"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { PasskeySetupAfterResetModal } from "@/components/passkey-setup-after-reset-modal";
import { withBasePath } from "@/lib/base-path";
import { useTranslation } from "@/lib/i18n/use-translation";
import { safeNextPath } from "@/lib/safe-next-path";

type Channel = "email" | "phone";

function ForgotPasswordForm() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = safeNextPath(searchParams.get("next"), "/account");
  const loginTitle =
    next.includes("/open-space")
      ? t("login.titleOpenSpace")
      : next.startsWith("/booking")
        ? t("login.titlePianoStudio")
        : t("login.title");

  const [identifier, setIdentifier] = useState("");
  const [channel, setChannel] = useState<Channel>("email");
  const [step, setStep] = useState<"form" | "email_sent" | "sms_code" | "new_password">("form");
  const [phoneForVerify, setPhoneForVerify] = useState("");
  const [code, setCode] = useState("");
  const [smsResetToken, setSmsResetToken] = useState<string | null>(null);
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

  async function onStart(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(withBasePath("/api/v1/auth/forgot-password/start"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: identifier.trim(),
          channel,
          next,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(
          typeof data?.error?.message === "string" ? data.error.message : t("login.errNetwork")
        );
        setLoading(false);
        return;
      }
      if (channel === "email") {
        setStep("email_sent");
      } else {
        setPhoneForVerify(identifier.trim());
        setStep("sms_code");
      }
    } catch {
      setError(t("login.errNetwork"));
    } finally {
      setLoading(false);
    }
  }

  async function onVerifySms(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(withBasePath("/api/v1/auth/forgot-password/verify-phone"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: phoneForVerify.trim(),
          code: code.trim(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(
          typeof data?.error?.message === "string" ? data.error.message : t("login.errNetwork")
        );
        setLoading(false);
        return;
      }
      const tok = data?.smsResetToken;
      if (typeof tok !== "string") {
        setError(t("login.errServer"));
        setLoading(false);
        return;
      }
      setSmsResetToken(tok);
      setStep("new_password");
    } catch {
      setError(t("login.errNetwork"));
    } finally {
      setLoading(false);
    }
  }

  async function onSavePassword(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (newPassword !== confirmPassword) {
      setError(t("forgotPassword.errPasswordMismatch"));
      return;
    }
    if (!smsResetToken) {
      setError(t("login.errServer"));
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(withBasePath("/api/v1/auth/forgot-password/complete"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          smsResetToken,
          newPassword,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(
          typeof data?.error?.message === "string" ? data.error.message : t("login.errNetwork")
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

  return (
    <>
      <PasskeySetupAfterResetModal
        open={showPasskeyModal}
        passkeysSupported={passkeysSupported}
        onLater={finishToNext}
      />
      <div className="mx-auto max-w-sm space-y-4 rounded-2xl border border-stone-200 bg-surface p-8 shadow-sm dark:border-stone-700">
        <h1 className="font-serif text-2xl text-stone-900 dark:text-stone-50">
          {loginTitle} — {t("forgotPassword.title")}
        </h1>
        <p className="text-center text-xs">
          <Link
            href={`/login?next=${encodeURIComponent(next)}`}
            className="text-stone-600 underline dark:text-stone-400"
          >
            {t("forgotPassword.backToLogin")}
          </Link>
        </p>

        {step === "form" && (
          <form onSubmit={onStart} className="space-y-4">
            <p className="text-xs text-stone-500 dark:text-stone-500">{t("forgotPassword.identifierHint")}</p>
            {error && <p className="text-sm text-red-700 dark:text-red-400">{error}</p>}
            <label className="block text-sm">
              {t("forgotPassword.identifierLabel")}
              <input
                type="text"
                required
                autoComplete="username"
                className="mt-1 w-full rounded-lg border border-stone-300 bg-surface-input px-4 py-2 text-foreground dark:border-stone-700"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
              />
            </label>
            <fieldset className="space-y-2">
              <legend className="text-sm font-medium text-stone-800 dark:text-stone-200">
                {t("forgotPassword.channelLabel")}
              </legend>
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="channel"
                  checked={channel === "email"}
                  onChange={() => setChannel("email")}
                />
                {t("forgotPassword.channelEmail")}
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="channel"
                  checked={channel === "phone"}
                  onChange={() => setChannel("phone")}
                />
                {t("forgotPassword.channelPhone")}
              </label>
            </fieldset>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-stone-900 py-2.5 text-sm text-white hover:bg-stone-800 disabled:opacity-50 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-stone-200"
            >
              {loading ? t("forgotPassword.sending") : t("forgotPassword.submit")}
            </button>
          </form>
        )}

        {step === "email_sent" && (
          <div className="space-y-4 text-sm text-stone-700 dark:text-stone-300">
            <p>{t("forgotPassword.genericDone")}</p>
            <Link
              href={`/login?next=${encodeURIComponent(next)}`}
              className="block w-full rounded-full bg-stone-900 py-2.5 text-center text-white dark:bg-stone-100 dark:text-stone-900"
            >
              {t("forgotPassword.backToLogin")}
            </Link>
          </div>
        )}

        {step === "sms_code" && (
          <form onSubmit={onVerifySms} className="space-y-4">
            <h2 className="text-lg font-medium text-stone-900 dark:text-stone-50">
              {t("forgotPassword.stepCodeTitle")}
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-500">{t("forgotPassword.genericDone")}</p>
            {error && <p className="text-sm text-red-700 dark:text-red-400">{error}</p>}
            <label className="block text-sm">
              {t("forgotPassword.identifierLabel")}
              <input
                type="text"
                required
                inputMode="tel"
                autoComplete="tel"
                className="mt-1 w-full rounded-lg border border-stone-300 bg-surface-input px-4 py-2 dark:border-stone-700"
                value={phoneForVerify}
                onChange={(e) => setPhoneForVerify(e.target.value)}
              />
            </label>
            <label className="block text-sm">
              {t("forgotPassword.codeLabel")}
              <input
                type="text"
                required
                inputMode="numeric"
                pattern="\d{6}"
                maxLength={6}
                autoComplete="one-time-code"
                className="mt-1 w-full rounded-lg border border-stone-300 bg-surface-input px-4 py-2 tracking-widest dark:border-stone-700"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              />
            </label>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-stone-900 py-2.5 text-sm text-white hover:bg-stone-800 disabled:opacity-50 dark:bg-stone-100 dark:text-stone-900"
            >
              {loading ? t("forgotPassword.verifying") : t("forgotPassword.verifyCode")}
            </button>
          </form>
        )}

        {step === "new_password" && (
          <form onSubmit={onSavePassword} className="space-y-4">
            <h2 className="text-lg font-medium text-stone-900 dark:text-stone-50">
              {t("forgotPassword.newPasswordTitle")}
            </h2>
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
        )}
      </div>
    </>
  );
}

export default function ForgotPasswordPage() {
  const { t } = useTranslation();
  return (
    <main className="flex flex-1 flex-col justify-center px-5 py-16 sm:px-4">
      <Suspense
        fallback={<p className="text-center text-stone-500 dark:text-stone-500">{t("login.loading")}</p>}
      >
        <ForgotPasswordForm />
      </Suspense>
    </main>
  );
}
