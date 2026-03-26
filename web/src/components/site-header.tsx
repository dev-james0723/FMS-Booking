"use client";

import Link from "next/link";
import { useState } from "react";

const btnOutline =
  "inline-flex min-h-[44px] items-center justify-center rounded-full border border-stone-300 px-4 py-2 text-sm text-stone-800 transition hover:border-stone-900 hover:bg-stone-50";
const btnSolid =
  "inline-flex min-h-[44px] items-center justify-center rounded-full bg-stone-900 px-4 py-2 text-sm text-white transition hover:bg-stone-800";
const linkPlain =
  "inline-flex min-h-[44px] items-center text-sm text-stone-600 transition hover:text-stone-900";

const homeAriaLabel = "限時免費琴室體驗申請（主頁）";

function HomeIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 10v10a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V10" />
    </svg>
  );
}

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <header className="border-b border-stone-200/80 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3 md:gap-4 md:py-4">
          <Link
            href="/"
            className="min-w-0 shrink font-serif text-base leading-tight tracking-tight text-stone-900 sm:text-lg"
          >
            <span className="block truncate sm:whitespace-normal">D Festival × 幻樂空間</span>
          </Link>

          <nav
            className="hidden md:flex md:items-center md:gap-3"
            aria-label="主選單（桌面）"
          >
            <Link href="/register" className={btnOutline}>
              登記資料及建立帳戶
            </Link>
            <Link href="/login?next=/booking" className={btnSolid}>
              預約系統登入
            </Link>
            <Link href="/faq" className={`${linkPlain} whitespace-nowrap`}>
              FAQ
            </Link>
            <Link href="/contact" className={`${linkPlain} whitespace-nowrap`}>
              聯絡
            </Link>
            <Link
              href="/"
              className="inline-flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-lg border border-stone-300 text-stone-800 transition hover:border-stone-900 hover:bg-stone-50"
              aria-label={homeAriaLabel}
            >
              <HomeIcon className="h-5 w-5" />
            </Link>
          </nav>

          <div className="flex shrink-0 items-center gap-1.5 md:hidden">
            <Link
              href="/"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-stone-300 text-stone-800 transition hover:border-stone-900 hover:bg-stone-50"
              aria-label={homeAriaLabel}
            >
              <HomeIcon className="h-4 w-4" />
            </Link>
            <button
              type="button"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-stone-300 text-stone-800"
              aria-expanded={menuOpen}
              aria-controls="site-mobile-nav"
              onClick={() => setMenuOpen((o) => !o)}
            >
              <span className="sr-only">{menuOpen ? "關閉選單" : "開啟選單"}</span>
              {menuOpen ? (
                <svg
                  className="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden
                >
                  <path d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg
                  className="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden
                >
                  <path d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        <div
          id="site-mobile-nav"
          hidden={!menuOpen}
          className="border-t border-stone-200 bg-white md:hidden"
        >
          <nav
            className="mx-auto flex max-w-5xl flex-col gap-2 px-4 py-3"
            aria-label="主選單（手機）"
          >
            <Link
              href="/register"
              className={`${btnOutline} w-full text-center`}
              onClick={() => setMenuOpen(false)}
            >
              登記資料及建立帳戶
            </Link>
            <Link
              href="/login?next=/booking"
              className={`${btnSolid} w-full text-center`}
              onClick={() => setMenuOpen(false)}
            >
              預約系統登入
            </Link>
            <div className="my-1 border-t border-stone-100 pt-2">
              <Link
                href="/faq"
                className={`${linkPlain} w-full justify-center py-2`}
                onClick={() => setMenuOpen(false)}
              >
                FAQ
              </Link>
              <Link
                href="/contact"
                className={`${linkPlain} w-full justify-center py-2`}
                onClick={() => setMenuOpen(false)}
              >
                聯絡
              </Link>
            </div>
          </nav>
        </div>
      </header>

      <div
        className="border-b border-[#2a1845] bg-gradient-to-r from-[#3d2463] via-[#4a2d75] to-[#3d2463] px-4 py-2.5 text-center text-sm font-medium leading-snug text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
        role="note"
      >
        所有使用者必須先完成資料登記及帳戶建立，方可進入預約系統。
      </div>
    </>
  );
}
