import Image from "next/image";
import Link from "next/link";
import Script from "next/script";
import { DGalleryEmbed } from "@/components/d-gallery-embed";
import { FestivalBackgroundMusic } from "@/components/festival-background-music";
import { Mdw3dGlobeGallery } from "@/components/mdw-3d-globe-gallery";
import { OFFICIAL_SITE_URL } from "@/lib/about-d-festival-env";
import { navFantasiaCtaClass } from "@/lib/nav-icon-button-classes";

export function AboutZhBody({
  dFestivalElfsightClass,
}: {
  dFestivalElfsightClass: string | null;
}) {
  return (
    <main className="mx-auto max-w-3xl px-5 sm:px-4 pb-28 pt-8 sm:pt-10">
      <h1 className="text-center font-serif text-2xl leading-snug text-stone-900 dark:text-stone-50 sm:text-3xl">
        關於 2026 D Festival 青年鋼琴家藝術節
      </h1>

      <div className="mt-6 flex justify-center">
        <Link href="/about-fantasia-music-space" className={navFantasiaCtaClass}>
          關於幻樂空間
        </Link>
      </div>

      <figure className="mt-8 sm:mt-10">
        <Image
          src="/images/d-festival-2025-stage-group.png"
          alt="2025 D Festival 青年鋼琴家藝術節 — 客座教授、青年鋼琴家與團隊於舞台前合影，背景為活動主視覺"
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
          D Festival 的使命
        </h2>
        <div className="mt-6 space-y-5 text-[15px] leading-relaxed text-stone-700 dark:text-stone-300 sm:text-base">
          <p>
            歡迎！2025 年首屆 D Festival 青年鋼琴家藝術節於泉州大劇院圓滿落幕。在短短兩週內，我們成功呈獻了逾
            200 堂鋼琴專業導師課、多場精彩音樂會、大師班及 D Masters
            國際鋼琴比賽；來自全球多個國家與城市的青年鋼琴菁英齊聚一堂，在舞台與課堂上切磋砥礪，共譜動人樂章。家長、老師與學員的熱烈迴響，為我們注入了倍添的動力與信心，去延續並深化
            D Festival 的教育使命。承接首屆的成功經驗，2026
            年我們將持續以嚴謹教學與密集式舞台實踐為核心，全面擴大課程規模與舞台空間。
          </p>
          <p>
            我們致力讓學員在兩週的黃金時間內，完整歷練從專業訓練到舞台實戰的全方位流程，真正與國際藝術水平接軌。隨著節日室內樂團
            (D Ensemble) 的成立，以及與匠弦四重奏 (Quartet Daedalus)
            的持續深度合作，今年我們特別期待在 12
            天的旅程中，為學員提供坊間罕見、真正完整且專業的音樂啟迪：從琴房的刻苦練習到排練室的互動協作，最終走向鎂光燈下的音樂廳舞台。
          </p>
          <p>
            我們的目標清晰而堅定——協助每一位參與者不只站上華麗的舞台，更要站在通往國際藝術旅程的真正起跑線上。2026
            年，期待與你在泉州相見，共同開啟 D Festival 青年鋼琴家藝術節的全新篇章！
          </p>
          <p className="pt-1 font-serif text-stone-800 dark:text-stone-200">敬祝　藝安，</p>
        </div>
      </section>

      <section
        className="mt-14 rounded-2xl border border-amber-200/60 bg-gradient-to-b from-white to-amber-50/40 p-6 shadow-sm sm:p-8"
        aria-labelledby="df-founder-heading"
      >
        <h2 id="df-founder-heading" className="sr-only">
          個人資訊
        </h2>
        <div className="flex flex-col items-center text-center">
          <Image
            src="/images/au-hin-sing-headshot.png"
            alt="歐顯星（James）— 聯合創辦人、科技與營運總監 | D Festival"
            width={612}
            height={556}
            className="h-28 w-28 rounded-full object-cover object-center shadow-md ring-2 ring-amber-300/50"
            priority
          />
          <p className="mt-5 font-serif text-xl font-semibold text-stone-900 dark:text-stone-50">
            歐顯星（James）
          </p>
          <Image
            src="/images/hin-sing-au-signature.png"
            alt="歐顯星（James）簽名"
            width={274}
            height={132}
            className="mt-3 h-[52px] w-auto max-w-[min(100%,220px)] object-contain object-center mix-blend-multiply"
            priority
          />
          <p className="mt-4 max-w-md text-sm leading-relaxed text-stone-600 dark:text-black">
            聯合創辦人、科技與營運總監 | D Festival
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
            2025 年 D Festival 精彩回憶
          </h2>
          <p className="mt-8 text-center font-serif text-lg tracking-[0.12em] text-[#c9a227] sm:text-xl">
            D-畫廊
          </p>
        </div>

        <div className="mt-5" aria-label="D 畫廊 3D 球體">
          <Mdw3dGlobeGallery />
        </div>

        <div
          className="mx-auto mt-10 max-w-3xl border-t border-white/20 px-5 sm:px-4"
          role="separator"
          aria-hidden
        />

        <div
          className="mx-auto mt-12 max-w-3xl px-5 sm:px-4"
          aria-label="D Festival 動態與圖庫"
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
        aria-label="2026 精華小本與連結"
        className="mt-14 border-t border-stone-200 pt-14 dark:border-stone-700/80"
      >
        <h2 className="text-center font-serif text-xl text-stone-900 dark:text-stone-50 sm:text-2xl">
          2026 精華小本
        </h2>
        <p className="mx-auto mt-2 max-w-xl text-center text-sm text-stone-600 dark:text-stone-400">
          D Festival 電子場刊 — 走進本屆精華內容。
        </p>
        <div className="flipbook-embed-wrapper mt-8 overflow-hidden rounded-xl border border-stone-200 bg-stone-100 shadow-inner dark:border-stone-700/80 dark:bg-stone-800/50">
          <iframe
            src="https://d-festival-flipbook.vercel.app"
            title="D Festival 2026 電子場刊"
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
            探索 D Festival 官方網站，走進 D 的世界
          </Link>
        </div>

        <div
          className="mx-auto my-14 max-w-3xl border-t border-stone-300 dark:border-stone-600"
          role="separator"
          aria-hidden
        />

        <header className="mx-auto max-w-2xl px-2 text-center">
          <h2 className="font-serif text-2xl text-stone-900 dark:text-stone-50 sm:text-3xl">
            追蹤 D Festival Instagram
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-stone-600 dark:text-stone-400">
            緊貼最新消息、舞台花絮、課程與演出資訊，與我們一同感受 D Festival。
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

