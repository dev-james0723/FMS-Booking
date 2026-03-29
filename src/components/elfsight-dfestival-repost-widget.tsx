"use client";

import Script from "next/script";

/**
 * Elfsight Instagram feed — two specified D Festival posts for Story repost instructions.
 */
export function ElfsightDfestivalRepostWidget() {
  return (
    <section className="mx-auto mt-10 max-w-lg text-left">
      <h2 className="font-serif text-lg text-stone-900 dark:text-stone-50">轉發指定貼文（登記承諾）</h2>
      <p className="mt-3 text-sm leading-relaxed text-stone-600 dark:text-stone-400">
        請於下方小工具開啟指定貼文，並分享到 Instagram 或 Facebook
        限時動態；於限時動態標註 (tag)「D Festival 青年鋼琴家藝術節」及「幻樂空間 Fantasia Music
        Space」的 Instagram 與 Facebook 帳號。主辦方可依活動條款核實參與情況。
      </p>
      <div className="mt-6 min-h-[200px] rounded-xl border border-stone-200 bg-stone-50 p-2 dark:border-stone-700 dark:bg-stone-900/60">
        <Script src="https://elfsightcdn.com/platform.js" strategy="lazyOnload" />
        <div
          className="elfsight-app-db1b3777-3935-4f51-b570-e49719b5bb33"
          data-elfsight-app-lazy
        />
      </div>
    </section>
  );
}
