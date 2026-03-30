"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { GEORGE_LI_GALLERY_SLIDES } from "@/lib/about-d-festival/george-li-gallery-slides";

const AUTO_MS = 5000;

function subscribeReducedMotion(cb: () => void) {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}

function getReducedMotionSnapshot() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function getReducedMotionServerSnapshot() {
  return false;
}

function usePrefersReducedMotion() {
  return useSyncExternalStore(subscribeReducedMotion, getReducedMotionSnapshot, getReducedMotionServerSnapshot);
}

function GalleryChevron({ direction }: { direction: "left" | "right" }) {
  return (
    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      {direction === "left" ? (
        <path
          fillRule="evenodd"
          d="M12.79 5.23a.75.75 0 0 1-.02 1.06L8.832 10l3.938 3.71a.75.75 0 1 1-1.04 1.08l-4.5-4.25a.75.75 0 0 1 0-1.08l4.5-4.25a.75.75 0 0 1 1.06.02Z"
          clipRule="evenodd"
        />
      ) : (
        <path
          fillRule="evenodd"
          d="M7.21 14.77a.75.75 0 0 1 .02-1.06L11.168 10 7.23 6.29a.75.75 0 1 1 1.04-1.08l4.5 4.25a.75.75 0 0 1 0 1.08l-4.5 4.25a.75.75 0 0 1-1.06-.02Z"
          clipRule="evenodd"
        />
      )}
    </svg>
  );
}

export function GeorgeLiPortraitGallery() {
  const slides = GEORGE_LI_GALLERY_SLIDES;
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const indexRef = useRef(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const reducedMotion = usePrefersReducedMotion();
  /** Pause autoplay while pointer is over the gallery or focus is inside controls. */
  const [hoverPaused, setHoverPaused] = useState(false);

  useEffect(() => {
    indexRef.current = activeIndex;
  }, [activeIndex]);

  const scrollToIndex = useCallback(
    (next: number, behavior: ScrollBehavior = "smooth") => {
      const el = scrollerRef.current;
      if (!el) return;
      const n = slides.length;
      const i = ((next % n) + n) % n;
      const w = el.clientWidth;
      el.scrollTo({ left: i * w, behavior: reducedMotion ? "auto" : behavior });
      setActiveIndex(i);
    },
    [reducedMotion, slides.length]
  );

  const syncIndexFromScroll = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const w = Math.max(1, el.clientWidth);
    const i = Math.round(el.scrollLeft / w);
    const clamped = Math.min(Math.max(0, i), slides.length - 1);
    if (clamped !== indexRef.current) {
      indexRef.current = clamped;
      setActiveIndex(clamped);
    }
  }, [slides.length]);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(syncIndexFromScroll);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("scroll", onScroll);
    };
  }, [syncIndexFromScroll]);

  useEffect(() => {
    if (reducedMotion || hoverPaused) return;
    const id = window.setInterval(() => {
      if (document.hidden) return;
      scrollToIndex(indexRef.current + 1);
    }, AUTO_MS);
    return () => window.clearInterval(id);
  }, [hoverPaused, reducedMotion, scrollToIndex]);

  const onPrev = () => {
    scrollToIndex(activeIndex - 1);
  };

  const onNext = () => {
    scrollToIndex(activeIndex + 1);
  };

  return (
    <div
      className="relative overflow-hidden rounded-lg border border-violet-200/60 bg-stone-100/40 shadow-sm ring-1 ring-stone-900/[0.04] dark:border-violet-800/45 dark:bg-stone-800/35 dark:ring-stone-100/[0.06]"
      onMouseEnter={() => setHoverPaused(true)}
      onMouseLeave={() => setHoverPaused(false)}
      onFocusCapture={() => setHoverPaused(true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setHoverPaused(false);
      }}
    >
      <div
        ref={scrollerRef}
        role="region"
        aria-roledescription="carousel"
        aria-label="George Li 黎卓宇 — photo gallery"
        className="flex snap-x snap-mandatory overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft") {
            e.preventDefault();
            onPrev();
          } else if (e.key === "ArrowRight") {
            e.preventDefault();
            onNext();
          }
        }}
      >
        {slides.map((slide, i) => (
          <div
            key={slide.src}
            role="group"
            aria-roledescription="slide"
            aria-label={`${i + 1} of ${slides.length}`}
            aria-hidden={i !== activeIndex}
            className="w-full shrink-0 snap-center"
          >
            <div className="relative aspect-[3/2] w-full bg-stone-200 dark:bg-stone-900">
              <Image
                src={slide.src}
                alt={
                  i === 0
                    ? "George Li 黎卓宇 — portrait"
                    : `George Li 黎卓宇 — gallery photo ${i + 1}`
                }
                width={slide.width}
                height={slide.height}
                className="h-full w-full object-cover object-center"
                sizes="(max-width: 640px) calc(100vw - 3rem), min(560px, 90vw)"
                priority={i === 0}
                loading={i === 0 ? "eager" : "lazy"}
                draggable={false}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="pointer-events-none absolute inset-y-0 left-0 right-0 flex items-center justify-between px-1.5 sm:px-2">
        <button
          type="button"
          onClick={onPrev}
          className="pointer-events-auto inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/25 bg-stone-900/55 text-white shadow-md backdrop-blur-sm transition hover:bg-stone-900/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400"
          aria-label="上一張相 · Previous photo"
        >
          <GalleryChevron direction="left" />
        </button>
        <button
          type="button"
          onClick={onNext}
          className="pointer-events-auto inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/25 bg-stone-900/55 text-white shadow-md backdrop-blur-sm transition hover:bg-stone-900/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400"
          aria-label="下一張相 · Next photo"
        >
          <GalleryChevron direction="right" />
        </button>
      </div>

      <p className="sr-only" aria-live="polite">
        Slide {activeIndex + 1} of {slides.length}
      </p>
    </div>
  );
}
