"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { withBasePath } from "@/lib/base-path";

const desktopLinks = [
  { href: "/admin/users", label: "登記用戶" },
  { href: "/admin/bookings", label: "預約" },
  { href: "/admin/calendar", label: "日曆／時段" },
  { href: "/admin/control", label: "控制" },
];

const mobileLinks = [
  { href: "/admin/users", label: "登記用戶" },
  { href: "/admin/bookings", label: "預約" },
  {
    href: "/admin/calendar",
    label: "日曆／時段控制",
    activePrefixes: ["/admin/calendar", "/admin/control"],
  },
] as const;

function linkActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function HamburgerIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 22 22"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className="text-current"
    >
      <path
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        d={open ? "M5 5l12 12M17 5L5 17" : "M4 7h14M4 11h14M4 15h14"}
      />
    </svg>
  );
}

export function AdminNav() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setMenuOpen(false);
  }

  useEffect(() => {
    if (!menuOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    function onPointer(e: MouseEvent | PointerEvent) {
      const el = headerRef.current;
      if (el && !el.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [menuOpen]);

  if (pathname === "/admin/login") return null;

  async function logout() {
    setMenuOpen(false);
    await fetch(withBasePath("/api/v1/admin/auth/logout"), { method: "POST" });
    window.location.href = withBasePath("/admin/login");
  }

  return (
    <header
      ref={headerRef}
      className="relative border-b border-slate-800 bg-slate-950 text-slate-100"
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 sm:px-4 py-3">
        <Link
          href="/admin/bookings"
          className="min-w-0 flex-1 truncate font-semibold tracking-tight text-white md:flex-none"
        >
          後台 · D Festival × 幻樂空間
        </Link>

        <nav className="hidden items-center gap-4 text-sm md:flex" aria-label="後台主要選單">
          {desktopLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={
                linkActive(pathname, l.href) ? "text-white" : "text-slate-400 hover:text-white"
              }
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <button
          type="button"
          onClick={() => void logout()}
          className="hidden shrink-0 text-sm text-slate-400 hover:text-white md:block"
        >
          登出
        </button>

        <button
          type="button"
          className="flex shrink-0 items-center justify-center rounded-md p-2 text-slate-300 hover:bg-slate-800 hover:text-white md:hidden"
          aria-expanded={menuOpen}
          aria-controls="admin-mobile-menu"
          aria-label={menuOpen ? "關閉選單" : "開啟選單"}
          onClick={() => setMenuOpen((o) => !o)}
        >
          <HamburgerIcon open={menuOpen} />
        </button>
      </div>

      {menuOpen ? (
        <div
          id="admin-mobile-menu"
          className="absolute left-0 right-0 top-full z-50 border-b border-slate-800 bg-slate-950 shadow-lg md:hidden"
        >
          <nav className="mx-auto flex max-w-6xl flex-col px-5 py-2 text-sm" aria-label="後台選單">
            {mobileLinks.map((l) => {
              const active =
                "activePrefixes" in l
                  ? l.activePrefixes.some((p) => linkActive(pathname, p))
                  : linkActive(pathname, l.href);
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={
                    active
                      ? "rounded-md px-3 py-3 text-white"
                      : "rounded-md px-3 py-3 text-slate-400 hover:bg-slate-900 hover:text-white"
                  }
                  onClick={() => setMenuOpen(false)}
                >
                  {l.label}
                </Link>
              );
            })}
            <button
              type="button"
              onClick={() => void logout()}
              className="rounded-md px-3 py-3 text-left text-slate-400 hover:bg-slate-900 hover:text-white"
            >
              登出
            </button>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
