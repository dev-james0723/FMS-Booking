"use client";

import { usePathname } from "next/navigation";
import { SiteHeader } from "@/components/site-header";

export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideMarketing = pathname.startsWith("/admin");

  return (
    <>
      {!hideMarketing && <SiteHeader />}
      <div className="flex-1">{children}</div>
      {!hideMarketing && (
        <footer className="border-t border-stone-200/80 bg-white/80 py-8 text-center text-xs text-stone-500">
          © {new Date().getFullYear()} 香港幻樂國際音樂管理公司 · D Festival · 幻樂空間
        </footer>
      )}
    </>
  );
}
