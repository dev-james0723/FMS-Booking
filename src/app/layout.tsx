import type { Metadata } from "next";
import { cookies } from "next/headers";
import "./globals.css";
import { SiteChrome } from "@/components/site-chrome";
import { localeFromCookieValue } from "@/lib/i18n/locale-cookie";
import { FMS_LOCALE_STORAGE_KEY } from "@/lib/i18n/types";

/** Avoid Prisma at build time when DB is unavailable (CI / local build without Postgres). */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "D Festival × 幻樂空間｜限時免費琴室體驗預約",
  description:
    "D Festival 青年鋼琴藝術節與 Fantasia Music Space 幻樂空間聯合企劃 — 登記、預約與禮遇一站式平台。",
};

const themeInitScript = `(function(){try{var t=localStorage.getItem("theme");var d=false;if(t==="dark")d=true;else if(t!=="light")d=window.matchMedia("(prefers-color-scheme: dark)").matches;document.documentElement.classList.toggle("dark",d);}catch(e){}})();`;

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jar = await cookies();
  const initialLocale = localeFromCookieValue(jar.get(FMS_LOCALE_STORAGE_KEY)?.value);
  const htmlLang = initialLocale === "en" ? "en" : "zh-HK";

  return (
    <html
      lang={htmlLang}
      suppressHydrationWarning
      className="h-full antialiased"
    >
      <body className="flex min-h-full flex-col bg-background font-sans text-foreground">
        {/* Plain <script> in the server layout avoids React 19 warnings from next/script during hydration. */}
        <script
          id="fms-theme-init"
          dangerouslySetInnerHTML={{ __html: themeInitScript }}
          suppressHydrationWarning
        />
        <SiteChrome initialLocale={initialLocale}>{children}</SiteChrome>
      </body>
    </html>
  );
}
