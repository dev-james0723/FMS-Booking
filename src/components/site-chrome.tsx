"use client";

import { usePathname } from "next/navigation";
import { LocaleProvider } from "@/lib/i18n/locale-provider";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideMarketing = pathname.startsWith("/admin");

  return (
    <LocaleProvider>
      {!hideMarketing && <SiteHeader />}
      <div className="min-h-0 flex-1 bg-background">{children}</div>
      {!hideMarketing && <SiteFooter />}
    </LocaleProvider>
  );
}
