"use client";

import { usePathname } from "next/navigation";
import { SiteHeader } from "@/components/site-header";

export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideMarketing = pathname.startsWith("/admin");

  return (
    <>
      {!hideMarketing && <SiteHeader />}
      <div className="min-h-0 flex-1 bg-background">{children}</div>
      {!hideMarketing && (
        <footer className="border-t border-stone-200 bg-[color:var(--chrome-bg)] py-8 text-center text-xs text-stone-500 backdrop-blur-md dark:border-stone-800 dark:text-stone-400">
          © {new Date().getFullYear()} 香港幻樂國際音樂管理公司 · D Festival · 幻樂空間
        </footer>
      )}
    </>
  );
}
