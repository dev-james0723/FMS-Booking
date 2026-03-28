"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "@/lib/i18n/use-translation";
import { withBasePath } from "@/lib/base-path";

const VENUE_MAP_QUERY =
  "Room+10,+9%2FF,+Technology+Centre,+29-32+Sha+Tsui+Rd,+Tsuen+Wan,+Hong+Kong";

const MILLS_SHUTTLE_ZH = "https://www.themills.com.hk/visit-us/shuttle-bus/";
const MILLS_SHUTTLE_EN = "https://www.themills.com.hk/en/visit-us/shuttle-bus/";
const MILLS_PICKUP_MAP = "https://goo.gl/maps/j6dLCcDgUDrFudJu7";

const pillClass =
  "rounded-full border border-stone-200 bg-stone-50 px-2.5 py-0.5 text-[11px] font-medium text-stone-700 dark:border-stone-600 dark:bg-stone-800/80 dark:text-stone-200";

const cardClass =
  "flex flex-col gap-2 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm dark:border-stone-700 dark:bg-stone-900/40";

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

function PillRow({ text }: { text: string }) {
  const pills = text.split(",").map((s) => s.trim()).filter(Boolean);
  return (
    <div className="flex flex-wrap gap-1.5">
      {pills.map((p) => (
        <span key={p} className={pillClass}>
          {p}
        </span>
      ))}
    </div>
  );
}

function FantasiaVenueMap() {
  const { t, locale } = useTranslation();
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_API_KEY?.trim();
  const lang = locale === "en" ? "en" : "zh-HK";
  const embedSrc = useMemo(() => {
    if (!apiKey) return null;
    const q = encodeURIComponent(
      "10/F Room 10, Technology Centre, 29-32 Sha Tsui Road, Tsuen Wan, Hong Kong",
    );
    return `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${q}&zoom=17&language=${lang}`;
  }, [apiKey, lang]);

  const externalHref = `https://www.google.com/maps/search/?api=1&query=${VENUE_MAP_QUERY}`;

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

const REGION_IDS = ["TuenMun", "YuenLong", "TinShuiWai", "WongTaiSin", "HkIsland", "Shatin"] as const;

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
