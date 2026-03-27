"use client";

import { useCallback, useState } from "react";
import { useTranslation } from "@/lib/i18n/use-translation";

const COPY_PROMO_CODES_ZH = `D Festival 青年鋼琴家藝術節 — 報名費半價（優惠碼將自動發送至你的登記電郵；備用代碼：FMSXDF）。
D Masters 國際鋼琴比賽 — 初賽報名費半價（優惠碼將自動發送至你的登記電郵；備用代碼：DMXFMS）。
注意：所有額外預約時段須於 2026 年 5 月 3 日後使用。免費體驗活動結束後，主辦方將逐步通知獲取額外 Time Slots 之用戶何時可預約。`;

const COPY_PROMO_CODES_EN = `D Festival Young Pianist Program — 50% off application fee (promo code sent automatically to your registration email; backup code: FMSXDF).
D Masters International Piano Competition — 50% off preliminary application fee (promo code sent automatically to your registration email; backup code: DMXFMS).
Note: All extra booking slots must be used after 3 May 2026. After the free experience programme ends, the organiser will progressively notify users who earned extra Time Slots when they may book.`;

export function ReferralAmbassadorDialog(props: {
  ambassadorNameZh: string;
  onClose: () => void;
}) {
  const { t, tr, locale } = useTranslation();
  const [copied, setCopied] = useState(false);

  const copyAll = useCallback(async () => {
    const block =
      locale === "en"
        ? `${tr("account.ambassadorPopupCopyLeadEn", { name: props.ambassadorNameZh })}\n\n${COPY_PROMO_CODES_EN}`
        : `${tr("account.ambassadorPopupCopyLeadZh", { name: props.ambassadorNameZh })}\n\n${COPY_PROMO_CODES_ZH}`;
    try {
      await navigator.clipboard.writeText(block);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      /* ignore */
    }
  }, [locale, props.ambassadorNameZh, tr]);

  return (
    <div
      className="fixed inset-0 z-[120] flex items-end justify-center bg-black/50 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="fms-ambassador-referral-title"
    >
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-stone-200 bg-surface p-6 shadow-xl dark:border-stone-700">
        <h2
          id="fms-ambassador-referral-title"
          className="font-serif text-xl text-stone-900 dark:text-stone-50"
        >
          {t("account.ambassadorPopupTitle")}
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-stone-700 dark:text-stone-300">
          {tr("account.ambassadorPopupIntro", { name: props.ambassadorNameZh })}
        </p>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-stone-700 dark:text-stone-300">
          <li>{t("account.ambassadorPopupDfestival")}</li>
          <li>{t("account.ambassadorPopupDmasters")}</li>
        </ul>
        <p className="mt-4 text-xs leading-relaxed text-amber-900 dark:text-amber-200/90">
          {t("account.ambassadorPopupNote")}
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={copyAll}
            className="rounded-full bg-violet-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-violet-800 dark:bg-violet-600 dark:hover:bg-violet-500"
          >
            {copied ? t("account.ambassadorPopupCopied") : t("account.ambassadorPopupCopyAll")}
          </button>
          <button
            type="button"
            onClick={props.onClose}
            className="rounded-full border border-stone-300 px-5 py-2.5 text-sm text-stone-800 dark:border-stone-600 dark:text-stone-200"
          >
            {t("account.ambassadorPopupClose")}
          </button>
        </div>
      </div>
    </div>
  );
}
