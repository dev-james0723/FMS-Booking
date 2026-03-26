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
};

export function ThemeToggle({ size = "md", className = "" }: Props) {
  const [isDark, setIsDark] = useState(false);

  useLayoutEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
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
