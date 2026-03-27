"use client";

import { useTranslation } from "@/lib/i18n/use-translation";

const memoTitleId = "home-eligibility-memo-title";

export function HomeEligibilityMemo() {
  const { t } = useTranslation();

  return (
    <section
      className="mx-auto mt-10 max-w-xl px-4 sm:px-6"
      aria-labelledby={memoTitleId}
    >
      <div className="relative pb-2 pt-2">
        <div className="motion-safe:animate-memo-drift origin-top will-change-transform relative z-0 overflow-visible rounded-sm border border-amber-300/90 bg-[#fff9db] text-stone-900 shadow-[0_14px_42px_-14px_rgba(28,25,23,0.35),inset_0_1px_0_rgba(255,255,255,0.65)] dark:border-amber-400/50 dark:shadow-[0_16px_48px_-12px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(255,255,255,0.4)]">
          <div className="relative z-0 space-y-5 px-7 pb-10 pt-12 text-stone-900 sm:px-10 sm:pb-12 sm:pt-14">
            <h2
              id={memoTitleId}
              className="text-center font-serif text-lg font-semibold leading-snug tracking-tight text-stone-900 sm:text-xl"
            >
              {t("home.eligibilityMemo.title")}
            </h2>

            <p className="rounded-md border border-amber-800/15 bg-amber-100/60 p-5 text-sm font-medium leading-relaxed text-stone-900 sm:p-6">
              {t("home.eligibilityMemo.alert")}
            </p>

            <div className="space-y-4 text-sm leading-relaxed text-stone-800">
              <div>
                <h3 className="font-semibold text-stone-900">
                  {t("home.eligibilityMemo.step1Heading")}
                </h3>
                <p className="mt-2">{t("home.eligibilityMemo.step1Intro")}</p>
                <ul className="mt-2.5 list-[lower-alpha] space-y-1.5 pl-6 marker:font-medium marker:text-stone-700 sm:pl-7">
                  <li>{t("home.eligibilityMemo.step1a")}</li>
                  <li>{t("home.eligibilityMemo.step1b")}</li>
                  <li>{t("home.eligibilityMemo.step1c")}</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-stone-900">
                  {t("home.eligibilityMemo.step2Heading")}
                </h3>
                <p className="mt-2">{t("home.eligibilityMemo.step2Intro")}</p>
                <ul className="mt-2.5 list-[lower-alpha] space-y-1.5 pl-6 marker:font-medium marker:text-stone-700 sm:pl-7">
                  <li>{t("home.eligibilityMemo.step2a")}</li>
                  <li>{t("home.eligibilityMemo.step2b")}</li>
                </ul>
              </div>
            </div>

            <p className="border-t border-amber-800/15 pt-4 text-sm font-medium leading-relaxed text-stone-900 sm:pt-5">
              {t("home.eligibilityMemo.closing")}
            </p>
          </div>
        </div>

        <div
          className="pointer-events-none absolute left-1/2 top-0 z-30 -translate-x-1/2 -translate-y-[42%]"
          aria-hidden
        >
          <div className="relative flex w-8 flex-col items-center">
            <div className="relative z-10 h-8 w-8 shrink-0 rounded-full bg-gradient-to-br from-red-400 via-red-600 to-red-900 shadow-[0_4px_10px_rgba(0,0,0,0.35),inset_0_2px_6px_rgba(255,255,255,0.35),inset_0_-3px_6px_rgba(0,0,0,0.25)] ring-2 ring-red-950/20" />
            <div className="-mt-1.5 h-7 w-[5px] shrink-0 rounded-b-md bg-gradient-to-b from-neutral-300 via-neutral-500 to-neutral-600 shadow-[0_2px_3px_rgba(0,0,0,0.25)]" />
          </div>
        </div>
      </div>
    </section>
  );
}
