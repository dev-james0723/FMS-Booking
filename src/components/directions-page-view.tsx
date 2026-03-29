"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useMemo, useState, type ComponentType } from "react";
import { useTranslation } from "@/lib/i18n/use-translation";
import { withBasePath } from "@/lib/base-path";

/** Google Maps search for the business listing (works more reliably than the raw street address). */
const VENUE_MAPS_SEARCH_QUERY = "Fantasia Music Space 幻樂空間 Tsuen Wan Hong Kong";

const MILLS_SHUTTLE_ZH = "https://www.themills.com.hk/visit-us/shuttle-bus/";
const MILLS_SHUTTLE_EN = "https://www.themills.com.hk/en/visit-us/shuttle-bus/";
const MILLS_PICKUP_MAP = "https://goo.gl/maps/j6dLCcDgUDrFudJu7";

const pillClass =
  "rounded-full border border-stone-200 bg-stone-50 px-2.5 py-0.5 text-[11px] font-medium text-stone-700 dark:border-stone-600 dark:bg-stone-800/80 dark:text-stone-200";

const cardClass =
  "flex flex-col gap-2 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm dark:border-stone-700 dark:bg-stone-900/40";

function googleMapsSearchUrl(query: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

function googleWalkingDirectionsUrl(origin: string, destination: string) {
  const p = new URLSearchParams({ api: "1", travelmode: "walking", origin, destination });
  return `https://www.google.com/maps/dir/?${p.toString()}`;
}

function wikimediaCommonsFileUrl(fileTitle: string) {
  return `https://commons.wikimedia.org/wiki/File:${fileTitle}`;
}

const QUICK_TRANSPORT_ENTRIES = [
  {
    title: "directions.quickMtrTitle",
    body: "directions.quickMtrBody",
    pills: "directions.quickMtrPills",
    image: "/images/directions-transport/mtr.jpg",
    altKey: "directions.quickMtrImageAlt",
    commonsFile: "MTR_R-Train_in_Kowloon_Tong_Station_(EAL).jpg",
    author: "Hoben7599",
    license: "CC BY 4.0",
  },
  {
    title: "directions.quickBusTitle",
    body: "directions.quickBusBody",
    pills: "directions.quickBusPills",
    image: "/images/directions-transport/bus.jpg",
    altKey: "directions.quickBusImageAlt",
    commonsFile: "KMB_Route_960_in_Hong_Kong_with_roof_visible_dllu.jpg",
    author: "Dllu",
    license: "CC BY-SA 4.0",
  },
  {
    title: "directions.quickMinibusTitle",
    body: "directions.quickMinibusBody",
    pills: "directions.quickMinibusPills",
    image: "/images/directions-transport/green-minibus.jpg",
    altKey: "directions.quickMinibusImageAlt",
    commonsFile: "Hong_Kong_Island_Green_Minibus_Route_25_at_Lai_Tak_Tsuen_Road_(Hong_Kong).jpg",
    author: "Mk2010",
    license: "CC BY-SA 4.0",
  },
  {
    title: "directions.quickDriveTitle",
    body: "directions.quickDriveBody",
    pills: "directions.quickDrivePills",
    image: "/images/directions-transport/driving.jpg",
    altKey: "directions.quickDriveImageAlt",
    commonsFile: "Tai_Lam_Tunnel_Entrance_2019.jpg",
    author: "Wpcpey",
    license: "CC BY-SA 4.0",
  },
] as const;

function TransportImageCredit({
  author,
  license,
  commonsFile,
  className,
}: {
  author: string;
  license: string;
  commonsFile: string;
  className?: string;
}) {
  const { t, tr } = useTranslation();
  return (
    <p className={className ?? "mt-1.5 text-[10px] leading-snug text-stone-500 dark:text-stone-400"}>
      <span>{tr("directions.transportPhotoCredit", { author, license })}</span>{" "}
      <Link
        href={wikimediaCommonsFileUrl(commonsFile)}
        target="_blank"
        rel="noopener noreferrer"
        className="font-medium text-violet-700 underline decoration-violet-300 underline-offset-2 hover:text-violet-900 dark:text-violet-300 dark:hover:text-violet-200"
      >
        {t("directions.transportPhotoFilePage")}
      </Link>
    </p>
  );
}

function IconBus({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden
    >
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M5 19h2M17 19h2M7 5V3h10v2" />
      <circle cx="8" cy="16" r="1.25" />
      <circle cx="16" cy="16" r="1.25" />
    </svg>
  );
}

function PillRow({ text, pillClassName = pillClass }: { text: string; pillClassName?: string }) {
  const pills = text.split(",").map((s) => s.trim()).filter(Boolean);
  return (
    <div className="flex flex-wrap gap-1.5">
      {pills.map((p) => (
        <span key={p} className={pillClassName}>
          {p}
        </span>
      ))}
    </div>
  );
}

const stopPillClass =
  "rounded-full border border-violet-200/90 bg-violet-50 px-2 py-0.5 text-[10px] font-medium text-violet-900 dark:border-violet-500/35 dark:bg-violet-950/45 dark:text-violet-100";

const minibusRoutePillEmerald =
  "rounded-full border border-emerald-200/90 bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-900 dark:border-emerald-500/35 dark:bg-emerald-950/50 dark:text-emerald-100";

const minibusRoutePillSky =
  "rounded-full border border-sky-200/90 bg-sky-50 px-2 py-0.5 text-[11px] font-medium text-sky-950 dark:border-sky-500/35 dark:bg-sky-950/50 dark:text-sky-100";

const minibusRoutePillAmber =
  "rounded-full border border-amber-200/90 bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-950 dark:border-amber-500/35 dark:bg-amber-950/45 dark:text-amber-100";

function IconMinibusNeighbourhood({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden
    >
      <path
        d="M12 21s7-4.5 7-11a7 7 0 1 0-14 0c0 6.5 7 11 7 11z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="10" r="2.25" />
    </svg>
  );
}

function IconMinibusCrossTown({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden
    >
      <path d="M5 12h14" strokeLinecap="round" />
      <path d="M9 8 5 12l4 4M15 8l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconMinibusAttention({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden
    >
      <path d="M12 6v5M12 17h.01" strokeLinecap="round" />
      <path d="M4.5 18.5 12 5l7.5 13.5H4.5z" strokeLinejoin="round" />
    </svg>
  );
}

function IconMtrConnection({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden
    >
      <rect x="4" y="14" width="16" height="6" rx="1.5" />
      <path d="M7 14V9a5 5 0 0 1 10 0v5" />
      <circle cx="9" cy="18" r="0.75" fill="currentColor" stroke="none" />
      <circle cx="15" cy="18" r="0.75" fill="currentColor" stroke="none" />
    </svg>
  );
}

function IconTocAddressPin({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden
    >
      <path
        d="M12 21s6-5.2 6-10a6 6 0 1 0-12 0c0 4.8 6 10 6 10z"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="11" r="2" />
    </svg>
  );
}

function IconTocMapPanel({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden
    >
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M8 9h8M8 13h5M8 17h8" strokeLinecap="round" />
      <circle cx="15" cy="8" r="1.25" fill="currentColor" stroke="none" />
    </svg>
  );
}

function IconTocQuickHub({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M12 5v2M12 17v2M5 12h2M17 12h2M7.3 7.3l1.4 1.4M15.3 15.3l1.4 1.4M7.3 16.7l1.4-1.4M15.3 8.7l1.4-1.4" strokeLinecap="round" />
    </svg>
  );
}

function IconTocMinibusGlyph({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden
    >
      <rect x="3" y="7" width="18" height="9" rx="2" />
      <path d="M6 16v2M18 16v2" strokeLinecap="round" />
      <circle cx="8" cy="17.5" r="1.15" fill="currentColor" stroke="none" />
      <circle cx="16" cy="17.5" r="1.15" fill="currentColor" stroke="none" />
    </svg>
  );
}

function IconTocDistrictGrid({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden
    >
      <rect x="4" y="4" width="6.5" height="6.5" rx="1" />
      <rect x="13.5" y="4" width="6.5" height="6.5" rx="1" />
      <rect x="4" y="13.5" width="6.5" height="6.5" rx="1" />
      <rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1" />
    </svg>
  );
}

function IconTocShuttleLoop({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden
    >
      <rect x="2" y="10" width="13" height="7" rx="1.5" />
      <path d="M15 12h3l2 2.5V17h-2" />
      <path d="M19 6a4 4 0 0 1-4 4" strokeLinecap="round" />
      <path d="M17 4l2 2-2 2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconTocInfo({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v6M12 8h.01" strokeLinecap="round" />
    </svg>
  );
}

type TocIconComponent = ComponentType<{ className?: string }>;

const DIRECTIONS_ONPAGE_TOC: readonly {
  hash: string;
  titleKey: string;
  Icon: TocIconComponent;
  iconWrapClass: string;
  tileClass: string;
}[] = [
  {
    hash: "directions-onpage-address",
    titleKey: "directions.addressLabel",
    Icon: IconTocAddressPin,
    iconWrapClass:
      "bg-violet-100 text-violet-800 dark:bg-violet-950/55 dark:text-violet-200",
    tileClass:
      "border-violet-200/80 bg-gradient-to-br from-violet-50/90 to-white hover:border-violet-300 dark:border-violet-500/25 dark:from-violet-950/35 dark:to-stone-900/30",
  },
  {
    hash: "directions-map-heading",
    titleKey: "directions.mapTitle",
    Icon: IconTocMapPanel,
    iconWrapClass: "bg-sky-100 text-sky-900 dark:bg-sky-950/50 dark:text-sky-100",
    tileClass:
      "border-sky-200/80 bg-gradient-to-br from-sky-50/80 to-white hover:border-sky-300 dark:border-sky-500/25 dark:from-sky-950/30 dark:to-stone-900/30",
  },
  {
    hash: "directions-quick-heading",
    titleKey: "directions.quickTitle",
    Icon: IconTocQuickHub,
    iconWrapClass:
      "bg-emerald-100 text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-100",
    tileClass:
      "border-emerald-200/80 bg-gradient-to-br from-emerald-50/80 to-white hover:border-emerald-300 dark:border-emerald-500/25 dark:from-emerald-950/30 dark:to-stone-900/30",
  },
  {
    hash: "directions-bus-heading",
    titleKey: "directions.busSectionTitle",
    Icon: IconBus,
    iconWrapClass: "bg-amber-100 text-amber-950 dark:bg-amber-950/45 dark:text-amber-100",
    tileClass:
      "border-amber-200/80 bg-gradient-to-br from-amber-50/70 to-white hover:border-amber-300 dark:border-amber-500/25 dark:from-amber-950/25 dark:to-stone-900/30",
  },
  {
    hash: "directions-gmb-heading",
    titleKey: "directions.minibusSectionTitle",
    Icon: IconTocMinibusGlyph,
    iconWrapClass:
      "bg-lime-100 text-lime-900 dark:bg-lime-950/40 dark:text-lime-100",
    tileClass:
      "border-lime-200/80 bg-gradient-to-br from-lime-50/70 to-white hover:border-lime-300 dark:border-lime-500/20 dark:from-lime-950/25 dark:to-stone-900/30",
  },
  {
    hash: "directions-regions-heading",
    titleKey: "directions.regionsTitle",
    Icon: IconTocDistrictGrid,
    iconWrapClass:
      "bg-fuchsia-100 text-fuchsia-900 dark:bg-fuchsia-950/45 dark:text-fuchsia-100",
    tileClass:
      "border-fuchsia-200/80 bg-gradient-to-br from-fuchsia-50/70 to-white hover:border-fuchsia-300 dark:border-fuchsia-500/25 dark:from-fuchsia-950/25 dark:to-stone-900/30",
  },
  {
    hash: "directions-mills-heading",
    titleKey: "directions.millsTitle",
    Icon: IconTocShuttleLoop,
    iconWrapClass:
      "bg-orange-100 text-orange-900 dark:bg-orange-950/45 dark:text-orange-100",
    tileClass:
      "border-orange-200/80 bg-gradient-to-br from-orange-50/70 to-white hover:border-orange-300 dark:border-orange-500/25 dark:from-orange-950/25 dark:to-stone-900/30",
  },
  {
    hash: "directions-footnote-heading",
    titleKey: "directions.footnoteTitle",
    Icon: IconTocInfo,
    iconWrapClass: "bg-stone-200 text-stone-800 dark:bg-stone-700 dark:text-stone-100",
    tileClass:
      "border-stone-200 bg-gradient-to-br from-stone-50/90 to-white hover:border-stone-300 dark:border-stone-600 dark:from-stone-800/50 dark:to-stone-900/30",
  },
];

function DirectionsOnPageToc() {
  const { t } = useTranslation();
  return (
    <nav
      className="mt-6 rounded-2xl border border-stone-200/90 bg-white/90 p-4 shadow-sm backdrop-blur-sm dark:border-stone-600 dark:bg-stone-900/50"
      aria-label={t("directions.tocNavAria")}
    >
      <p className="text-[11px] font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
        {t("directions.tocHeading")}
      </p>
      <ul className="mt-3 grid list-none grid-cols-2 gap-2 p-0 sm:grid-cols-4">
        {DIRECTIONS_ONPAGE_TOC.map(({ hash, titleKey, Icon, iconWrapClass, tileClass }) => (
          <li key={hash}>
            <a
              href={`#${hash}`}
              className={`flex min-h-[4.5rem] flex-col items-center justify-center gap-2 rounded-xl border px-2 py-3 text-center transition hover:shadow-md dark:hover:shadow-none ${tileClass}`}
            >
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full shadow-sm ${iconWrapClass}`}
              >
                <Icon className="h-5 w-5" />
              </span>
              <span className="line-clamp-2 text-[11px] font-semibold leading-snug text-stone-800 dark:text-stone-100">
                {t(titleKey)}
              </span>
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

const BUS_EXAMPLE_ROW_COUNT = 7;

const REGION_IDS = ["TuenMun", "YuenLong", "TinShuiWai", "WongTaiSin", "HkIsland", "Shatin"] as const;

type RegionId = (typeof REGION_IDS)[number];

/** Small horizontal arrow to the left of the Fantasia logo on district photos. */
function ArrowTowardFantasiaLogo({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 36 14"
      width={32}
      height={12}
      fill="none"
      aria-hidden
    >
      <path
        d="M2 7h24M26 7l-5-4M26 7l-5 4"
        stroke="currentColor"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const REGION_DISTRICT_PHOTOS: Record<RegionId, { image: string }> = {
  TuenMun: { image: "/images/directions-regions/tuen-mun.jpg" },
  YuenLong: { image: "/images/directions-regions/yuen-long.jpg" },
  TinShuiWai: { image: "/images/directions-regions/tin-shui-wai.jpg" },
  WongTaiSin: { image: "/images/directions-regions/wong-tai-sin.jpg" },
  HkIsland: { image: "/images/directions-regions/hong-kong-island.jpg" },
  Shatin: { image: "/images/directions-regions/sha-tin.jpg" },
};

function RegionRouteFigure({
  regionId,
  caption,
  imageAlt,
}: {
  regionId: RegionId;
  caption: string;
  imageAlt: string;
}) {
  const photo = REGION_DISTRICT_PHOTOS[regionId];

  return (
    <figure className="mt-3 overflow-hidden rounded-xl border border-stone-200/90 dark:border-stone-600/90">
      <div className="relative h-40 w-full sm:h-44">
        <Image
          src={withBasePath(photo.image)}
          alt={imageAlt}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 320px"
        />
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"
          aria-hidden
        />
        <div className="absolute bottom-2 right-2 flex items-center gap-1.5 rounded-lg border border-white/20 bg-black/50 py-1.5 pl-2 pr-1.5 shadow-md backdrop-blur-sm">
          <ArrowTowardFantasiaLogo className="shrink-0 text-white drop-shadow-[0_1px_2px_rgb(0_0_0/0.5)]" />
          <Image
            src={withBasePath("/branding/fantasia-music-space.webp")}
            alt=""
            width={40}
            height={40}
            className="h-10 w-10 object-contain"
          />
        </div>
      </div>
      <figcaption className="border-t border-stone-200/90 bg-stone-50/90 px-2.5 py-2 text-[10px] leading-snug text-stone-600 dark:border-stone-700 dark:bg-stone-900/80 dark:text-stone-400">
        <span className="block font-medium text-stone-800 dark:text-stone-200">{caption}</span>
      </figcaption>
    </figure>
  );
}

function FantasiaVenueMap() {
  const { t, locale } = useTranslation();
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_API_KEY?.trim();
  const lang = locale === "en" ? "en" : "zh-HK";
  const embedSrc = useMemo(() => {
    if (!apiKey) return null;
    const q = encodeURIComponent(VENUE_MAPS_SEARCH_QUERY);
    return `https://www.google.com/maps/embed/v1/search?key=${apiKey}&q=${q}&zoom=17&language=${lang}`;
  }, [apiKey, lang]);

  const externalHref = googleMapsSearchUrl(VENUE_MAPS_SEARCH_QUERY);

  return (
    <section className={`${cardClass} scroll-mt-24`} aria-labelledby="directions-map-heading">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 id="directions-map-heading" className="font-serif text-xl text-stone-900 dark:text-stone-50">
            {t("directions.mapTitle")}
          </h2>
          <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">{t("directions.mapLead")}</p>
        </div>
        <Link
          href={externalHref}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-medium text-violet-700 underline decoration-violet-300 underline-offset-2 hover:text-violet-900 dark:text-violet-300 dark:hover:text-violet-200"
        >
          {t("directions.openInGoogleMaps")}
        </Link>
      </div>
      <div className="mt-3 overflow-hidden rounded-xl border border-stone-200 bg-stone-100 dark:border-stone-600 dark:bg-stone-800">
        {embedSrc ? (
          <iframe
            title={t("directions.mapTitle")}
            className="aspect-[16/10] h-auto min-h-[220px] w-full border-0 sm:min-h-[280px]"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
            src={embedSrc}
          />
        ) : (
          <div className="flex aspect-[16/10] min-h-[200px] flex-col items-center justify-center gap-3 p-6 text-center">
            <p className="max-w-md text-sm text-stone-600 dark:text-stone-400">{t("directions.mapMissingKey")}</p>
            <Link
              href={externalHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center justify-center rounded-full bg-stone-900 px-5 text-sm font-medium text-white hover:bg-stone-800 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-white"
            >
              {t("directions.openInGoogleMaps")}
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}

function BusStopsSection() {
  const { t, locale } = useTranslation();
  const dest =
    locale === "en"
      ? "Fantasia Music Space, Tsuen Wan, Hong Kong"
      : "幻樂空間 Fantasia Music Space 荃灣";

  const origins =
    locale === "en"
      ? {
          primary: "Tsuen King Circuit Flyover Bus Stop, Tsuen Wan, Hong Kong",
          secondary: "Wing Hong House Fuk Loi Estate Bus Stop, Tsuen Wan, Hong Kong",
        }
      : {
          primary: "荃景圍天橋巴士站 香港荃灣",
          secondary: "福來邨永康樓巴士站 香港荃灣",
        };

  const walkPrimary = googleWalkingDirectionsUrl(origins.primary, dest);
  const walkSecondary = googleWalkingDirectionsUrl(origins.secondary, dest);

  return (
    <section className={`${cardClass} scroll-mt-24`} aria-labelledby="directions-bus-heading">
      <h2 id="directions-bus-heading" className="font-serif text-xl text-stone-900 dark:text-stone-50">
        {t("directions.busSectionTitle")}
      </h2>

      <div className="mt-2 grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-stone-200 bg-stone-50/80 p-3 dark:border-stone-600 dark:bg-stone-800/40">
          <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-50">{t("directions.busStopPrimaryTitle")}</h3>
          <p className="mt-1 text-xs leading-relaxed text-stone-600 dark:text-stone-400">{t("directions.busStopPrimaryNote")}</p>
          <p className="mt-2 text-xs font-medium text-stone-800 dark:text-stone-200">{t("directions.busStopPrimaryRoutes")}</p>
          <Link
            href={walkPrimary}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex min-h-10 w-full items-center justify-center rounded-full bg-violet-700 px-4 text-xs font-medium text-white hover:bg-violet-800 dark:bg-violet-600 dark:hover:bg-violet-500 sm:w-auto"
          >
            {t("directions.openWalkingDirections")}
          </Link>
        </div>
        <div className="rounded-xl border border-stone-200 bg-stone-50/80 p-3 dark:border-stone-600 dark:bg-stone-800/40">
          <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-50">{t("directions.busStopSecondaryTitle")}</h3>
          <p className="mt-1 text-xs leading-relaxed text-stone-600 dark:text-stone-400">{t("directions.busStopSecondaryNote")}</p>
          <p className="mt-2 text-xs font-medium text-stone-800 dark:text-stone-200">{t("directions.busStopSecondaryRoutes")}</p>
          <Link
            href={walkSecondary}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex min-h-10 w-full items-center justify-center rounded-full bg-violet-700 px-4 text-xs font-medium text-white hover:bg-violet-800 dark:bg-violet-600 dark:hover:bg-violet-500 sm:w-auto"
          >
            {t("directions.openWalkingDirections")}
          </Link>
        </div>
      </div>

      <div className="mt-4">
        <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-50">{t("directions.busExamplesTitle")}</h3>
        <p className="mt-1.5 text-xs leading-relaxed text-stone-600 dark:text-stone-400">{t("directions.busExamplesLead")}</p>
        <ul className="mt-3 grid list-none gap-2 p-0 sm:grid-cols-2" aria-label={t("directions.busExamplesTitle")}>
          {Array.from({ length: BUS_EXAMPLE_ROW_COUNT }, (_, i) => i + 1).map((n) => (
            <li
              key={n}
              className="flex flex-col gap-2 rounded-xl border border-stone-200 bg-white p-3 dark:border-stone-600 dark:bg-stone-900/30"
            >
              <div className="flex items-start justify-between gap-2 border-b border-stone-100 pb-2 dark:border-stone-700/80">
                <span className="text-sm font-semibold text-stone-900 dark:text-stone-50">
                  {t(`directions.busExRow${n}Area`)}
                </span>
                <IconBus className="h-5 w-5 shrink-0 text-stone-400 dark:text-stone-500" />
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400">
                  {t("directions.busExamplesRoutesLabel")}
                </p>
                <div className="mt-1">
                  <PillRow text={t(`directions.busExRow${n}Routes`)} />
                </div>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400">
                  {t("directions.busExamplesAlightLabel")}
                </p>
                <div className="mt-1">
                  <PillRow
                    text={t(`directions.busExRow${n}Stops`)}
                    pillClassName={stopPillClass}
                  />
                </div>
              </div>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-[11px] text-stone-500 dark:text-stone-400">{t("directions.busExamplesFootnote")}</p>
      </div>
    </section>
  );
}

function MinibusSection() {
  const { t } = useTranslation();
  return (
    <section className={`${cardClass} scroll-mt-24`} aria-labelledby="directions-gmb-heading">
      <h2 id="directions-gmb-heading" className="font-serif text-xl text-stone-900 dark:text-stone-50">
        {t("directions.minibusSectionTitle")}
      </h2>
      <p className="text-xs leading-relaxed text-stone-600 dark:text-stone-400">{t("directions.minibusSectionLead")}</p>

      <ul
        className="mt-4 grid list-none gap-3 p-0 sm:grid-cols-2"
        aria-label={t("directions.minibusSectionTitle")}
      >
        <li className="flex gap-3 rounded-xl border border-stone-200 border-l-4 border-l-emerald-500 bg-gradient-to-br from-white to-emerald-50/35 p-3.5 shadow-sm dark:border-stone-600 dark:border-l-emerald-500 dark:from-stone-900/50 dark:to-emerald-950/20">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800 dark:bg-emerald-950/55 dark:text-emerald-200">
            <IconMinibusNeighbourhood className="h-6 w-6" />
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-50">
              {t("directions.minibusCardLocalTitle")}
            </h3>
            <p className="mt-2 text-[10px] font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400">
              {t("directions.minibusCardRoutesLabel")}
            </p>
            <div className="mt-1">
              <PillRow text={t("directions.minibusCardLocalRoutes")} pillClassName={minibusRoutePillEmerald} />
            </div>
            <p className="mt-2 text-xs leading-relaxed text-stone-600 dark:text-stone-400">
              {t("directions.minibusCardLocalBody")}
            </p>
          </div>
        </li>

        <li className="flex gap-3 rounded-xl border border-stone-200 border-l-4 border-l-sky-500 bg-gradient-to-br from-white to-sky-50/40 p-3.5 shadow-sm dark:border-stone-600 dark:border-l-sky-500 dark:from-stone-900/50 dark:to-sky-950/25">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-900 dark:bg-sky-950/55 dark:text-sky-100">
            <IconMinibusCrossTown className="h-6 w-6" />
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-50">
              {t("directions.minibusCardShatinTitle")}
            </h3>
            <p className="mt-2 text-[10px] font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400">
              {t("directions.minibusCardRoutesLabel")}
            </p>
            <div className="mt-1">
              <PillRow text={t("directions.minibusCardShatinRoutes")} pillClassName={minibusRoutePillSky} />
            </div>
            <p className="mt-2 text-[10px] font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400">
              {t("directions.minibusCardShatinContextLabel")}
            </p>
            <div className="mt-1">
              <PillRow text={t("directions.minibusCardShatinPills")} pillClassName={minibusRoutePillSky} />
            </div>
            <p className="mt-2 text-xs leading-relaxed text-stone-600 dark:text-stone-400">
              {t("directions.minibusCardShatinBody")}
            </p>
          </div>
        </li>

        <li className="flex gap-3 rounded-xl border border-stone-200 border-l-4 border-l-amber-500 bg-gradient-to-br from-white to-amber-50/35 p-3.5 shadow-sm sm:col-span-2 dark:border-stone-600 dark:border-l-amber-500 dark:from-stone-900/50 dark:to-amber-950/20">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-900 dark:bg-amber-950/50 dark:text-amber-100">
            <IconMinibusAttention className="h-6 w-6" />
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-50">
              {t("directions.minibusCardPlbTitle")}
            </h3>
            <p className="mt-2 text-[10px] font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400">
              {t("directions.minibusCardPlbHintLabel")}
            </p>
            <div className="mt-1">
              <PillRow text={t("directions.minibusCardPlbPills")} pillClassName={minibusRoutePillAmber} />
            </div>
            <p className="mt-2 text-xs leading-relaxed text-stone-600 dark:text-stone-400">
              {t("directions.minibusCardPlbBody")}
            </p>
          </div>
        </li>
      </ul>

      <div className="mt-3 flex gap-3 rounded-xl border border-violet-200/90 border-l-4 border-l-violet-500 bg-gradient-to-br from-violet-50/70 to-white p-3.5 dark:border-violet-500/35 dark:border-l-violet-400 dark:from-violet-950/30 dark:to-stone-900/40">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-800 dark:bg-violet-950/55 dark:text-violet-200">
          <IconMtrConnection className="h-6 w-6" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-stone-900 dark:text-stone-50">
            {t("directions.minibusIslandCalloutTitle")}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-stone-600 dark:text-stone-400">
            {t("directions.minibusIslandCalloutBody")}
          </p>
        </div>
      </div>
    </section>
  );
}

export function DirectionsPageView() {
  const { t, locale } = useTranslation();
  const [copied, setCopied] = useState(false);
  const address = t("directions.addressFull");
  const millsShuttleUrl = locale === "en" ? MILLS_SHUTTLE_EN : MILLS_SHUTTLE_ZH;

  const copyAddress = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }, [address]);

  return (
    <main className="mx-auto max-w-5xl px-5 sm:px-4 py-12">
      <h1 className="font-serif text-3xl text-stone-900 dark:text-stone-50">{t("directions.pageTitle")}</h1>
      <p className="mt-3 max-w-3xl text-sm leading-relaxed text-stone-600 dark:text-stone-400">
        {t("directions.pageLead")}
      </p>

      <section
        id="directions-onpage-address"
        className="mt-8 scroll-mt-24"
        aria-label={t("directions.addressLabel")}
      >
        <div className="flex flex-col gap-3 rounded-2xl border border-violet-200/80 bg-violet-50/60 p-4 dark:border-violet-500/30 dark:bg-violet-950/25 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-violet-800 dark:text-violet-200">
              {t("directions.addressLabel")}
            </p>
            <p className="mt-1 text-sm font-medium text-stone-900 dark:text-stone-100">{address}</p>
          </div>
          <button
            type="button"
            onClick={copyAddress}
            className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-full border border-violet-400 bg-white px-4 text-sm font-medium text-violet-900 transition hover:bg-violet-50 dark:border-violet-500 dark:bg-violet-900/40 dark:text-violet-100 dark:hover:bg-violet-900/70"
          >
            {copied ? t("directions.copied") : t("directions.copyAddress")}
          </button>
        </div>
      </section>

      <DirectionsOnPageToc />

      <div className="mt-10 space-y-10">
        <FantasiaVenueMap />

        <section className="scroll-mt-24" aria-labelledby="directions-quick-heading">
          <h2 id="directions-quick-heading" className="font-serif text-xl text-stone-900 dark:text-stone-50">
            {t("directions.quickTitle")}
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {QUICK_TRANSPORT_ENTRIES.map((entry) => (
              <article
                key={entry.title}
                className="flex flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm dark:border-stone-700 dark:bg-stone-900/40"
              >
                <div className="relative aspect-[16/10] w-full shrink-0">
                  <Image
                    src={withBasePath(entry.image)}
                    alt={t(entry.altKey)}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 420px"
                  />
                </div>
                <div className="flex flex-col gap-2 p-4">
                  <h3 className="font-medium text-stone-900 dark:text-stone-50">{t(entry.title)}</h3>
                  <p className="text-xs leading-relaxed text-stone-600 dark:text-stone-400">{t(entry.body)}</p>
                  <PillRow text={t(entry.pills)} />
                  <TransportImageCredit author={entry.author} license={entry.license} commonsFile={entry.commonsFile} />
                </div>
              </article>
            ))}
          </div>
        </section>

        <BusStopsSection />

        <MinibusSection />

        <section className="scroll-mt-24" aria-labelledby="directions-regions-heading">
          <h2 id="directions-regions-heading" className="font-serif text-xl text-stone-900 dark:text-stone-50">
            {t("directions.regionsTitle")}
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {REGION_IDS.map((id) => (
              <div
                key={id}
                className={`${cardClass} border-t-4 border-t-violet-400/90 dark:border-t-violet-500/90`}
              >
                <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-50">
                  {t(`directions.region${id}Label`)}
                </h3>
                <PillRow text={t(`directions.region${id}Pills`)} />
                <p className="text-xs leading-relaxed text-stone-600 dark:text-stone-400">
                  {t(`directions.region${id}Detail`)}
                </p>
                <RegionRouteFigure
                  regionId={id}
                  caption={t(`directions.region${id}FigureCaption`)}
                  imageAlt={t(`directions.region${id}PhotoAlt`)}
                />
              </div>
            ))}
          </div>
        </section>

        <section className={`${cardClass} scroll-mt-24`} aria-labelledby="directions-mills-heading">
          <h2 id="directions-mills-heading" className="font-serif text-xl text-stone-900 dark:text-stone-50">
            {t("directions.millsTitle")}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-stone-600 dark:text-stone-400">{t("directions.millsLead")}</p>
          <p className="mt-3 rounded-lg border border-amber-200/90 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-950 dark:border-amber-700/50 dark:bg-amber-950/30 dark:text-amber-100">
            {t("directions.millsOppositeNote")}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href={millsShuttleUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-10 items-center justify-center rounded-full border border-stone-300 bg-stone-50 px-4 text-xs font-medium text-stone-800 hover:bg-stone-100 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-100 dark:hover:bg-stone-700"
            >
              {t("directions.millsOfficialShuttlePage")}
            </Link>
            <Link
              href={MILLS_PICKUP_MAP}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-10 items-center justify-center rounded-full border border-stone-300 bg-stone-50 px-4 text-xs font-medium text-stone-800 hover:bg-stone-100 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-100 dark:hover:bg-stone-700"
            >
              {t("directions.millsPickupMap")}
            </Link>
          </div>
          <div className="mt-3">
            <p className="text-xs font-medium text-stone-700 dark:text-stone-300">{t("directions.millsPickupTitle")}</p>
            <p className="mt-0.5 text-xs text-stone-600 dark:text-stone-400">{t("directions.millsPickupBody")}</p>
          </div>
          <figure className="mt-5 overflow-hidden rounded-xl border border-stone-200 dark:border-stone-700">
            <Image
              src={withBasePath("/images/the-mills-shuttle-schedule.jpg")}
              alt={t("directions.millsScheduleAlt")}
              width={1117}
              height={2089}
              className="h-auto w-full bg-white object-contain dark:bg-stone-950"
              sizes="(max-width: 1024px) 100vw, 896px"
            />
            <figcaption className="border-t border-stone-200 bg-stone-50 px-3 py-2 text-[11px] text-stone-500 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-400">
              {t("directions.millsScheduleCaption")}
              <span className="mt-1 block">{t("directions.millsScheduleCredit")}</span>
            </figcaption>
          </figure>
        </section>

        <section
          className="scroll-mt-24 rounded-xl border border-stone-200 bg-stone-50/80 px-4 py-3 dark:border-stone-700 dark:bg-stone-900/50"
          aria-labelledby="directions-footnote-heading"
        >
          <h2 id="directions-footnote-heading" className="text-xs font-semibold uppercase tracking-wider text-stone-500">
            {t("directions.footnoteTitle")}
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-stone-600 dark:text-stone-400">{t("directions.footnoteBody")}</p>
        </section>
      </div>
    </main>
  );
}
