import Image from "next/image";
import Link from "next/link";
import Script from "next/script";
import { DGalleryEmbed } from "@/components/d-gallery-embed";
import { FestivalBackgroundMusic } from "@/components/festival-background-music";
import { Mdw3dGlobeGallery } from "@/components/mdw-3d-globe-gallery";
import { OFFICIAL_SITE_URL } from "@/lib/about-d-festival-env";

export function AboutEnBody({
  dFestivalElfsightClass,
}: {
  dFestivalElfsightClass: string | null;
}) {
  return (
    <main className="mx-auto max-w-3xl px-5 sm:px-4 pb-28 pt-8 sm:pt-10">
      <h1 className="text-center font-serif text-2xl leading-snug text-stone-900 dark:text-stone-50 sm:text-3xl">
        About the 2026 D Festival Young Pianist Program
      </h1>

      <figure className="mt-8 sm:mt-10">
        <Image
          src="/images/d-festival-2025-stage-group.png"
          alt="2025 D Festival Young Pianist Program — guest faculty, young pianists and team on stage with event branding"
          width={990}
          height={672}
          className="h-auto w-full rounded-xl border border-stone-200 shadow-md dark:border-stone-700/80"
          sizes="(max-width: 48rem) 100vw, 48rem"
          priority
        />
      </figure>

      <section className="mt-12" aria-labelledby="df-mission-heading">
        <h2
          id="df-mission-heading"
          className="font-serif text-xl text-stone-900 dark:text-stone-50 sm:text-2xl"
        >
          The mission of D Festival
        </h2>
        <div className="mt-6 space-y-5 text-[15px] leading-relaxed text-stone-700 dark:text-stone-300 sm:text-base">
          <p>
            Welcome! The inaugural 2025 D Festival Young Pianist Program concluded successfully at Quanzhou Grand
            Theatre. In just two weeks we delivered over 200 professional piano coaching sessions, concerts, masterclasses,
            and the D Masters international piano competition. Young pianists from many countries and cities came together on
            stage and in the classroom. Warm responses from parents, teachers, and participants give us even more drive to
            continue D Festival&apos;s educational mission. Building on that success, in 2026 we will keep rigorous teaching
            and intensive stage practice at the centre while expanding programme scale and performance space.
          </p>
          <p>
            We want every participant, within two concentrated weeks, to experience the full journey from professional
            training to live performance and to connect with truly international artistic standards. With the launch of D
            Ensemble and our ongoing deep collaboration with Quartet Daedalus, we look forward to a 12-day path that offers
            a rare, complete, and professional musical journey—from disciplined practice in the studio to collaborative work
            in rehearsal rooms, and finally to the concert hall under the lights.
          </p>
          <p>
            Our goal is clear: help each participant not only stand on a beautiful stage, but stand at a real starting line
            for an international artistic journey. We hope to see you in Quanzhou in 2026 for a new chapter of the D
            Festival Young Pianist Program.
          </p>
          <p className="pt-1 font-serif text-stone-800 dark:text-stone-200">With warm regards,</p>
        </div>
      </section>

      <section
        className="mt-14 rounded-2xl border border-amber-200/60 bg-gradient-to-b from-white to-amber-50/40 p-6 shadow-sm sm:p-8"
        aria-labelledby="df-founder-heading"
      >
        <h2 id="df-founder-heading" className="sr-only">
          Profile
        </h2>
        <div className="flex flex-col items-center text-center">
          <Image
            src="/images/au-hin-sing-headshot.png"
            alt="Hin-Sing (James) Au — Co-founder, Technology & Operations Director, D Festival"
            width={612}
            height={556}
            className="h-28 w-28 rounded-full object-cover object-center shadow-md ring-2 ring-amber-300/50"
            priority
          />
          <p className="mt-5 font-serif text-xl font-semibold text-stone-900 dark:text-stone-50">
            Hin-Sing (James) Au
          </p>
          <Image
            src="/images/hin-sing-au-signature.png"
            alt="Signature of Hin-Sing (James) Au"
            width={274}
            height={132}
            className="mt-3 h-[52px] w-auto max-w-[min(100%,220px)] object-contain object-center mix-blend-multiply"
            priority
          />
          <p className="mt-4 max-w-md text-sm leading-relaxed text-stone-600 dark:text-black">
            Co-founder | Technology &amp; Operations Director, D Festival
          </p>
        </div>
      </section>

      <section
        aria-labelledby="df-2025-memories-heading"
        className="relative left-1/2 mt-16 w-screen max-w-[100vw] -translate-x-1/2 bg-black pb-14 pt-12 text-white"
      >
        <Script
          src="https://elfsightcdn.com/platform.js"
          strategy="lazyOnload"
        />

        <div className="mx-auto max-w-3xl px-5 sm:px-4">
          <h2
            id="df-2025-memories-heading"
            className="text-center font-serif text-xl leading-snug text-white sm:text-2xl"
          >
            2025 D Festival highlights
          </h2>
          <p className="mt-8 text-center font-serif text-lg tracking-[0.12em] text-[#c9a227] sm:text-xl">
            D-Gallery
          </p>
        </div>

        <div className="mt-5" aria-label="D-Gallery 3D globe">
          <Mdw3dGlobeGallery />
        </div>

        <div
          className="mx-auto mt-10 max-w-3xl border-t border-white/20 px-5 sm:px-4"
          role="separator"
          aria-hidden
        />

        <div
          className="mx-auto mt-12 max-w-3xl px-5 sm:px-4"
          aria-label="D Festival feed and gallery"
        >
          {dFestivalElfsightClass ? (
            <div className="mx-auto w-full">
              <div
                className={dFestivalElfsightClass}
                data-elfsight-app-lazy
              />
            </div>
          ) : null}

          <div className={dFestivalElfsightClass ? "mt-14" : ""}>
            <DGalleryEmbed showPageFillMore />
          </div>
        </div>
      </section>

      <section
        aria-label="2026 highlights booklet and links"
        className="mt-14 border-t border-stone-200 pt-14 dark:border-stone-700/80"
      >
        <h2 className="text-center font-serif text-xl text-stone-900 dark:text-stone-50 sm:text-2xl">
          2026 highlights booklet
        </h2>
        <p className="mx-auto mt-2 max-w-xl text-center text-sm text-stone-600 dark:text-stone-400">
          D Festival digital programme — explore this year&apos;s highlights.
        </p>
        <div className="flipbook-embed-wrapper mt-8 overflow-hidden rounded-xl border border-stone-200 bg-stone-100 shadow-inner dark:border-stone-700/80 dark:bg-stone-800/50">
          <iframe
            src="https://d-festival-flipbook.vercel.app"
            title="D Festival 2026 digital programme"
            className="block min-h-[500px] w-full border-0"
            style={{ height: "80vh" }}
          />
        </div>

        <div className="mt-10">
          <Link
            href={OFFICIAL_SITE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-center rounded-xl bg-gradient-to-b from-[#1a3a5c] via-[#0f2844] to-[#0a1f36] px-6 py-4 text-center text-sm font-medium tracking-wide text-white shadow-[0_10px_28px_rgba(15,40,68,0.35)] ring-1 ring-white/10 transition hover:from-[#1e4268] hover:via-[#12304d] hover:to-[#0c2438] hover:ring-white/15"
          >
            Visit the official D Festival website — step into the world of D
          </Link>
        </div>

        <div
          className="mx-auto my-14 max-w-3xl border-t border-stone-300 dark:border-stone-600"
          role="separator"
          aria-hidden
        />

        <header className="mx-auto max-w-2xl px-2 text-center">
          <h2 className="font-serif text-2xl text-stone-900 dark:text-stone-50 sm:text-3xl">
            Follow D Festival on Instagram
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-stone-600 dark:text-stone-400">
            Stay close to news, backstage moments, courses, and performances — experience D Festival with us.
          </p>
        </header>

        <div className="mx-auto mt-10 max-w-3xl">
          <div
            className="elfsight-app-5497602b-1fba-4420-9443-e464827ba00f"
            data-elfsight-app-lazy
          />
        </div>
      </section>

      <FestivalBackgroundMusic />
    </main>
  );
}

