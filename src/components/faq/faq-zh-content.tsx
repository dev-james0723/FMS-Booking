import Link from "next/link";

const toc = [
  { id: "overview", label: "活動與流程概覽" },
  { id: "how-system", label: "系統如何操作" },
  { id: "fair-use", label: "公平使用與審批" },
  { id: "user-types", label: "用戶類別說明" },
  { id: "social-bonus", label: "社群參與要求（追蹤與轉發）" },
  { id: "room-rules", label: "琴室使用須知" },
  { id: "notes", label: "其他注意事項" },
] as const;

export function FaqZhContent() {
  return (
    <main className="mx-auto max-w-3xl px-5 sm:px-4 py-12 pb-24">
      <h1 className="font-serif text-3xl text-stone-900 dark:text-stone-50">常見問題（FAQ）</h1>
      <p className="mt-3 text-sm leading-relaxed text-stone-600 dark:text-stone-400">
        以下內容綜合本預約平台之運作方式，以及{" "}
        <strong className="font-medium text-stone-800 dark:text-stone-200">幻樂空間 Fantasia Music Space</strong>{" "}
        之琴室使用守則及<strong className="text-stone-800 dark:text-stone-200">社群參與要求</strong>
        。如有與主辦方最新公布不符，以主辦方為準。
      </p>

      <nav
        aria-label="本頁目錄"
        className="mt-8 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900/80 dark:bg-stone-900/80 px-5 sm:px-4 py-4 text-sm"
      >
        <p className="font-medium text-stone-800 dark:text-stone-200">目錄</p>
        <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-stone-600 dark:text-stone-400">
          {toc.map((item) => (
            <li key={item.id}>
              <a href={`#${item.id}`} className="text-stone-700 dark:text-stone-300 underline decoration-stone-300 underline-offset-2 hover:text-stone-900 dark:text-stone-50">
                {item.label}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <div className="mt-12 space-y-14 text-sm leading-relaxed text-stone-700 dark:text-stone-300">
        <section id="overview" className="scroll-mt-24">
          <h2 className="font-serif text-xl text-stone-900 dark:text-stone-50">活動與流程概覽</h2>
          <p className="mt-3">
            「<strong>D Festival 青年鋼琴藝術節</strong>」與「<strong>幻樂空間</strong>」聯合推出之
            <strong>限時免費琴室體驗</strong>，由香港幻樂國際音樂文化管理有限公司贊助，對象為本地音樂工作者及學習者。
          </p>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>
              提供專注空間，方便<strong>個人練習、試奏、audition 準備、比賽／錄影前綵排、創作</strong>
              等音樂相關用途，並介紹 D Festival 相關課程與演出機會。
            </li>
            <li>
              體驗期間以主辦公布為準（例如{" "}
              <strong>2026 年 4 月 3 日至 5 月 3 日</strong> 內之開放時段；首日 11:00 起，其餘日 06:00
              起）。
            </li>
            <li>
              本平台採<strong>兩階段</strong>：先完成「登記資料及建立帳戶」，再在<strong>預約開放時間</strong>
              後提交正式預約。
            </li>
          </ul>
          <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50/90 px-3 py-2 text-amber-950 dark:border-amber-800/60 dark:bg-amber-950/35 dark:text-amber-100">
            <strong>重要：</strong>
            完成登記或提交資料<strong>不代表</strong>已獲批琴室時段；最終以審批結果及另行通知為準。
          </p>
        </section>

        <section id="how-system" className="scroll-mt-24">
          <h2 className="font-serif text-xl text-stone-900 dark:text-stone-50">系統如何操作</h2>
          <ol className="mt-4 list-decimal space-y-4 pl-5">
            <li>
              <strong className="text-stone-900 dark:text-stone-50">登記與開戶</strong>
              <p className="mt-1 text-stone-600 dark:text-stone-400">
                於「登記資料及建立帳戶」填寫資料並提交。系統會以您的 <strong>Email</strong> 作為登入帳號，並發送
                <strong>臨時密碼</strong>（請查收電郵，並於首次登入後盡快更改密碼）。
              </p>
            </li>
            <li>
              <strong className="text-stone-900 dark:text-stone-50">預約開放</strong>
              <p className="mt-1 text-stone-600 dark:text-stone-400">
                預約功能會在<strong>主辦方公布的開放時間</strong>後啟用（首頁會顯示相關時間）。開放後，請登入並於預約版面選擇時段、提交預約。
              </p>
            </li>
            <li>
              <strong className="text-stone-900 dark:text-stone-50">審批與結果</strong>
              <p className="mt-1 text-stone-600 dark:text-stone-400">
                提交預約後，狀態會顯示為待審核等；主辦方批核、後補或拒絕後，您可於帳戶內查看紀錄。若系統設有電郵通知，亦會寄至您登記的 Email。
              </p>
            </li>
            <li>
              <strong className="text-stone-900 dark:text-stone-50">到場使用前</strong>
              <p className="mt-1 text-stone-600 dark:text-stone-400">
                獲批後，請依確認之日期、時間及場地守則使用琴室；並遵守下文「琴室使用須知」。
              </p>
            </li>
          </ol>
          <p className="mt-4">
            <Link href="/register" className="text-stone-900 dark:text-stone-50 underline decoration-stone-400 underline-offset-2 hover:decoration-stone-600">
              前往登記資料及建立帳戶
            </Link>
            {" · "}
            <Link href="/login" className="text-stone-900 dark:text-stone-50 underline decoration-stone-400 underline-offset-2 hover:decoration-stone-600">
              登入
            </Link>
            {" · "}
            <Link href="/" className="text-stone-900 dark:text-stone-50 underline decoration-stone-400 underline-offset-2 hover:decoration-stone-600">
              返回首頁
            </Link>
          </p>
        </section>

        <section id="fair-use" className="scroll-mt-24">
          <h2 className="font-serif text-xl text-stone-900 dark:text-stone-50">公平使用與審批</h2>
          <p className="mt-3">
            為讓有限之免費時段合理分配予不同參加者，主辦方會按下列原則處理預約（實際以主辦方最終決定為準）：
          </p>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>
              <strong className="text-stone-900 dark:text-stone-50">用途與資料一致：</strong>
              審批會參考您登記時填寫的<strong>使用用途、用戶類別</strong>及<strong>可提供的時段／意向</strong>，並配合當日實際餘額與整體編排。
            </li>
            <li>
              <strong className="text-stone-900 dark:text-stone-50">不設自動先到先得保證：</strong>
              系統可能採預約制；<strong>提交成功不等於已預留該時段</strong>，須待審批。
            </li>
            <li>
              <strong className="text-stone-900 dark:text-stone-50">主辦方保留決定權：</strong>
              幻樂空間／主辦方有權就<strong>用戶分類、時段分配、批核／後補／拒絕</strong>及整體安排作最終決定，無須另行說明個別個案之排序細節。
            </li>
            <li>
              <strong className="text-stone-900 dark:text-stone-50">誠實申報：</strong>
              請按真實情況選擇「個人」或「教學／帶學生」等類別；虛報或影響他人權益者，主辦方可拒絕預約或取消已批核時段。
            </li>
            <li>
              <strong className="text-stone-900 dark:text-stone-50">守時與缺席：</strong>
              請珍惜已獲分配之時段；無故缺席或浪費資源者，可能影響日後參與資格（依主辦方政策）。
            </li>
          </ul>
        </section>

        <section id="user-types" className="scroll-mt-24">
          <h2 className="font-serif text-xl text-stone-900 dark:text-stone-50">用戶類別說明（與登記表一致）</h2>
          <p className="mt-3 text-stone-600 dark:text-stone-400">
            登記時請選擇最符合您使用方式的一類，以便主辦方作公平審批：
          </p>
          <div className="mt-4 space-y-4">
            <div className="rounded-xl border border-stone-200 dark:border-stone-700 bg-surface px-5 sm:px-4 py-3">
              <h3 className="font-medium text-stone-900 dark:text-stone-50">個人使用者</h3>
              <p className="mt-2 text-stone-600 dark:text-stone-400">
                以<strong>個人身份</strong>使用，例如：個人練習、試奏、audition 準備、比賽錄影、綵排、創作、試琴等。
                一般適合<strong>學生、個人演奏者、自由工作者</strong>等。
              </p>
            </div>
            <div className="rounded-xl border border-stone-200 dark:border-stone-700 bg-surface px-5 sm:px-4 py-3">
              <h3 className="font-medium text-stone-900 dark:text-stone-50">教學／帶學生使用者</h3>
              <p className="mt-2 text-stone-600 dark:text-stone-400">
                涉及<strong>教學或帶同學生</strong>之用途，例如：教學、帶學生上課、試奏、協助學生錄影等。
                一般適合<strong>私人老師、音樂導師</strong>等。
              </p>
            </div>
          </div>
        </section>

        <section id="social-bonus" className="scroll-mt-24">
          <h2 className="font-serif text-xl text-stone-900 dark:text-stone-50">
            社群參與要求 <span className="text-stone-600 dark:text-stone-400">追蹤與轉發</span>
          </h2>
          <p className="mt-3 text-stone-600 dark:text-stone-400">
            符合資格參與本<strong>免費體驗</strong>者，須同時完成下列兩項：<strong>追蹤指定官方社交帳戶</strong>及
            <strong>轉發主辦方指定貼文並標註官方帳號</strong>。完成上述事項<strong>不會</strong>獲得任何額外預約時段、獎賞節數或
            bonus slots；免費體驗之名額與批核仍依活動條款及主辦安排為準（詳情以主辦方現場及最新公布為準）。
          </p>

          <div className="mt-8 space-y-8">
            <article className="rounded-xl border border-violet-200 bg-violet-50/60 px-5 sm:px-4 py-4">
              <h3 className="font-semibold text-stone-900 dark:text-stone-50">1. 追蹤官方帳戶</h3>
              <p className="mt-2 text-stone-700 dark:text-stone-300">
                <strong className="text-stone-900 dark:text-stone-50">做法：</strong>
                於 <strong>Instagram</strong> 及 <strong>Facebook</strong> 追蹤下列三個指定帳戶。登記成功後，系統會引導你於網頁上逐個開啟官方連結以作記錄；到場時亦請準備好「已追蹤」畫面以備主辦查核。
              </p>
              <p className="mt-3 text-sm font-medium text-stone-800 dark:text-stone-200">指定帳戶（須於 IG 及 FB 均追蹤）：</p>
              <ol className="mt-2 list-decimal space-y-1 pl-5 text-stone-700 dark:text-stone-300">
                <li>D Festival 青年鋼琴家藝術節</li>
                <li>Fantasia Music Space 幻樂空間</li>
                <li>香港幻樂國際音樂管理公司（Hong Kong Fantasia International Music Management Ltd.）</li>
              </ol>
            </article>

            <article className="rounded-xl border border-sky-200 bg-sky-50/60 px-5 sm:px-4 py-4">
              <h3 className="font-semibold text-stone-900 dark:text-stone-50">2. 轉發指定貼文</h3>
              <p className="mt-2 text-stone-700 dark:text-stone-300">
                <strong className="text-stone-900 dark:text-stone-50">做法：</strong>
                將主辦方指定之 <strong>D Festival 青年鋼琴藝術節</strong> 宣傳帖文（共兩則），轉發至個人{" "}
                <strong>Instagram</strong> 或 <strong>Facebook</strong> 限時動態／動態，並標註（tag）{" "}
                <strong>D Festival 青年鋼琴家藝術節</strong> 及 <strong>幻樂空間 Fantasia Music Space</strong> 的{" "}
                <strong>Instagram 與 Facebook</strong> 帳號。
              </p>
              <div className="mt-4 rounded-lg border border-stone-200 dark:border-stone-700 bg-surface px-3 py-3 text-sm text-stone-600 dark:text-stone-400">
                <p className="font-medium text-stone-800 dark:text-stone-200">備註</p>
                <ul className="mt-2 list-disc space-y-1.5 pl-5">
                  <li>轉發內容須為主辦方<strong>指定之活動帖文</strong>。</li>
                  <li>請<strong>保留轉發紀錄</strong>，以便主辦方查核時出示證明。</li>
                </ul>
              </div>
            </article>

            <article className="rounded-xl border border-amber-200 bg-amber-50/50 px-5 sm:px-4 py-4 dark:border-amber-800/50 dark:bg-amber-950/30">
              <h3 className="font-semibold text-stone-900 dark:text-stone-50">3. 體驗後延伸優惠</h3>
              <p className="mt-2 text-stone-700 dark:text-stone-300">
                <strong className="text-stone-900 dark:text-stone-50">做法：</strong>
                完成<strong>首次免費體驗</strong>後，可依主辦安排獲得幻樂空間<strong>正式租琴優惠</strong>相關禮遇。
              </p>
              <p className="mt-2 text-stone-700 dark:text-stone-300">
                <strong className="text-stone-900 dark:text-stone-50">優惠內容：</strong>
                包括優惠券形式之租琴折扣等（例如面額、使用條件、有效期）以<strong>主辦方最新公布及現場說明為準</strong>；
                若本頁與主辦方單張／條款不一致，以主辦方為準。
              </p>
            </article>
          </div>

          <p className="mt-6 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-100 dark:bg-stone-800/80 px-3 py-2 text-xs text-stone-600 dark:text-stone-400">
            登記時須勾選追蹤與轉發之承諾；實際是否完成及是否符合活動要求，以主辦方核實及活動條款為準。
          </p>
        </section>

        <section id="room-rules" className="scroll-mt-24">
          <h2 className="font-serif text-xl text-stone-900 dark:text-stone-50">琴室使用須知（幻樂空間）</h2>
          <p className="mt-3 text-stone-600 dark:text-stone-400">
            進入琴房前請詳閱並遵守以下規定，以保障設施、他人使用權益及您的安全。
          </p>
          <ol className="mt-6 list-decimal space-y-4 pl-5 marker:font-medium marker:text-stone-800 dark:text-stone-200">
            <li>
              <strong className="text-stone-900 dark:text-stone-50">進房前準備：</strong>
              請<strong>脫鞋</strong>、使用<strong>消毒液清潔雙手</strong>後進入。
              <span className="mt-2 block rounded-md border border-red-200 bg-red-50 px-3 py-2 text-red-900">
                <strong>特別說明：</strong>
                若因考試／拍攝需要<strong>必須穿鞋</strong>，請以<strong>酒精噴霧消毒鞋底</strong>後方可進入。
              </span>
            </li>
            <li>
              <strong className="text-stone-900 dark:text-stone-50">飲食：</strong>
              房內<strong>禁止飲食</strong>（<strong>清水除外</strong>）。
            </li>
            <li>
              <strong className="text-stone-900 dark:text-stone-50">清潔：</strong>
              請勿於房內遺留食物包裝、飯盒或飲品容器。
            </li>
            <li>
              <strong className="text-stone-900 dark:text-stone-50">物品擺放：</strong>
              請勿將個人物品放置於<strong>鋼琴表面或譜架</strong>上（<strong>樂譜除外</strong>）。
            </li>
            <li>
              <strong className="text-stone-900 dark:text-stone-50">鋼琴清潔：</strong>
              請勿使用<strong>含酒精之濕紙巾</strong>擦拭鋼琴表面或琴鍵。
            </li>
            <li>
              <strong className="text-stone-900 dark:text-stone-50">譜架：</strong>
              請勿於鋼琴譜架使用<strong>擦膠</strong>。
            </li>
            <li>
              <strong className="text-stone-900 dark:text-stone-50">秩序：</strong>
              房內請勿<strong>嬉戲追逐、大聲喧嘩</strong>。
            </li>
            <li>
              <strong className="text-stone-900 dark:text-stone-50">財物：</strong>
              請自行保管隨身物品；若有遺失，本場地恕難負責。
            </li>
            <li>
              <strong className="text-stone-900 dark:text-stone-50">設施愛護：</strong>
              請愛護房內設施；如有損壞，須按價賠償。
            </li>
            <li>
              <strong className="text-stone-900 dark:text-stone-50">節能與離場：</strong>
              離開前請關閉<strong>燈光、冷氣、音響</strong>等所有電器。
            </li>
            <li>
              <strong className="text-stone-900 dark:text-stone-50">用途限制：</strong>
              房間僅供<strong>音樂相關用途</strong>；未經許可不得進行其他活動。
            </li>
            <li>
              <strong className="text-stone-900 dark:text-stone-50">窗戶與琴蓋：</strong>
              未經許可請勿開啟<strong>窗戶</strong>或三角琴<strong>除前蓋以外</strong>之琴蓋。
            </li>
            <li>
              <strong className="text-stone-900 dark:text-stone-50">垃圾：</strong>
              請保持整潔；垃圾請丟入房內垃圾桶或自行帶走，勿影響他人。
            </li>
            <li>
              <strong className="text-stone-900 dark:text-stone-50">場內樂譜：</strong>
              房內樂譜可供使用，但請勿<strong>弄污或書寫</strong>。
            </li>
            <li>
              <strong className="text-stone-900 dark:text-stone-50">公物：</strong>
              請勿攜走房內任何屬於場地之物品。
            </li>
          </ol>
        </section>

        <section id="notes" className="scroll-mt-24">
          <h2 className="font-serif text-xl text-stone-900 dark:text-stone-50">其他注意事項</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>本 FAQ 旨在說明平台與場地一般規定；與電郵、現場告示或主辦方職員指示衝突時，以後者為準。</li>
            <li>系統顯示之開放報名、預約時間及可選時段，可能因主辦方調整而變更，請以網站最新顯示為準。</li>
            <li>請確保登記之 Email 正確，以便接收臨時密碼與通知（並檢查垃圾郵件匣）。</li>
            <li>對條款、個人資料或活動細節有疑問，請聯絡主辦方／幻樂空間客服（請以主辦方最新公布之聯絡方式為準）。</li>
          </ul>
        </section>
      </div>
    </main>
  );
}
