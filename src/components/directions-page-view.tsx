"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
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

function IconMtr({ className }: { className?: string }) {
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

function IconMinibus({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden
    >
      <rect x="3" y="6" width="18" height="11" rx="2" />
      <path d="M6 17h12" />
      <circle cx="8" cy="17.5" r="1" />
      <circle cx="16" cy="17.5" r="1" />
    </svg>
  );
}

function IconCar({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden
    >
      <path d="M5 17h14l-1-5H6l-1 5zM7 12l1-4h8l1 4" />
      <circle cx="8.5" cy="17" r="1.25" />
      <circle cx="15.5" cy="17" r="1.25" />
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

const BUS_EXAMPLE_ROW_COUNT = 7;

const REGION_IDS = ["TuenMun", "YuenLong", "TinShuiWai", "WongTaiSin", "HkIsland", "Shatin"] as const;

type RegionId = (typeof REGION_IDS)[number];

/** Local copies of Wikimedia Commons photos (see each `commonsPage` for licence). */
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

const REGION_DISTRICT_PHOTOS: Record<
  RegionId,
  { image: string; commonsPage: string; attribution: string }
> = {
  TuenMun: {
    image: "/images/directions-regions/tuen-mun.jpg",
    commonsPage: "https://commons.wikimedia.org/wiki/File:Tuen_Mun_Dusk_View_2013.jpg",
    attribution: "Eddie Yip — CC BY-SA 3.0",
  },
  YuenLong: {
    image: "/images/directions-regions/yuen-long.jpg",
    commonsPage:
      "https://commons.wikimedia.org/wiki/File:HK_Yuen_Long_Town_Centre_%E5%85%83%E6%9C%97%E5%B8%82%E4%B8%AD%E5%BF%83_Sunday_02.jpg",
    attribution: "Bladezcafo — CC BY-SA 3.0",
  },
  TinShuiWai: {
    image: "/images/directions-regions/tin-shui-wai.jpg",
    commonsPage: "https://commons.wikimedia.org/wiki/File:Tin_Shui_Wai_Nullah.jpg",
    attribution: "Baycrest — CC BY-SA 2.5",
  },
  WongTaiSin: {
    image: "/images/directions-regions/wong-tai-sin.jpg",
    commonsPage:
      "https://commons.wikimedia.org/wiki/File:2024-12-28_View_of_Wong_Tai_Sin_District_from_Fei_Ngo_Shan_Road.jpg",
    attribution: "Alexkom000 — CC BY 4.0",
  },
  HkIsland: {
    image: "/images/directions-regions/hong-kong-island.jpg",
    commonsPage: "https://commons.wikimedia.org/wiki/File:Victoria_Harbour_skyscrapers.jpg",
    attribution: "Wilfredor — CC0 1.0",
  },
  Shatin: {
    image: "/images/directions-regions/sha-tin.jpg",
    commonsPage:
      "https://commons.wikimedia.org/wiki/File:Sha_Tin_Hoi_and_Ma_On_Shan_from_Mong_Man_Wai_Building,_CUHK.jpg",
    attribution: "Jonashtand — CC BY-SA 4.0",
  },
};

function RegionRouteFigure({
  regionId,
  caption,
  imageAlt,
  creditPrefix,
  creditLinkLabel,
}: {
  regionId: RegionId;
  caption: string;
  imageAlt: string;
  creditPrefix: string;
  creditLinkLabel: string;
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
      <figcaption className="space-y-1 border-t border-stone-200/90 bg-stone-50/90 px-2.5 py-2 text-[10px] leading-snug text-stone-600 dark:border-stone-700 dark:bg-stone-900/80 dark:text-stone-400">
        <span className="block font-medium text-stone-800 dark:text-stone-200">{caption}</span>
        <span className="block">
          {creditPrefix}{" "}
          <Link
            href={photo.commonsPage}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-violet-700 underline decoration-violet-300 underline-offset-2 hover:text-violet-900 dark:text-violet-300 dark:hover:text-violet-200"
          >
            {creditLinkLabel}
          </Link>
          <span className="text-stone-500 dark:text-stone-500"> — {photo.attribution}</span>
        </span>
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
    <section className={cardClass} aria-labelledby="directions-map-heading">
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
    <section className={cardClass} aria-labelledby="directions-bus-heading">
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
    <section className={cardClass} aria-labelledby="directions-gmb-heading">
      <h2 id="directions-gmb-heading" className="font-serif text-xl text-stone-900 dark:text-stone-50">
        {t("directions.minibusSectionTitle")}
      </h2>
      <p className="text-xs leading-relaxed text-stone-600 dark:text-stone-400">{t("directions.minibusSectionLead")}</p>
      <p className="mt-2 whitespace-pre-line text-xs leading-relaxed text-stone-600 dark:text-stone-400">
        {t("directions.minibusRoutesBody")}
      </p>
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

  const quick = useMemo(
    () =>
      [
        { icon: IconMtr, title: t("directions.quickMtrTitle"), body: t("directions.quickMtrBody"), pills: t("directions.quickMtrPills") },
        { icon: IconBus, title: t("directions.quickBusTitle"), body: t("directions.quickBusBody"), pills: t("directions.quickBusPills") },
        {
          icon: IconMinibus,
          title: t("directions.quickMinibusTitle"),
          body: t("directions.quickMinibusBody"),
          pills: t("directions.quickMinibusPills"),
        },
        { icon: IconCar, title: t("directions.quickDriveTitle"), body: t("directions.quickDriveBody"), pills: t("directions.quickDrivePills") },
      ] as const,
    [t],
  );

  return (
    <main className="mx-auto max-w-5xl px-5 sm:px-4 py-12">
      <h1 className="font-serif text-3xl text-stone-900 dark:text-stone-50">{t("directions.pageTitle")}</h1>
      <p className="mt-3 max-w-3xl text-sm leading-relaxed text-stone-600 dark:text-stone-400">
        {t("directions.pageLead")}
      </p>

      <div className="mt-8 flex flex-col gap-3 rounded-2xl border border-violet-200/80 bg-violet-50/60 p-4 dark:border-violet-500/30 dark:bg-violet-950/25 sm:flex-row sm:items-center sm:justify-between">
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

      <div className="mt-10 space-y-10">
        <FantasiaVenueMap />

        <section aria-labelledby="directions-quick-heading">
          <h2 id="directions-quick-heading" className="font-serif text-xl text-stone-900 dark:text-stone-50">
            {t("directions.quickTitle")}
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {quick.map(({ icon: Icon, title, body, pills }) => (
              <div key={title} className={cardClass}>
                <div className="flex items-start gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-200">
                    <Icon className="h-6 w-6" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-medium text-stone-900 dark:text-stone-50">{title}</h3>
                    <p className="mt-1 text-xs leading-relaxed text-stone-600 dark:text-stone-400">{body}</p>
                    <div className="mt-2">
                      <PillRow text={pills} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <BusStopsSection />

        <MinibusSection />

        <section aria-labelledby="directions-regions-heading">
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
                  creditPrefix={t("directions.regionsPhotoCreditPrefix")}
                  creditLinkLabel={t("directions.regionsPhotoCreditLinkLabel")}
                />
              </div>
            ))}
          </div>
        </section>

        <section className={cardClass} aria-labelledby="directions-mills-heading">
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
          className="rounded-xl border border-stone-200 bg-stone-50/80 px-4 py-3 dark:border-stone-700 dark:bg-stone-900/50"
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
