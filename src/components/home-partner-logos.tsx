"use client";

import Image from "next/image";
import { withBasePath } from "@/lib/base-path";

export function HomePartnerLogos() {
  return (
    <section
      className="relative mb-12 overflow-hidden rounded-3xl border border-violet-200/50 bg-gradient-to-br from-violet-50/90 via-amber-50/40 to-fuchsia-50/50 px-4 py-10 shadow-[0_8px_40px_-16px_rgba(91,33,182,0.2)] sm:px-8"
      aria-label="D Festival 與幻樂空間聯合企劃"
    >
      <div
        className="partner-blob partner-blob-1 pointer-events-none absolute -left-20 -top-16 h-52 w-52 rounded-full bg-violet-400/25 blur-3xl"
        aria-hidden
      />
      <div
        className="partner-blob partner-blob-2 pointer-events-none absolute -bottom-14 -right-16 h-60 w-60 rounded-full bg-amber-300/30 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full bg-fuchsia-200/20 blur-3xl"
        aria-hidden
      />

      <div className="relative flex flex-col items-center justify-center gap-8 sm:flex-row sm:gap-2 md:gap-6">
        <div className="partner-float-left flex w-full max-w-[min(100%,340px)] items-center justify-center sm:w-auto">
          <Image
            src={withBasePath("/branding/d-festival-young-pianist.png")}
            alt="D Festival 青年鋼琴家藝術節"
            width={360}
            height={120}
            className="h-auto max-h-[5.5rem] w-auto max-w-full bg-transparent object-contain object-center sm:max-h-[6.5rem]"
            priority
          />
        </div>

        <div className="partner-connector flex shrink-0 items-center justify-center" aria-hidden="true">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-xl font-light leading-none text-violet-800 shadow-md ring-2 ring-violet-200/70">
            ×
          </span>
        </div>

        <div className="partner-float-right flex w-full max-w-[min(100%,340px)] items-center justify-center sm:w-auto">
          <Image
            src={withBasePath("/branding/fantasia-music-space.png")}
            alt="Fantasia Music Space 幻樂空間"
            width={360}
            height={200}
            className="h-auto max-h-[6rem] w-auto max-w-full bg-transparent object-contain object-center mix-blend-screen sm:max-h-[7rem]"
            priority
          />
        </div>
      </div>

      <p className="relative mt-7 text-center text-[11px] font-medium uppercase tracking-[0.25em] text-violet-900/45 sm:text-xs">
        聯合企劃 · Joint presentation
      </p>
    </section>
  );
}
