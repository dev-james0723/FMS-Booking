"use client";

import { useCallback, useLayoutEffect, useState } from "react";
import { navIconButtonMd, navIconButtonSm } from "@/lib/nav-icon-button-classes";

function SunIcon({ className }: { className?: string }) {
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
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
}

function MoonIcon({ className }: { className?: string }) {
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
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

type Props = {
  size?: "md" | "sm";
  className?: string;
  /** Mobile drawer: square cell with icon + current mode label (light vs dark). */
  drawerSquareLabels?: { light: string; dark: string };
};

export function ThemeToggle({ size = "md", className = "", drawerSquareLabels }: Props) {
  const [isDark, setIsDark] = useState(false);

  useLayoutEffect(() => {
    const dark = document.documentElement.classList.contains("dark");
    queueMicrotask(() => setIsDark(dark));
  }, []);

  const toggle = useCallback(() => {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
    setIsDark(next);
  }, []);

  const shell =
    size === "sm"
      ? isDark
        ? navIconButtonSm.dark
        : navIconButtonSm.light
      : isDark
        ? navIconButtonMd.dark
        : navIconButtonMd.light;

  const iconClass = size === "sm" ? "h-4 w-4" : "h-5 w-5";

  if (drawerSquareLabels) {
    const modeLabel = isDark ? drawerSquareLabels.dark : drawerSquareLabels.light;
    return (
      <button
        type="button"
        suppressHydrationWarning
        className={`flex h-full w-full min-h-0 flex-col items-center justify-center gap-1 rounded-lg border border-stone-900 bg-transparent px-1 py-2 text-stone-800 transition hover:bg-stone-50 dark:border-stone-300 dark:text-stone-200 dark:hover:bg-stone-900/50 ${className}`.trim()}
        onClick={toggle}
        aria-label={modeLabel}
        title={modeLabel}
      >
        {isDark ? <SunIcon className="h-5 w-5 shrink-0" /> : <MoonIcon className="h-5 w-5 shrink-0" />}
        <span className="max-w-full truncate px-0.5 text-center text-[10px] font-medium leading-tight">
          {modeLabel}
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      suppressHydrationWarning
      className={`${shell} ${className}`.trim()}
      onClick={toggle}
      aria-label={isDark ? "切換至淺色模式（Demo）" : "切換至深色模式"}
      title={isDark ? "淺色模式" : "深色模式"}
    >
      {isDark ? <SunIcon className={iconClass} /> : <MoonIcon className={iconClass} />}
    </button>
  );
}
