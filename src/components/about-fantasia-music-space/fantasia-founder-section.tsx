import Image from "next/image";
import Link from "next/link";

const founderPortraitSrc = "/images/fantasia-music-space/founder-james-hin-sing-au.png";
const officialSiteUrl = "https://hin-singau.com";

/** Deep orange CTA — high contrast with white text, distinct from site wine accent #722F37 */
const founderCtaClass =
  "inline-flex items-center justify-center rounded-lg bg-[#b84d0e] px-5 py-3 text-center text-[15px] font-medium text-white shadow-sm transition-colors hover:bg-[#9a400c] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b84d0e] dark:bg-[#c45a14] dark:hover:bg-[#a34a10]";

export function FantasiaFounderSection({
  heading,
  bio,
  ctaLabel,
  portraitAlt,
}: {
  heading: string;
  bio: string;
  ctaLabel: string;
  portraitAlt: string;
}) {
  return (
    <section
      className="mt-16 border-t border-stone-200 pt-14 dark:border-stone-700/80"
      aria-labelledby="fms-founder-heading"
    >
      <header className="mx-auto max-w-2xl px-2 text-center">
        <h2
          id="fms-founder-heading"
          className="font-serif text-xl leading-snug text-stone-900 dark:text-stone-50 sm:text-2xl"
        >
          {heading}
        </h2>
      </header>

      <div className="mx-auto mt-10 flex max-w-2xl flex-col items-center gap-8 sm:flex-row sm:items-start sm:gap-10 sm:px-2">
        <div className="relative h-40 w-40 shrink-0 overflow-hidden rounded-full border-4 border-stone-200 shadow-md ring-1 ring-stone-200/80 dark:border-stone-600 dark:ring-stone-700/60 sm:h-44 sm:w-44">
          <Image
            src={founderPortraitSrc}
            alt={portraitAlt}
            width={836}
            height={788}
            className="h-full w-full object-cover object-[center_20%]"
            sizes="(max-width: 640px) 160px, 176px"
          />
        </div>
        <div className="min-w-0 flex-1 text-center sm:text-left">
          <p className="text-[15px] leading-relaxed text-stone-700 dark:text-stone-300 sm:text-base">
            {bio}
          </p>
          <div className="mt-6 flex justify-center sm:justify-start">
            <Link
              href={officialSiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={founderCtaClass}
            >
              {ctaLabel}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
