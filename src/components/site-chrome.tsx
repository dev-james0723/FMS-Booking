"use client";

import { Suspense } from "react";
import { usePathname } from "next/navigation";
import { LocaleProvider } from "@/lib/i18n/locale-provider";
import type { Locale } from "@/lib/i18n/types";
import { ReferralAmbassadorHost } from "@/components/referral-ambassador-host";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export function SiteChrome({
  children,
  initialLocale,
}: {
  children: React.ReactNode;
  initialLocale: Locale;
}) {
  const pathname = usePathname();
  const hideMarketing = pathname.startsWith("/admin");

  return (
    <LocaleProvider initialLocale={initialLocale}>
      {!hideMarketing && <SiteHeader />}
      {!hideMarketing && (
        <Suspense fallback={null}>
          <ReferralAmbassadorHost />
        </Suspense>
      )}
      <div className="min-h-0 flex-1 bg-background">{children}</div>
      {!hideMarketing && <SiteFooter />}
    </LocaleProvider>
  );
}
