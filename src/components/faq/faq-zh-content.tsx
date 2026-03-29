import { FaqAuthInlineLinks } from "@/components/faq/faq-auth-inline-links";
import { FaqUserCategoriesSection } from "@/components/faq/faq-user-categories-section";
import {
  FaqCallout,
  FaqFootnote,
  FaqStepCardList,
  FaqTocChips,
  FaqVisualCardList,
} from "@/components/faq/faq-visual";

const toc = [
  { id: "overview", label: "活動與流程概覽" },
  { id: "booking-logic", label: "預約邏輯" },
  { id: "how-system", label: "系統如何操作" },
  { id: "fair-use", label: "公平使用" },
  { id: "user-types", label: "用戶類別說明" },
  { id: "social-bonus", label: "社群與推薦" },
  { id: "room-rules", label: "琴室使用須知" },
  { id: "notes", label: "其他注意事項" },
] as const;

export function FaqZhContent() {
  return (
    <main className="mx-auto max-w-3xl px-5 sm:px-4 py-12 pb-24">
      <h1 className="font-serif text-3xl text-stone-900 dark:text-stone-50">常見問題（FAQ）</h1>
      <p className="mt-3 text-sm leading-relaxed text-stone-600 dark:text-stone-400">
        預約平台重點、<strong className="font-medium text-stone-800 dark:text-stone-200">幻樂空間</strong>守則及
        <strong className="text-stone-800 dark:text-stone-200">社群／推薦</strong>要求速覽。與主辦最新公布不符者，以主辦為準。
      </p>

      <FaqTocChips ariaLabel="本頁目錄" heading="目錄" items={toc} />

      <div className="mt-12 space-y-14 text-sm leading-relaxed text-stone-700 dark:text-stone-300">
        <section id="overview" className="scroll-mt-24">
          <h2 className="font-serif text-xl text-stone-900 dark:text-stone-50">活動與流程概覽</h2>
          <FaqVisualCardList
            items={[
              {
                variant: "teal",
                icon: "spark",
                title: "限時免費琴室體驗",
                tags: ["D Festival × 幻樂空間", "香港幻樂國際贊助", "本地音樂工作者與學習者"],
                blurb: "專注練習、試奏、綵排與錄影準備等音樂用途，並可了解相關課程與演出資訊。",
              },
              {
                variant: "violet",
                icon: "calendar",
                title: "體驗期間（例子）",
                tags: ["2026/4/3–5/3", "每日：06:00–20:00", "香港時間"],
              },
              {
                variant: "sky",
                icon: "arrows",
                title: "兩步完成參與",
                tags: ["① 登記並開戶", "② 預約開放後提交時段"],
              },
            ]}
          />
          <FaqCallout>
            <strong>重要：</strong>登記或預約後會收到<strong>確認電郵</strong>；一般情況下可依確認使用設施。主辦方仍保留<strong>更改或取消</strong>預約之權利。
          </FaqCallout>
        </section>

        <section id="booking-logic" className="scroll-mt-24">
          <h2 className="font-serif text-xl text-stone-900 dark:text-stone-50">預約邏輯</h2>
          <FaqVisualCardList
            items={[
              {
                variant: "teal",
                icon: "envelope",
                title: "預約成功 → 確認電郵",
                tags: ["系統自動發送"],
              },
              {
                variant: "emerald",
                icon: "shield",
                title: "依確認到場",
                tags: ["日期與時間", "遵守場地守則"],
              },
              {
                variant: "amber",
                icon: "scale",
                title: "主辦保留權利",
                tags: ["可更改或取消預約"],
              },
            ]}
          />
        </section>

        <section id="how-system" className="scroll-mt-24">
          <h2 className="font-serif text-xl text-stone-900 dark:text-stone-50">系統如何操作</h2>
          <FaqStepCardList
            steps={[
              {
                title: "登記與開戶",
                blurb: "以 Email 作登入帳號；查收臨時密碼，首次登入後請盡快更改密碼。",
              },
              {
                title: "預約開放",
                blurb: "首頁會顯示主辦公布的開放時間；開放後登入，於預約版面選時段並提交。",
              },
              {
                title: "到場使用前",
                blurb: "憑確認電郵依時使用；可於帳戶內查看預約紀錄，並遵守下文琴室須知。",
              },
            ]}
          />
          <FaqAuthInlineLinks />
        </section>

        <section id="fair-use" className="scroll-mt-24">
          <h2 className="font-serif text-xl text-stone-900 dark:text-stone-50">公平使用</h2>
          <p className="mt-2 text-xs text-stone-500 dark:text-stone-400">以下為原則摘要；實際以主辦最終決定為準。</p>
          <FaqVisualCardList
            items={[
              {
                variant: "teal",
                icon: "scale",
                title: "用途與登記一致",
                tags: ["類別、用途、可配合時段"],
                blurb: "主辦方可編排、查核或調整；明顯不符或影響他人者，可能被拒絕或取消。",
              },
              {
                variant: "violet",
                icon: "userCheck",
                title: "確認後的時段",
                tags: ["確認電郵"],
                blurb: "一般情況下該時段即屬你的預約；整體名額仍受活動安排所限。",
              },
              {
                variant: "stone",
                icon: "gavel",
                title: "主辦決定權",
                tags: ["分類、分配、改動或取消"],
              },
              {
                variant: "sky",
                icon: "hand",
                title: "誠實申報",
                tags: ["用戶類別須屬實"],
              },
              {
                variant: "rose",
                icon: "clock",
                title: "守時與缺席",
                tags: ["珍惜名額"],
                blurb: "無故缺席或浪費資源者，可能影響日後參與資格（依主辦政策）。",
              },
            ]}
          />
        </section>

        <FaqUserCategoriesSection locale="zh" />

        <section id="social-bonus" className="scroll-mt-24">
          <h2 className="font-serif text-xl text-stone-900 dark:text-stone-50">
            社群參與 <span className="text-stone-600 dark:text-stone-400">與推薦</span>
          </h2>
          <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">
            參加<strong>免費體驗</strong>須完成<strong>追蹤官方帳戶</strong>及<strong>轉發指定帖文並 tag</strong>。此兩項<strong>不會</strong>換取額外預約節數（每節 30 分鐘＝0.5 小時）或
            bonus slots。
          </p>
          <FaqVisualCardList
            className="mt-5"
            items={[
              {
                variant: "violet",
                icon: "heart",
                title: "1. 追蹤官方帳戶",
                tags: ["Instagram + Facebook", "三個指定帳戶均須追蹤"],
                blurb: (
                  <>
                    <p>登記後依網頁引導開啟連結作記錄；到場請備「已追蹤」畫面以便查核。</p>
                    <ul className="mt-2 list-none space-y-1 p-0 text-stone-600 dark:text-stone-400">
                      <li className="flex gap-2">
                        <span className="text-teal-600 dark:text-teal-400" aria-hidden>
                          ●
                        </span>
                        <span>D Festival 青年鋼琴家藝術節</span>
                      </li>
                      <li className="flex gap-2">
                        <span className="text-teal-600 dark:text-teal-400" aria-hidden>
                          ●
                        </span>
                        <span>Fantasia Music Space 幻樂空間</span>
                      </li>
                      <li className="flex gap-2">
                        <span className="text-teal-600 dark:text-teal-400" aria-hidden>
                          ●
                        </span>
                        <span>香港幻樂國際有限公司</span>
                      </li>
                    </ul>
                  </>
                ),
              },
              {
                variant: "sky",
                icon: "arrowPath",
                title: "2. 轉發指定貼文",
                tags: ["共 2 則 D Festival 宣傳帖", "限時動態／動態", "Tag 兩個官方 IG 及 FB"],
                blurb: (
                  <>
                    須為主辦<strong className="text-stone-800 dark:text-stone-200">指定帖文</strong>，並
                    <strong className="text-stone-800 dark:text-stone-200">保留轉發紀錄</strong>以備查核。
                  </>
                ),
              },
              {
                variant: "amber",
                icon: "gift",
                title: "3. D-Ambassador 推薦優惠",
                tags: ["與追蹤／轉發無關", "推薦獎賞另計"],
                blurb: (
                  <>
                    <p>
                      先成為 <strong className="text-stone-800 dark:text-stone-200">D Ambassador</strong>（登記勾選或「我的帳戶」加入），分享
                      <strong className="text-stone-800 dark:text-stone-200">專屬連結／QR</strong>；親友<strong className="text-stone-800 dark:text-stone-200">經你的連結完成新登記</strong>
                      且你合資格，方可獲獎勵（以主辦核實為準）。
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="rounded-lg bg-stone-900 px-2.5 py-1 text-xs font-semibold text-stone-50 dark:bg-stone-100 dark:text-stone-900">
                        每 1 人 → +1 節（0.5 小時）
                      </span>
                      <span className="rounded-lg border border-stone-300 bg-stone-100 px-2.5 py-1 text-xs font-semibold text-stone-800 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-100">
                        活動期內最多 25 節（12.5 小時）（25 名推薦人）
                      </span>
                      <span className="rounded-lg border border-stone-300 px-2.5 py-1 text-xs font-medium text-stone-700 dark:border-stone-600 dark:text-stone-300">
                        不可轉讓 · 不可兌現
                      </span>
                    </div>
                    <p className="mt-3 text-xs text-stone-500 dark:text-stone-400">
                      被推薦人：可享 <strong className="text-stone-700 dark:text-stone-300">D Festival</strong> 報名費半價、
                      <strong className="text-stone-700 dark:text-stone-300"> D Masters</strong> 初賽報名費半價；所有優惠碼將會自動發送到被推薦人；所有額外時段須於
                      <strong className="text-stone-700 dark:text-stone-300"> 2026/5/3</strong> 後使用，主辦方會於此次免費體驗活動後，逐步向獲取額外 Time Slots
                      的用戶通知何時能進行預約。
                    </p>
                  </>
                ),
              },
            ]}
          />
          <FaqFootnote>登記須勾選追蹤與轉發承諾；是否完成及是否符合要求，以主辦核實及條款為準。</FaqFootnote>
        </section>

        <section id="room-rules" className="scroll-mt-24">
          <h2 className="font-serif text-xl text-stone-900 dark:text-stone-50">琴室使用須知（幻樂空間）</h2>
          <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">進房前請遵守下列重點，保障設施與他人權益。</p>
          <FaqVisualCardList
            items={[
              {
                variant: "teal",
                icon: "shoe",
                title: "入場與衛生",
                tags: ["脫鞋", "雙手消毒", "必須穿鞋時先噴鞋底酒精"],
              },
              {
                variant: "orange",
                icon: "ban",
                title: "飲食與清潔",
                tags: ["房內禁止飲食", "清水除外", "不留垃圾與包裝"],
              },
              {
                variant: "violet",
                icon: "music",
                title: "鋼琴與譜架",
                tags: ["勿放雜物於琴面／譜架", "樂譜除外", "勿用酒精濕巾抹琴", "譜架勿用擦膠", "勿弄污場內樂譜"],
              },
              {
                variant: "sky",
                icon: "speaker",
                title: "秩序、財物與離場",
                tags: ["勿喧嘩追逐", "自行保管財物", "愛護設施（損壞須賠）", "離場關燈／冷氣／音響"],
              },
              {
                variant: "stone",
                icon: "building",
                title: "用途與場地公物",
                tags: ["僅限音樂相關用途", "勿擅自開窗或開非前蓋", "勿帶走場地物品"],
              },
            ]}
          />
        </section>

        <section id="notes" className="scroll-mt-24">
          <h2 className="font-serif text-xl text-stone-900 dark:text-stone-50">其他注意事項</h2>
          <FaqVisualCardList
            items={[
              {
                variant: "stone",
                icon: "info",
                title: "效力優先次序",
                tags: ["電郵、現場告示、職員指示"],
                blurb: "與本 FAQ 衝突時，以上述為準。",
              },
              {
                variant: "sky",
                icon: "refresh",
                title: "網站內容會更新",
                tags: ["開放時間", "可選時段"],
                blurb: "請以首頁／系統最新顯示為準。",
              },
              {
                variant: "teal",
                icon: "envelope",
                title: "請確保 Email 正確",
                tags: ["臨時密碼", "通知"],
                blurb: "並留意垃圾郵件匣。",
              },
              {
                variant: "violet",
                icon: "shield",
                title: "條款與私隱疑問",
                blurb: "請依主辦／幻樂空間最新公布之聯絡方式查詢。",
              },
            ]}
          />
        </section>
      </div>
    </main>
  );
}
