"use client";

import { withBasePath } from "@/lib/base-path";

export function LogoutButton() {
  async function logout() {
    await fetch(withBasePath("/api/v1/auth/logout"), { method: "POST" });
    window.location.href = withBasePath("/");
  }
  return (
    <button
      type="button"
      onClick={() => logout()}
      className="rounded-full border border-stone-300 dark:border-stone-600 px-6 py-2.5 text-sm text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800"
    >
      登出
    </button>
  );
}
