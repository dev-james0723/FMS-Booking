import Image from "next/image";
import Link from "next/link";
import { FantasiaInstagramBlock } from "@/components/about-fantasia-music-space/fantasia-instagram-block";
import { withBasePath } from "@/lib/base-path";

const imgRounded =
  "h-auto w-full rounded-xl border border-stone-200 shadow-md dark:border-stone-700/80";

export function FantasiaEnBody({
  elfsightClass,
}: {
  elfsightClass: string;
}) {
  return (
    <main className="mx-auto max-w-3xl px-5 sm:px-4 pb-28 pt-8 sm:pt-10">
      <div className="flex flex-col items-center">
        <Image
          src={withBasePath("/branding/fantasia-music-space.webp")}
          alt="Fantasia Music Space"
          width={1024}
          height={1024}
          className="h-auto w-[min(100%,220px)] max-w-full object-contain"
          priority
        />
        <h1 className="mt-6 text-center font-serif text-2xl leading-snug text-stone-900 dark:text-stone-50 sm:text-3xl">
          Fantasia Music Space
        </h1>
        <p className="mt-3 max-w-2xl text-center text-[15px] leading-relaxed text-stone-600 dark:text-stone-400 sm:text-base">
          Professional piano studios and recording-friendly rooms. Together with the D Festival programme, we offer
          limited-time free sessions for local music practitioners. Below is a structured overview you can reuse on the
          web or in email campaigns.
        </p>
      </div>

      <figure className="mt-10 sm:mt-12">
        <Image
          src="/images/fantasia-music-space/grand-piano-studio-b.png"
          alt="Fantasia Music Space studio with a Japanese-built Kawai KG-2 grand piano and acoustic wall treatment"
          width={1024}
          height={682}
          className={imgRounded}
          sizes="(max-width: 48rem) 100vw, 48rem"
        />
        <figcaption className="mt-2 text-center text-xs text-stone-500 dark:text-stone-400">
          Kawai KG-2 grand-piano studio: acoustic treatment, storage, and a clear layout for practice or teaching.
        </figcaption>
      </figure>

      <section className="mt-14" aria-labelledby="fms-pro-heading-en">
        <h2
          id="fms-pro-heading-en"
          className="font-serif text-xl text-stone-900 dark:text-stone-50 sm:text-2xl"
        >
          Features
        </h2>
        <ol className="mt-8 list-decimal space-y-8 pl-5 text-[15px] leading-relaxed text-stone-700 dark:text-stone-300 sm:text-base marker:font-semibold marker:text-[#722F37]">
          <li>
            <span className="font-semibold text-stone-900 dark:text-stone-100">24/7 self-service access</span>
            <p className="mt-2">
              Book and use the space on your schedule — early-morning sessions or late-night exam prep. (During this
              campaign, bookable hours follow the{" "}
              <Link href="/" className="text-[#722F37] underline underline-offset-2 hover:text-[#511922]">
                home page
              </Link>{" "}
              guidelines.)
            </p>
          </li>
          <li>
            <span className="font-semibold text-stone-900 dark:text-stone-100">Studio-grade sound isolation</span>
            <p className="mt-2">
              High-spec materials and acoustic design reduce outside noise and help keep your playing contained, so you
              can focus in a private, controlled environment.
            </p>
            <figure className="mt-5">
              <Image
                src="/images/fantasia-music-space/studio-hallway.png"
                alt="Corridor with individual studio doors at Fantasia Music Space"
                width={1024}
                height={682}
                className={imgRounded}
                sizes="(max-width: 48rem) 100vw, 48rem"
              />
              <figcaption className="mt-2 text-center text-xs text-stone-500 dark:text-stone-400">
                Private rooms and circulation: calm, professional, and discreet.
              </figcaption>
            </figure>
          </li>
          <li>
            <span className="font-semibold text-stone-900 dark:text-stone-100">Grand pianos</span>
            <p className="mt-2">
              Step up from upright practice rooms: we offer Japanese-built{" "}
              <span className="whitespace-nowrap">Kawai KG-2</span> grand pianos with nuanced touch and rich tone —
              ideal for advanced exams (e.g. ABRSM), concert preparation, and high-quality recording.
            </p>
            <figure className="mt-5">
              <Image
                src="/images/fantasia-music-space/grand-piano-studio-a.png"
                alt="Japanese-built Kawai KG-2 grand piano with vertical wood-slat acoustic walls"
                width={1024}
                height={682}
                className={imgRounded}
                sizes="(max-width: 48rem) 100vw, 48rem"
              />
              <figcaption className="mt-2 text-center text-xs text-stone-500 dark:text-stone-400">
                Kawai KG-2 grand piano plus acoustic wall treatment.
              </figcaption>
            </figure>
          </li>
          <li>
            <span className="font-semibold text-stone-900 dark:text-stone-100">Self-service video &amp; audio</span>
            <p className="mt-2">
              Set up for online competitions, remote exam recordings, or documenting your practice with a
              production-minded room.
            </p>
            <figure className="mt-5">
              <Image
                src="/images/fantasia-music-space/grand-piano-studio-b.png"
                alt="Spacious Kawai KG-2 studio suitable for camera placement and recording"
                width={1024}
                height={682}
                className={imgRounded}
                sizes="(max-width: 48rem) 100vw, 48rem"
              />
              <figcaption className="mt-2 text-center text-xs text-stone-500 dark:text-stone-400">
                Generous floor space for cameras, stands, and teaching setups.
              </figcaption>
            </figure>
          </li>
          <li>
            <span className="font-semibold text-stone-900 dark:text-stone-100">Flexible teaching &amp; practice use</span>
            <p className="mt-2">
              Not only a practice room — a private music workspace suited to one-to-one lessons or small groups, with
              comfort and privacy in mind.
            </p>
            <figure className="mt-5">
              <Image
                src="/images/fantasia-music-space/mug-teaching-detail.png"
                alt="Teaching corner detail with pens and music-themed decor at Fantasia Music Space"
                width={1024}
                height={682}
                className={imgRounded}
                sizes="(max-width: 48rem) 100vw, 48rem"
              />
              <figcaption className="mt-2 text-center text-xs text-stone-500 dark:text-stone-400">
                A teaching-friendly atmosphere: notes, scores, and everyday studio life.
              </figcaption>
            </figure>
          </li>
          <li>
            <span className="font-semibold text-stone-900 dark:text-stone-100">Central Tsuen Wan location</span>
            <p className="mt-2">
              A prime spot on Sha Tsui Road, Tsuen Wan (Technology Plaza), with strong transport links for local and
              cross-district visitors. See{" "}
              <Link href="/directions" className="text-[#722F37] underline underline-offset-2 hover:text-[#511922]">
                how to get to Fantasia Music Space
              </Link>
              .
            </p>
          </li>
        </ol>
      </section>

      <FantasiaInstagramBlock
        elfsightClass={elfsightClass}
        title="Follow Fantasia Music Space for the latest updates"
        subtitle="Venue news, behind-the-scenes moments, and booking reminders."
      />
    </main>
  );
}
