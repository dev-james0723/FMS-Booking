"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function Form() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/dashboard";

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch("/api/v1/auth/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data?.error?.message ?? "更改失敗");
      setLoading(false);
      return;
    }
    router.push(next);
    router.refresh();
    setLoading(false);
  }

  return (
    <form
      onSubmit={onSubmit}
      className="mx-auto max-w-sm space-y-4 rounded-2xl border border-stone-200 bg-white p-8 shadow-sm"
    >
      <h1 className="font-serif text-2xl text-stone-900">更改密碼</h1>
      <p className="text-xs text-stone-600">
        為保障帳戶安全，首次登入須更改臨時密碼。新密碼至少 10 個字元。
      </p>
      {error && <p className="text-sm text-red-700">{error}</p>}
      <label className="block text-sm">
        目前密碼（臨時密碼）
        <input
          type="password"
          required
          className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
        />
      </label>
      <label className="block text-sm">
        新密碼
        <input
          type="password"
          required
          minLength={10}
          className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
      </label>
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-full bg-stone-900 py-2.5 text-sm text-white hover:bg-stone-800 disabled:opacity-50"
      >
        {loading ? "更新中…" : "確認更改"}
      </button>
    </form>
  );
}

export default function ChangePasswordPage() {
  return (
    <main className="flex flex-1 flex-col justify-center px-4 py-16">
      <Suspense fallback={<p className="text-center text-stone-500">載入中…</p>}>
        <Form />
      </Suspense>
    </main>
  );
}
