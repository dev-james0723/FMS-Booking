"use client";

import Image from "next/image";
import {
  Fragment,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { GeorgeLiPortraitGallery } from "@/components/about-d-festival/george-li-portrait-gallery";
import { useTranslation } from "@/lib/i18n/use-translation";

const ART_MATE_TICKETS_URL = "https://www.art-mate.net/doc/94210";
/** GMC Music Hong Kong — official social (@gmcmusichk); update if the page URL changes. */
const GMC_MUSIC_FACEBOOK_URL = "https://www.facebook.com/gmcmusichk";

/** Scroll-to-section: pause before the “projection screen” lowers. */
const BIO_SCROLL_REVEAL_DELAY_MS = 1500;
/** Curtain clip-path duration — keep slow for a cinematic read. */
const BIO_CURTAIN_DURATION_MS = 3200;

type VideoCaptionVariant = "tchaikovsky" | "tippet" | "carnegie" | "dfestival";

const VIDEO_VARIANT_UI: Record<
  VideoCaptionVariant,
  {
    bar: string;
    panel: string;
    stripe: string;
    divider: string;
    iconWrap: string;
    secondaryRule: string;
  }
> = {
  tchaikovsky: {
    bar: "from-amber-500 via-amber-600 to-orange-700 dark:from-amber-400 dark:via-amber-500 dark:to-orange-700",
    panel:
      "bg-gradient-to-br from-amber-100/90 via-stone-50 to-orange-50/50 dark:from-amber-950/50 dark:via-stone-900 dark:to-stone-950",
    stripe: "rgba(180, 83, 9, 0.042)",
    divider: "border-amber-900/[0.07] dark:border-amber-100/[0.1]",
    iconWrap:
      "bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-md ring-2 ring-amber-300/45 dark:from-amber-400 dark:to-orange-600 dark:ring-amber-200/30",
    secondaryRule: "border-amber-600/50 dark:border-amber-400/50",
  },
  tippet: {
    bar: "from-emerald-500 via-teal-600 to-cyan-800 dark:from-emerald-400 dark:via-teal-500 dark:to-cyan-800",
    panel:
      "bg-gradient-to-br from-emerald-50/95 via-stone-50 to-teal-50/45 dark:from-emerald-950/45 dark:via-stone-900 dark:to-stone-950",
    stripe: "rgba(13, 148, 136, 0.055)",
    divider: "border-teal-900/[0.08] dark:border-teal-100/[0.09]",
    iconWrap:
      "bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md ring-2 ring-emerald-300/40 dark:from-emerald-400 dark:to-teal-600 dark:ring-emerald-200/28",
    secondaryRule: "border-teal-600/50 dark:border-teal-400/50",
  },
  carnegie: {
    bar: "from-violet-500 via-purple-600 to-indigo-800 dark:from-violet-400 dark:via-purple-500 dark:to-indigo-900",
    panel:
      "bg-gradient-to-br from-violet-50/95 via-stone-50 to-purple-50/45 dark:from-violet-950/45 dark:via-stone-900 dark:to-stone-950",
    stripe: "rgba(124, 58, 237, 0.045)",
    divider: "border-violet-900/[0.07] dark:border-violet-100/[0.09]",
    iconWrap:
      "bg-gradient-to-br from-violet-500 to-indigo-700 text-white shadow-md ring-2 ring-violet-300/40 dark:from-violet-400 dark:to-indigo-700 dark:ring-violet-200/28",
    secondaryRule: "border-violet-600/50 dark:border-violet-400/50",
  },
  dfestival: {
    bar: "from-rose-500 via-fuchsia-600 to-purple-900 dark:from-rose-400 dark:via-fuchsia-500 dark:to-purple-950",
    panel:
      "bg-gradient-to-br from-rose-50/92 via-stone-50 to-fuchsia-50/40 dark:from-rose-950/38 dark:via-stone-900 dark:to-stone-950",
    stripe: "rgba(192, 38, 211, 0.042)",
    divider: "border-fuchsia-900/[0.07] dark:border-fuchsia-100/[0.09]",
    iconWrap:
      "bg-gradient-to-br from-rose-500 to-fuchsia-700 text-white shadow-md ring-2 ring-rose-300/40 dark:from-rose-400 dark:to-fuchsia-700 dark:ring-rose-200/28",
    secondaryRule: "border-rose-600/45 dark:border-fuchsia-400/48",
  },
};

function IconTrophy({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M8 21h8M12 17v4M7 4h10v3a5 5 0 0 1-10 0V4Z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7 6H5a2 2 0 0 0 0 4h2M17 6h2a2 2 0 0 1 0 4h-2" strokeLinecap="round" />
    </svg>
  );
}

function IconMountain({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="m4 18 5-8 4 6 3-5 4 7H4Z" strokeLinejoin="round" />
    </svg>
  );
}

function IconHall({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M12 3 4 9v11h16V9l-8-6Z" strokeLinejoin="round" />
      <path d="M9 22v-6h6v6M9 13h6" strokeLinecap="round" />
    </svg>
  );
}

function IconMic({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M12 14a3 3 0 0 0 3-3V5a3 3 0 1 0-6 0v6a3 3 0 0 0 3 3Z" strokeLinejoin="round" />
      <path d="M19 10v1a7 7 0 0 1-14 0v-1M12 18v4M8 22h8" strokeLinecap="round" />
    </svg>
  );
}

function VideoVariantIcon({ variant }: { variant: VideoCaptionVariant }) {
  const cls = "h-[1.35rem] w-[1.35rem]";
  switch (variant) {
    case "tchaikovsky":
      return <IconTrophy className={cls} />;
    case "tippet":
      return <IconMountain className={cls} />;
    case "carnegie":
      return <IconHall className={cls} />;
    default:
      return <IconMic className={cls} />;
  }
}

/** Captions informed by each video’s YouTube title / uploader (oEmbed). */
const VIDEOS_BELOW_POSTER = [
  {
    variant: "tchaikovsky" as const,
    embedSrc: "https://www.youtube.com/embed/OkpRZr7Psak",
    iframeTitle: "George Li — Liszt La Campanella (Tchaikovsky Competition 2015)",
    captionZh:
      "第十五屆柴可夫斯基國際鋼琴比賽（2015，莫斯科）｜李斯特《鐘》La Campanella — 賽事演出片段",
    captionEn:
      "15th International Tchaikovsky Competition (2015) — Liszt’s La Campanella.",
  },
  {
    variant: "tippet" as const,
    embedSrc: "https://www.youtube.com/embed/s1wjKF0_kRc",
    iframeTitle: "George Li plays Liszt Hungarian Rhapsody No. 2 — Tippet Rise Art Center",
    captionZh:
      "美國蒙大拿州堤頓山藝術中心（Tippet Rise Art Center）現場｜李斯特《匈牙利狂想曲第二號》",
    captionEn:
      "Live at Tippet Rise Art Center, Montana, USA — Liszt’s Hungarian Rhapsody No. 2.",
  },
] as const;

const VIDEOS_ABOVE_COPY = [
  {
    variant: "carnegie" as const,
    embedSrc: "https://www.youtube.com/embed/lSMJ1gGOzhU",
    iframeTitle: "George Li: Live from Carnegie Hall (age 11)",
    captionZh: "官方頻道紀錄：11 歲於紐約卡內基音樂廳（Carnegie Hall）的演出精華",
    captionEn: "From George Li’s channel: highlights from Carnegie Hall, New York, at age 11.",
  },
  {
    variant: "dfestival" as const,
    embedSrc: "https://www.youtube.com/embed/1sLeS3TFCeE?start=48",
    iframeTitle: "D Festival Meet The Masters Series — featuring George Li",
    captionZh:
      "D Festival「與大師相遇 Meet The Masters」系列｜黎卓宇分享古典音樂世界和在美國白宮演出經歷",
    captionEn:
      "D Festival’s “Meet The Masters” — George Li on the classical music world and performing at the White House.",
  },
] as const;

const ALL_RECITAL_VIDEOS = [...VIDEOS_BELOW_POSTER, ...VIDEOS_ABOVE_COPY];

/** Same rhythm between every pair of video blocks (and before the article below the stack). */
const RECITAL_VIDEO_STACK_DIVIDER_CLASSNAME =
  "mt-9 border-t border-stone-200/85 pt-9 dark:border-stone-600/60 sm:mt-11 sm:pt-11";

function RecitalVideoStackDivider() {
  return <div className={RECITAL_VIDEO_STACK_DIVIDER_CLASSNAME} aria-hidden />;
}

function splitVideoCaption(caption: string, locale: string): { primary: string; secondary?: string } {
  if (locale === "en") {
    const em = caption.split(" — ");
    if (em.length >= 2) {
      return { primary: em[0]!.trim(), secondary: em.slice(1).join(" — ").trim() };
    }
    const colon = caption.indexOf(": ");
    if (colon !== -1) {
      return { primary: caption.slice(0, colon + 1).trim(), secondary: caption.slice(colon + 2).trim() };
    }
    return { primary: caption };
  }
  const pipe = caption.indexOf("｜");
  if (pipe !== -1) {
    return { primary: caption.slice(0, pipe).trim(), secondary: caption.slice(pipe + 1).trim() };
  }
  const colon = caption.indexOf("：");
  if (colon !== -1) {
    return { primary: caption.slice(0, colon + 1).trim(), secondary: caption.slice(colon + 1).trim() };
  }
  return { primary: caption };
}

function VideoEmbedBlock({
  variant,
  embedSrc,
  iframeTitle,
  captionZh,
  captionEn,
  locale,
  index,
}: {
  variant: VideoCaptionVariant;
  embedSrc: string;
  iframeTitle: string;
  captionZh: string;
  captionEn: string;
  locale: string;
  index: number;
}) {
  const caption = locale === "en" ? captionEn : captionZh;
  const { primary, secondary } = splitVideoCaption(caption, locale);
  const ui = VIDEO_VARIANT_UI[variant];

  return (
    <div className="relative">
      {index > 1 ? (
        <div
          className="absolute left-[1.625rem] top-0 z-0 hidden h-5 w-0 -translate-x-1/2 -translate-y-full sm:left-[1.875rem] sm:block"
          aria-hidden
        >
          <div className="mx-auto h-full w-px bg-gradient-to-t from-stone-400/55 via-stone-300/40 to-transparent dark:from-stone-500/45 dark:via-stone-600/35" />
          <div className="absolute left-1/2 top-0 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-stone-400/65 ring-2 ring-stone-200/90 dark:bg-stone-500 dark:ring-stone-700" />
        </div>
      ) : null}
      <div className="relative overflow-hidden rounded-xl border border-stone-200/90 shadow-md ring-1 ring-stone-900/[0.04] dark:border-stone-600 dark:ring-stone-100/[0.05]">
        <div className={`relative ${ui.panel}`}>
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.55] dark:opacity-[0.35]"
            style={{
              backgroundImage: `repeating-linear-gradient(-52deg, transparent, transparent 7px, ${ui.stripe} 7px, ${ui.stripe} 8px)`,
            }}
            aria-hidden
          />
          <div
            className={`relative flex gap-3 border-b px-3 py-3 sm:gap-4 sm:px-4 sm:py-3.5 ${ui.divider}`}
          >
            <div className={`absolute bottom-0 left-0 top-0 w-[3px] bg-gradient-to-b ${ui.bar}`} aria-hidden />
            <div className="relative flex shrink-0 items-start pl-1 pt-0.5 sm:pl-1.5">
              <span
                className={`flex h-11 w-11 items-center justify-center rounded-xl sm:h-12 sm:w-12 ${ui.iconWrap}`}
              >
                <VideoVariantIcon variant={variant} />
              </span>
            </div>
            <div className="relative min-w-0 flex-1 pt-0.5 text-left">
              <p className="font-serif text-[0.9375rem] font-semibold leading-snug tracking-tight text-stone-900 dark:text-stone-50 sm:text-base">
                {primary}
              </p>
              {secondary ? (
                <p
                  className={`mt-2 border-l-[3px] pl-3 text-[13px] leading-relaxed text-stone-700 dark:text-stone-300 sm:text-sm ${ui.secondaryRule}`}
                >
                  {secondary}
                </p>
              ) : null}
            </div>
          </div>
        </div>
        <div className="relative bg-gradient-to-b from-stone-900 to-black p-1.5 sm:p-2">
          <div
            className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent"
            aria-hidden
          />
          <div className="relative aspect-video w-full overflow-hidden rounded-md bg-black shadow-[inset_0_2px_14px_rgba(0,0,0,0.72)] ring-1 ring-white/10">
            <iframe
              className="absolute inset-0 h-full w-full"
              src={embedSrc}
              title={iframeTitle}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              loading="lazy"
              referrerPolicy="strict-origin-when-cross-origin"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function ChevronDetailsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <path
        fillRule="evenodd"
        d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.168l3.71-3.94a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export function GeorgeLiRecitalAnnouncement() {
  const { t, locale } = useTranslation();
  const titleId = useId();
  const detailsId = useId();
  const biographyDetailsRef = useRef<HTMLDetailsElement | null>(null);
  const inViewRef = useRef(false);
  const revealDoneRef = useRef(false);
  const scrollRevealTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [bioDetailsOpen, setBioDetailsOpen] = useState(false);
  type CurtainPhase = "off" | "full" | "animating";
  const [curtainPhase, setCurtainPhase] = useState<CurtainPhase>("off");
  const closeRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(true);

  const clearScrollRevealTimer = useCallback(() => {
    if (scrollRevealTimerRef.current != null) {
      clearTimeout(scrollRevealTimerRef.current);
      scrollRevealTimerRef.current = null;
    }
  }, []);

  const onBioDetailsToggle = useCallback(
    (e: React.ToggleEvent<HTMLDetailsElement>) => {
      const next = e.currentTarget.open;
      setBioDetailsOpen(next);
      if (!next) {
        setCurtainPhase("off");
        return;
      }
      revealDoneRef.current = true;
      clearScrollRevealTimer();
      setCurtainPhase("off");
    },
    [clearScrollRevealTimer],
  );

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const dismiss = useCallback(() => {
    setOpen(false);
  }, []);

  useEffect(() => {
    if (!open) return;
    const focusTimer = window.setTimeout(() => closeRef.current?.focus(), 0);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismiss();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(focusTimer);
      window.removeEventListener("keydown", onKey);
    };
  }, [open, dismiss]);

  useEffect(() => {
    const el = biographyDetailsRef.current;
    if (!el) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const runAutoReveal = () => {
      if (revealDoneRef.current) return;
      revealDoneRef.current = true;
      clearScrollRevealTimer();
      if (reducedMotion) {
        setBioDetailsOpen(true);
        return;
      }
      setBioDetailsOpen(true);
      setCurtainPhase("full");
    };

    const observer = new IntersectionObserver(
      (entries) => {
        const hit = entries.some((e) => e.isIntersecting);
        inViewRef.current = hit;

        if (hit && !revealDoneRef.current && scrollRevealTimerRef.current == null) {
          scrollRevealTimerRef.current = setTimeout(() => {
            scrollRevealTimerRef.current = null;
            if (!inViewRef.current) return;
            runAutoReveal();
          }, BIO_SCROLL_REVEAL_DELAY_MS);
        }

        if (!hit) {
          clearScrollRevealTimer();
        }
      },
      { root: null, rootMargin: "0px 0px -8% 0px", threshold: 0.12 },
    );

    observer.observe(el);
    return () => {
      observer.disconnect();
      clearScrollRevealTimer();
    };
  }, [clearScrollRevealTimer]);

  useLayoutEffect(() => {
    if (curtainPhase !== "full") return;
    let raf1 = 0;
    let raf2 = 0;
    raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => setCurtainPhase("animating"));
    });
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, [curtainPhase]);

  useEffect(() => {
    if (curtainPhase !== "animating") return;
    const t = window.setTimeout(() => setCurtainPhase("off"), BIO_CURTAIN_DURATION_MS + 250);
    return () => window.clearTimeout(t);
  }, [curtainPhase]);

  const onCurtainTransitionEnd = useCallback((e: React.TransitionEvent<HTMLDivElement>) => {
    if (e.propertyName !== "clip-path") return;
    setCurtainPhase("off");
  }, []);

  const curtainActive = curtainPhase === "full" || curtainPhase === "animating";

  if (!open) return null;

  const posterGoLabel =
    locale === "en"
      ? "Open art-mate ticket page for George Li Piano Recital (opens in a new tab)"
      : "前往 art-mate 購買黎卓宇鋼琴獨奏會門票（新分頁開啟）";

  const primaryCta = locale === "en" ? "Buy tickets on art-mate" : "前往 art-mate 購票";
  const facebookCta =
    locale === "en" ? "Follow GMC Music on Facebook" : "追蹤 GMC Music Facebook";

  const orgFooter =
    locale === "en" ? (
      <>
        Presented by <span className="text-amber-900 dark:text-amber-400">GMC Foundation</span>, with support from{" "}
        <span className="text-amber-900 dark:text-amber-400">Tom Lee Music</span> and the{" "}
        <span className="text-amber-900 dark:text-amber-400">D Festival Young Pianist Program</span>.
      </>
    ) : (
      <>
        音樂會由 <span className="text-amber-900 dark:text-amber-400">美樂文化基金 GMC Foundation</span>{" "}
        主辦，並由 <span className="text-amber-900 dark:text-amber-400">通利琴行</span> 及{" "}
        <span className="text-amber-900 dark:text-amber-400">D Festival 青年鋼琴家藝術節</span> 支持。
      </>
    );

  return (
    <div
      className="fixed inset-0 z-[110] flex min-h-0 items-end justify-center bg-black/40 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] pt-[max(0.75rem,env(safe-area-inset-top,0px))] backdrop-blur-2xl backdrop-saturate-150 sm:items-center sm:p-4"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) dismiss();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative flex max-h-[calc(100dvh-max(0.75rem,env(safe-area-inset-top,0px))-max(0.75rem,env(safe-area-inset-bottom,0px))-0.75rem)] w-full min-h-0 max-w-lg flex-col overflow-hidden rounded-2xl border border-stone-200/80 bg-stone-50 shadow-2xl dark:border-stone-700 dark:bg-stone-900 sm:max-h-[96vh] sm:max-w-2xl"
      >
        <div className="flex shrink-0 items-center justify-end border-b border-stone-200/70 bg-stone-50 px-2 py-2 dark:border-stone-700 dark:bg-stone-900 sm:px-3 sm:py-2.5">
          <button
            ref={closeRef}
            type="button"
            onClick={dismiss}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-stone-900/70 text-sm font-medium text-white backdrop-blur-sm transition hover:bg-stone-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500 dark:bg-stone-100/90 dark:text-stone-900 dark:hover:bg-white"
            aria-label={t("banner.dismiss")}
          >
            ×
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-5 pt-5 sm:px-6 sm:pb-6 sm:pt-6">
          <h2
            id={titleId}
            className="mx-auto mb-5 max-w-xl text-center font-serif text-[1.35rem] font-semibold leading-snug tracking-tight text-stone-900 sm:text-2xl dark:text-stone-50"
          >
            《黎卓宇鋼琴獨奏會》 門票現已公開發售 🎫 &quot;George Li Recital&quot; tickets are now on sale!
          </h2>

          <a
            href={ART_MATE_TICKETS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="group mx-auto mb-0 block max-w-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-500"
            aria-label={posterGoLabel}
          >
            <Image
              src="/images/about-d-festival/george-li-recital-poster.png"
              alt="George Li Piano Recital 黎卓宇鋼琴獨奏會 — poster"
              width={724}
              height={1024}
              className="h-auto w-full rounded-lg shadow-lg ring-2 ring-transparent transition group-hover:ring-amber-400/90 group-active:opacity-95"
              sizes="(max-width: 640px) 85vw, 384px"
              priority
            />
            <span className="mt-2 block text-center text-sm font-semibold text-amber-700 underline decoration-amber-600/60 underline-offset-4 group-hover:text-amber-800 dark:text-amber-400 dark:decoration-amber-400/50 dark:group-hover:text-amber-300">
              {primaryCta} →
            </span>
          </a>

          <div
            className="mx-auto mb-5 mt-3 w-full max-w-sm px-1"
            aria-hidden
          >
            <div className="h-px bg-gradient-to-r from-transparent via-amber-600/45 to-transparent dark:via-amber-400/38" />
          </div>

          <div className="mb-6">
            {ALL_RECITAL_VIDEOS.map((v, i) => (
              <Fragment key={v.embedSrc}>
                {i > 0 ? <RecitalVideoStackDivider /> : null}
                <VideoEmbedBlock {...v} locale={locale} index={i + 1} />
              </Fragment>
            ))}
            <RecitalVideoStackDivider />
            <article className="space-y-5 text-sm leading-relaxed text-stone-800 dark:text-stone-200">
              <blockquote className="border-l-4 border-amber-500/80 py-1 pl-4 text-[13px] italic text-stone-700 dark:border-amber-400/70 dark:text-stone-300 sm:text-sm">
                <p className="not-italic">
                  《華盛頓郵報》盛讚他 &quot;技巧令人感到震撼，演奏具有雷霆般的氣勢和極富深度的音樂解讀&quot;
                </p>
                <p className="mt-2 not-italic text-stone-600 dark:text-stone-400">
                  Praised by the Washington Post for pianist George Li &quot;staggering technical prowess, a sense of
                  command and depth of expression&quot;.
                </p>
              </blockquote>

              <div className="space-y-3">
                <p>
                  鋼琴家黎卓宇於 2015 年獲得柴可夫斯基國際鋼琴比賽的亞軍，並於 2016
                  年獲得了艾弗里·費捨爾音樂職業生涯大獎。首度以獨奏會訪港將展現他的獨特魅力。
                </p>
                <p className="text-stone-700 dark:text-stone-300">
                  George Li captured the Silver Medal at the 2015 International Tchaikovsky Competition and was the recipient
                  of the 2016 Avery Fisher Career Grant. The recital debut in Hong Kong will showcase his unique
                  enchantment.
                </p>
              </div>

              <div className="rounded-xl border border-stone-200/90 bg-white/80 px-4 py-3 dark:border-stone-600 dark:bg-stone-800/50">
                <p className="font-medium text-stone-900 dark:text-stone-100">節目 Programme</p>
                <p className="mt-2">
                  獨奏會曲目包括舒曼《大衛同盟舞曲》、德布西《映像》、穆索斯基《圖畫展覽會》等，絕對是一場不容錯過的音樂會！
                </p>
                <p className="mt-2 text-stone-700 dark:text-stone-300">
                  The programme includes Schumann&apos;s Davidsbündlertänze, Debussy&apos;s Images, as well as
                  Mussorgsky&apos;s Pictures at an Exhibition. Definitely a recital not to be missed!
                </p>
              </div>

              <section
                aria-label={locale === "en" ? "Concert date, venue and tickets" : "演出日期、場地及購票"}
                className="rounded-xl border border-stone-200/90 bg-stone-100/60 px-4 py-4 text-[13px] dark:border-stone-600 dark:bg-stone-800/40 sm:text-sm"
              >
                <ul className="space-y-2">
                  <li>🗓️ 26.5.2026（星期二 Tue）| 8pm</li>
                  <li>📍 荃灣大會堂演奏廳 Auditorium Tsuen Wan Town Hall</li>
                  <li className="pt-1 font-medium text-stone-900 dark:text-stone-100">🎫 購票 Ticket</li>
                  <li>
                    🔴 Art-mate:{" "}
                    <a
                      href={ART_MATE_TICKETS_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="break-all font-medium text-amber-800 underline underline-offset-2 hover:text-amber-900 dark:text-amber-400 dark:hover:text-amber-300"
                    >
                      {ART_MATE_TICKETS_URL}
                    </a>
                  </li>
                  <li>🔵 URBTIX：將於 4 月 9 日公開發售 · Tickets from 9 April</li>
                </ul>
                <p className="mt-4 border-t border-stone-200 pt-3 text-stone-700 dark:border-stone-600 dark:text-stone-300">
                  💡 凡購買正價門票 8 張或以上，可獲 85 折優惠 · Enjoy 15% off for 8+ standard tickets.
                </p>
              </section>

              <div className="space-y-2 border-t border-stone-200 pt-4 text-center text-[13px] text-stone-600 dark:border-stone-600 dark:text-stone-400">
                <p className="font-serif text-base font-semibold tracking-wide text-stone-800 dark:text-stone-200">
                  專業源於專注
                  <br />
                  不一樣的鋼琴學校 Since 1990
                </p>
                <p className="text-[12px] leading-relaxed text-stone-500 dark:text-stone-500">
                  #黎卓宇 #GeorgeLi #PianoRecital #TchaikovskyCompetition #gmcfoundation #gmcmusic #鋼琴 #鋼琴獨奏會
                  #柴可夫斯基大賽 #荃灣大會堂
                </p>
              </div>
            </article>
          </div>

          <details
            ref={biographyDetailsRef}
            id={detailsId}
            open={bioDetailsOpen}
            onToggle={onBioDetailsToggle}
            className="group mt-6 overflow-hidden rounded-xl border border-violet-300/70 bg-gradient-to-b from-violet-50/90 to-white dark:border-violet-800/60 dark:from-violet-950/40 dark:to-stone-900"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3.5 font-serif text-base font-semibold text-violet-900 outline-none marker:hidden sm:px-5 sm:text-lg dark:text-violet-200 [&::-webkit-details-marker]:hidden">
              <span className="text-balance">黎卓宇 George Li：琴鍵上的詩人與巨人</span>
              <ChevronDetailsIcon className="h-5 w-5 shrink-0 text-violet-700 transition-transform duration-500 ease-out group-open:rotate-180 motion-reduce:duration-200 dark:text-violet-300" />
            </summary>
            <div className="relative border-t border-violet-200/80 dark:border-violet-900/50">
              <div
                className="relative z-0 space-y-4 px-4 py-4 text-[13px] leading-relaxed text-stone-800 dark:text-stone-200 sm:px-5 sm:text-sm"
                {...(curtainActive ? { inert: true } : {})}
              >
                <GeorgeLiPortraitGallery />
                <p>
                  從柴可夫斯基大賽走出的鋼琴狂人，不僅是國際大賽得主，更是當代極少數兼具「雷霆氣勢」與「詩意深度」的年輕鋼琴大師。
                </p>

                <div>
                  <p className="font-medium text-stone-900 dark:text-stone-100">🎓 出身波士頓，師承名家</p>
                  <p className="mt-1.5">
                    黎卓宇畢業於紐英倫音樂學院，師從卞和京教授，現攻讀藝術家文憑。10 歲於史坦威音樂廳首度公開演出，2011
                    年更受邀於白宮為奧巴馬總統與默克爾總理演奏，年少已展露光芒。
                  </p>
                </div>

                <div>
                  <p className="font-medium text-stone-900 dark:text-stone-100">🎼 Warner Classics 獨家錄音藝術家</p>
                  <ul className="mt-1.5 list-disc space-y-1 pl-5">
                    <li>2017 年：首張專輯於馬林斯基劇院現場錄音</li>
                    <li>
                      2019 年：與指揮家 Vasily Petrenko、倫敦愛樂合作，錄製李斯特獨奏作品與柴可夫斯基《第一號鋼琴協奏曲》
                    </li>
                    <li>2024 年：最新專輯收錄舒曼、拉威爾、史特拉汶斯基作品，獲國際好評</li>
                  </ul>
                </div>

                <div>
                  <p className="font-medium text-stone-900 dark:text-stone-100">🎻 室內樂與頂尖名家同台</p>
                  <p className="mt-1.5">
                    他曾與 Benjamin Beilman、James Ehnes、Daniel Hope、Sheku Kanneh-Mason
                    等名家合作，展現非凡的音樂對話能力。
                  </p>
                </div>

                <div>
                  <p className="font-medium text-stone-900 dark:text-stone-100">🌍 世界級指揮與樂團首選</p>
                  <p className="mt-1.5">
                    合作指揮包括 Dudamel、Gergiev、Petrenko、余隆、張弦等；樂團則涵蓋紐約愛樂、倫敦愛樂、克利夫蘭交響、慕尼黑愛樂等頂尖陣容。
                  </p>
                </div>

                <div>
                  <p className="font-medium text-stone-900 dark:text-stone-100">🏛️ 足迹遍及全球重要舞台</p>
                  <p className="mt-1.5">
                    卡內基音樂廳、易北愛樂廳、馬林斯基劇院、北京國家大劇院、韋爾比耶音樂節、拉維尼亞音樂節⋯⋯每一場演出，都是音樂與心靈的深刻碰撞。
                  </p>
                </div>
              </div>

              {curtainPhase !== "off" ? (
                <div
                  className={`pointer-events-auto absolute inset-0 z-10 rounded-b-[0.65rem] bg-gradient-to-b from-violet-200/98 via-violet-300/95 to-stone-200/98 shadow-[inset_0_-3px_0_rgba(255,255,255,0.22),0_12px_40px_rgba(0,0,0,0.18)] ring-1 ring-inset ring-violet-400/25 dark:from-violet-950 dark:via-stone-950 dark:to-black dark:shadow-[inset_0_-2px_0_rgba(255,255,255,0.12),0_16px_48px_rgba(0,0,0,0.55)] dark:ring-violet-400/15 ${
                    curtainActive ? "cursor-wait" : ""
                  }`}
                  style={
                    curtainPhase === "full"
                      ? { clipPath: "inset(0% 0 0 0)", transition: "none" }
                      : {
                          clipPath: "inset(100% 0 0 0)",
                          transition: `clip-path ${BIO_CURTAIN_DURATION_MS}ms cubic-bezier(0.18, 0.82, 0.12, 1)`,
                        }
                  }
                  aria-hidden
                  onTransitionEnd={onCurtainTransitionEnd}
                />
              ) : null}
            </div>
          </details>

          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-center">
            <a
              href={ART_MATE_TICKETS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-xl bg-amber-600 px-4 py-3 text-center text-sm font-semibold text-white shadow transition hover:bg-amber-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500 dark:bg-amber-500 dark:text-stone-900 dark:hover:bg-amber-400"
            >
              {primaryCta}
            </a>
            <a
              href={GMC_MUSIC_FACEBOOK_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-[#1877F2] bg-white px-4 py-3 text-center text-sm font-semibold text-[#1877F2] shadow-sm transition hover:bg-[#1877F2]/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1877F2] dark:border-[#1877F2] dark:bg-stone-900 dark:text-[#5b9cf7] dark:hover:bg-[#1877F2]/10"
            >
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#1877F2] text-xs font-bold text-white dark:bg-[#1877F2]">
                f
              </span>
              {facebookCta}
            </a>
            <button
              type="button"
              onClick={dismiss}
              className="inline-flex items-center justify-center rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm font-medium text-stone-800 transition hover:bg-stone-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-400 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-100 dark:hover:bg-stone-700"
            >
              {t("banner.dismiss")}
            </button>
          </div>

          <footer className="mt-8 border-t border-stone-200 pt-6 text-center dark:border-stone-600">
            <p className="mb-1 font-sans text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-500 dark:text-stone-400">
              {locale === "en" ? "Presenting partners" : "主辦 · 支持"}
            </p>
            <p className="font-serif text-sm font-semibold leading-relaxed text-stone-800 sm:text-base dark:text-stone-200">
              {orgFooter}
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
}
