import Image from "next/image";
import Link from "next/link";
import { FantasiaInstagramBlock } from "@/components/about-fantasia-music-space/fantasia-instagram-block";
import { withBasePath } from "@/lib/base-path";

const imgRounded =
  "h-auto w-full rounded-xl border border-stone-200 shadow-md dark:border-stone-700/80";

export function FantasiaZhBody({
  elfsightClass,
}: {
  elfsightClass: string;
}) {
  return (
    <main className="mx-auto max-w-3xl px-5 sm:px-4 pb-28 pt-8 sm:pt-10">
      <div className="flex flex-col items-center">
        <Image
          src={withBasePath("/branding/fantasia-music-space.png")}
          alt="幻樂空間 Fantasia Music Space"
          width={2481}
          height={2481}
          className="h-auto w-[min(100%,220px)] max-w-full object-contain"
          priority
        />
        <h1 className="mt-6 text-center font-serif text-2xl leading-snug text-stone-900 dark:text-stone-50 sm:text-3xl">
          幻樂空間 Fantasia Music Space
        </h1>
        <p className="mt-3 max-w-2xl text-center text-[15px] leading-relaxed text-stone-600 dark:text-stone-400 sm:text-base">
          專業琴房與錄影環境，配合 D Festival
          企劃為本地音樂工作者帶來限時免費體驗。以下整理核心特點，方便您於官網或電郵推廣參考。
        </p>
      </div>

      <figure className="mt-10 sm:mt-12">
        <Image
          src="/images/fantasia-music-space/grand-piano-studio-b.png"
          alt="幻樂空間琴房 — 日本製 Kawai KG-2 三角鋼琴、木條聲學牆面與舒適練習環境"
          width={1024}
          height={682}
          className={imgRounded}
          sizes="(max-width: 48rem) 100vw, 48rem"
        />
        <figcaption className="mt-2 text-center text-xs text-stone-500 dark:text-stone-400">
          Kawai KG-2 三角鋼琴琴房：專業聲學裝潢、收納與練習／教學動線一應俱全。
        </figcaption>
      </figure>

      <section className="mt-14" aria-labelledby="fms-pro-heading">
        <h2
          id="fms-pro-heading"
          className="font-serif text-xl text-stone-900 dark:text-stone-50 sm:text-2xl"
        >
          特點
        </h2>
        <ol className="mt-8 list-decimal space-y-8 pl-5 text-[15px] leading-relaxed text-stone-700 dark:text-stone-300 sm:text-base marker:font-semibold marker:text-[#722F37]">
          <li>
            <span className="font-semibold text-stone-900 dark:text-stone-100">
              24 小時全天候自助營運
            </span>
            <p className="mt-2">
              打破傳統營業時間限制。無論是清晨的靈感湧現，還是深夜的考前衝刺，您都可以隨時預訂、隨時使用，完美配合繁忙都市人的靈活時間表。（本網站活動期間之可預約時段請以{" "}
              <Link href="/" className="text-[#722F37] underline underline-offset-2 hover:text-[#511922]">
                主頁說明
              </Link>{" "}
              為準。）
            </p>
          </li>
          <li>
            <span className="font-semibold text-stone-900 dark:text-stone-100">
              專業 Studio 級別隔音環境
            </span>
            <p className="mt-2">
              採用高規格隔音物料及聲學設計，徹底隔絕外界噪音滋擾，同時確保您的演奏不會影響他人。為您提供一個極致安靜、能完全專注的私人音樂空間。
            </p>
            <figure className="mt-5">
              <Image
                src="/images/fantasia-music-space/studio-hallway.png"
                alt="幻樂空間走廊 — 獨立琴房門與柔和燈光，呈現私密專業的動線"
                width={1024}
                height={682}
                className={imgRounded}
                sizes="(max-width: 48rem) 100vw, 48rem"
              />
              <figcaption className="mt-2 text-center text-xs text-stone-500 dark:text-stone-400">
                獨立房間與走廊動線：兼顧私隱與專業氛圍。
              </figcaption>
            </figure>
          </li>
          <li>
            <span className="font-semibold text-stone-900 dark:text-stone-100">
              高質素三角鋼琴（Grand Piano）配置
            </span>
            <p className="mt-2">
              告別普通的直立式鋼琴，我們為您提供觸鍵手感細膩、音色層次豐富的日本製 Kawai KG-2
              三角鋼琴。完美滿足高級別音樂考試（如 ABRSM）、專業演奏練習及高質素錄音的嚴格要求。
            </p>
            <figure className="mt-5">
              <Image
                src="/images/fantasia-music-space/grand-piano-studio-a.png"
                alt="幻樂空間琴房內的日本製 Kawai KG-2 三角鋼琴與木條牆面"
                width={1024}
                height={682}
                className={imgRounded}
                sizes="(max-width: 48rem) 100vw, 48rem"
              />
              <figcaption className="mt-2 text-center text-xs text-stone-500 dark:text-stone-400">
                Kawai KG-2 三角鋼琴與垂直木條聲學牆：手感與聲學兼備。
              </figcaption>
            </figure>
          </li>
          <li>
            <span className="font-semibold text-stone-900 dark:text-stone-100">
              完善的自助錄影及錄音服務
            </span>
            <p className="mt-2">
              針對現代音樂人的需求，空間內配備了自助錄影設施。無論是準備線上音樂比賽、遙距音樂考試錄影，還是記錄日常練習進度，都能輕鬆錄製出專業級的影音作品。
            </p>
            <figure className="mt-5">
              <Image
                src="/images/fantasia-music-space/grand-piano-studio-b.png"
                alt="幻樂空間琴房 — Kawai KG-2 三角鋼琴與寬敞空間有利錄影取景與聲學發揮"
                width={1024}
                height={682}
                className={imgRounded}
                sizes="(max-width: 48rem) 100vw, 48rem"
              />
              <figcaption className="mt-2 text-center text-xs text-stone-500 dark:text-stone-400">
                寬敞琴房與整齊動線，方便錄影與教學布置。
              </figcaption>
            </figure>
          </li>
          <li>
            <span className="font-semibold text-stone-900 dark:text-stone-100">
              多功能靈活空間
            </span>
            <p className="mt-2">
              不僅是練習室，更是您的專屬音樂工作室。空間設計兼顧私隱與舒適度，非常適合音樂導師進行一對一私人授課或小組教學。
            </p>
            <figure className="mt-5">
              <Image
                src="/images/fantasia-music-space/mug-teaching-detail.png"
                alt="幻樂空間內教學氛圍小景 — 文具與音樂主題擺設"
                width={1024}
                height={682}
                className={imgRounded}
                sizes="(max-width: 48rem) 100vw, 48rem"
              />
              <figcaption className="mt-2 text-center text-xs text-stone-500 dark:text-stone-400">
                教學與創作氛圍：理論、筆記與即興靈感同樣重要。
              </figcaption>
            </figure>
          </li>
          <li>
            <span className="font-semibold text-stone-900 dark:text-stone-100">
              交通便利的優越位置
            </span>
            <p className="mt-2">
              位於荃灣沙咀道核心地段（科技中心），交通網絡四通八達，無論是區內居民還是跨區前來的音樂愛好者，都能輕鬆抵達。詳情請見{" "}
              <Link
                href="/directions"
                className="text-[#722F37] underline underline-offset-2 hover:text-[#511922]"
              >
                如何前往幻樂空間
              </Link>
              。
            </p>
          </li>
        </ol>
      </section>

      <FantasiaInstagramBlock
        elfsightClass={elfsightClass}
        title="追蹤 Fantasia Music Space 幻樂空間，Follow 最新動態"
        subtitle="緊貼場地資訊、活動花絮與預約提示，與我們保持聯繫。"
      />
    </main>
  );
}
