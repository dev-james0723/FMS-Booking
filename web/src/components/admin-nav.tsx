"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { withBasePath } from "@/lib/base-path";

const links = [
  { href: "/admin/users", label: "登記用戶" },
  { href: "/admin/bookings", label: "預約申請" },
  { href: "/admin/calendar", label: "日曆／時段" },
];

export function AdminNav() {
  const pathname = usePathname();
  if (pathname === "/admin/login") return null;

  async function logout() {
    await fetch(withBasePath("/api/v1/admin/auth/logout"), { method: "POST" });
    window.location.href = withBasePath("/admin/login");
  }

  return (
    <header className="border-b border-slate-800 bg-slate-950 text-slate-100">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-3">
        <div className="flex items-center gap-6">
          <Link href="/admin/bookings" className="font-semibold tracking-tight text-white">
            後台 · D Festival × 幻樂空間
          </Link>
          <nav className="flex gap-4 text-sm">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={
                  pathname === l.href || pathname.startsWith(l.href + "/")
                    ? "text-white"
                    : "text-slate-400 hover:text-white"
                }
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
        <button
          type="button"
          onClick={() => void logout()}
          className="text-sm text-slate-400 hover:text-white"
        >
          登出
        </button>
      </div>
    </header>
  );
}
