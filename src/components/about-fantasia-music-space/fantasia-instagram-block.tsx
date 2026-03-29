import Script from "next/script";

/** Elfsight Instagram Feed | Untitled Instagram Feed 3 — https://elfsightcdn.com/platform.js */
export function FantasiaInstagramBlock({
  elfsightClass,
  title,
  subtitle,
}: {
  elfsightClass: string;
  title: string;
  subtitle: string;
}) {
  return (
    <section
      className="mt-16 border-t border-stone-200 pt-14 dark:border-stone-700/80"
      aria-labelledby="fms-ig-heading"
    >
      <Script src="https://elfsightcdn.com/platform.js" strategy="lazyOnload" />

      <header className="mx-auto max-w-2xl px-2 text-center">
        <h2
          id="fms-ig-heading"
          className="font-serif text-xl leading-snug text-stone-900 dark:text-stone-50 sm:text-2xl"
        >
          {title}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-stone-600 dark:text-stone-400">
          {subtitle}
        </p>
      </header>

      <div className="mx-auto mt-10 max-w-3xl">
        <div className={elfsightClass} data-elfsight-app-lazy />
      </div>
    </section>
  );
}
