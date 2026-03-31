import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import { cookies } from "next/headers";
import "./globals.css";
import { SiteChrome } from "@/components/site-chrome";
import { getSessionFromCookies } from "@/lib/auth/session";
import { localeFromCookieValue } from "@/lib/i18n/locale-cookie";
import { FMS_LOCALE_STORAGE_KEY } from "@/lib/i18n/types";

/** Avoid Prisma at build time when DB is unavailable (CI / local build without Postgres). */
export const dynamic = "force-dynamic";

/** Canonical origin for absolute URLs in metadata (Open Graph, etc.). */
function siteMetadataBase(): URL {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (appUrl) {
    try {
      const u = new URL(appUrl);
      return u;
    } catch {
      /* fall through */
    }
  }
  const vu = process.env.VERCEL_URL?.trim();
  if (vu) {
    const host = vu.replace(/^https?:\/\//, "").split("/")[0];
    return new URL(`https://${host}`);
  }
  return new URL("http://localhost:3000");
}

const defaultTitle = "D Festival × 幻樂空間｜限時免費琴室體驗預約";
const defaultDescription =
  "D Festival 青年鋼琴藝術節與 Fantasia Music Space 幻樂空間聯合企劃 — 登記、預約與禮遇一站式平台。";
/** Same asset as the home hero; explicit OG image so crawlers don’t pick partner logos above the fold. */
const ogImage = "/images/home/lead-grand-piano-studio.png";

/** Lets `env(safe-area-inset-*)` apply on notched devices (modal overlays, etc.). */
export const viewport: Viewport = {
  viewportFit: "cover",
};

export const metadata: Metadata = {
  metadataBase: siteMetadataBase(),
  title: defaultTitle,
  description: defaultDescription,
  openGraph: {
    title: defaultTitle,
    description: defaultDescription,
    type: "website",
    locale: "zh_HK",
    images: [
      {
        url: ogImage,
        width: 1024,
        height: 682,
        alt: "幻樂空間琴室 — 三角鋼琴與練習空間",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: defaultTitle,
    description: defaultDescription,
    images: [ogImage],
  },
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

  const session = await getSessionFromCookies();
  const initialSiteMeUser =
    session != null
      ? {
          email: session.email,
          bookingVenueKind:
            session.bookingVenueKind === "open_space" ? "open_space" : "studio_room",
        }
      : null;

  return (
    <html
      lang={htmlLang}
      suppressHydrationWarning
      className="h-full antialiased"
    >
      <head>
        {/* Inline in <head>: React 19 rejects next/script beforeInteractive in the body tree. */}
        <script
          id="fms-theme-init"
          dangerouslySetInnerHTML={{ __html: themeInitScript }}
          suppressHydrationWarning
        />
      </head>
      <body className="flex min-h-full flex-col bg-background font-sans text-foreground">
        <SiteChrome initialLocale={initialLocale} initialSiteMeUser={initialSiteMeUser}>
          {children}
        </SiteChrome>
        <Analytics />
      </body>
    </html>
  );
}
