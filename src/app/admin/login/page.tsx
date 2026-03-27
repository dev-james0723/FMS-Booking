"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { withBasePath } from "@/lib/base-path";

function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/admin/bookings";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch(withBasePath("/api/v1/admin/auth/login"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
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
    router.push(next);
    router.refresh();
    setLoading(false);
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
          disabled={loading}
          className="w-full rounded-lg bg-white py-2.5 text-sm font-medium text-slate-900 hover:bg-slate-200 disabled:opacity-50"
        >
          {loading ? "登入中…" : "登入"}
        </button>
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
