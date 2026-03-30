"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { withBasePath } from "@/lib/base-path";
import { useTranslation } from "@/lib/i18n/use-translation";
import { safeNextPath } from "@/lib/safe-next-path";

function Form() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = safeNextPath(searchParams.get("next"), "/account");
  const { t } = useTranslation();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch(withBasePath("/api/v1/auth/change-password"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg =
        typeof data?.error?.message === "string" && data.error.message.trim()
          ? data.error.message
          : t("account.changePassword.genericError");
      setError(msg);
      setLoading(false);
      return;
    }
    router.refresh();
    router.push(next);
    setLoading(false);
  }

  return (
    <form
      onSubmit={onSubmit}
      className="mx-auto max-w-sm space-y-4 rounded-2xl border border-stone-200 dark:border-stone-700 bg-surface p-8 shadow-sm"
    >
      <h1 className="font-serif text-2xl text-stone-900 dark:text-stone-50">
        {t("account.changePassword.title")}
      </h1>
      <p className="text-xs text-stone-600 dark:text-stone-400">
        {t("account.changePassword.intro")}
      </p>
      {error && (
        <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
      )}
      <label className="block text-sm">
        {t("account.changePassword.currentLabel")}
        <input
          type="password"
          required
          className="mt-1 w-full rounded-lg border border-stone-300 bg-surface-input px-4 py-2 sm:px-3 text-foreground dark:border-stone-700"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
        />
      </label>
      <label className="block text-sm">
        {t("account.changePassword.newLabel")}
        <input
          type="password"
          required
          minLength={10}
          className="mt-1 w-full rounded-lg border border-stone-300 bg-surface-input px-4 py-2 sm:px-3 text-foreground dark:border-stone-700"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
      </label>
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-full bg-stone-900 py-2.5 text-sm text-white hover:bg-stone-800 disabled:opacity-50"
      >
        {loading ? t("account.changePassword.updating") : t("account.changePassword.submit")}
      </button>
    </form>
  );
}

export default function ChangePasswordPage() {
  const { t } = useTranslation();
  return (
    <main className="flex flex-1 flex-col justify-center px-5 sm:px-4 py-16">
      <Suspense
        fallback={
          <p className="text-center text-stone-500 dark:text-stone-500">{t("core.login.loading")}</p>
        }
      >
        <Form />
      </Suspense>
    </main>
  );
}
