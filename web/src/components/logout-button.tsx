"use client";

export function LogoutButton() {
  async function logout() {
    await fetch("/api/v1/auth/logout", { method: "POST" });
    window.location.href = "/";
  }
  return (
    <button
      type="button"
      onClick={() => logout()}
      className="rounded-full border border-stone-300 px-6 py-2.5 text-sm text-stone-700 hover:bg-stone-50"
    >
      登出
    </button>
  );
}
