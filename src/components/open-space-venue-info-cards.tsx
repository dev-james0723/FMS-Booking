"use client";

import { useTranslation } from "@/lib/i18n/use-translation";

const CARD_KEYS = [
  {
    icon: "booking.openSpace.infoCardAudienceIcon",
    title: "booking.openSpace.infoCardAudienceTitle",
    body: "booking.openSpace.infoCardAudienceBody",
  },
  {
    icon: "booking.openSpace.infoCardVenueIcon",
    title: "booking.openSpace.infoCardVenueTitle",
    body: "booking.openSpace.infoCardVenueBody",
  },
  {
    icon: "booking.openSpace.infoCardAreasIcon",
    title: "booking.openSpace.infoCardAreasTitle",
    body: "booking.openSpace.infoCardAreasBody",
  },
  {
    icon: "booking.openSpace.infoCardRuleIcon",
    title: "booking.openSpace.infoCardRuleTitle",
    body: "booking.openSpace.infoCardRuleBody",
  },
  {
    icon: "booking.openSpace.infoCardNoticeIcon",
    title: "booking.openSpace.infoCardNoticeTitle",
    body: "booking.openSpace.infoCardNoticeBody",
  },
] as const;

export function OpenSpaceVenueInfoCards({ compact = false }: { compact?: boolean }) {
  const { t } = useTranslation();
  const bodyCls = compact
    ? "text-xs leading-relaxed text-stone-700 dark:text-stone-300"
    : "text-sm leading-relaxed text-stone-700 dark:text-stone-300";
  const titleCls = compact
    ? "text-xs font-semibold text-stone-900 dark:text-stone-100"
    : "text-sm font-semibold text-stone-900 dark:text-stone-100";

  return (
    <div className="grid gap-3 sm:gap-4">
      {CARD_KEYS.map((keys) => (
        <div
          key={keys.title}
          className="flex gap-3 rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 dark:border-stone-700 dark:bg-stone-900/40"
        >
          <span
            className="shrink-0 select-none text-2xl leading-none pt-0.5"
            aria-hidden
          >
            {t(keys.icon)}
          </span>
          <div className="min-w-0">
            <h2 className={titleCls}>{t(keys.title)}</h2>
            <p className={`mt-1.5 ${bodyCls}`}>{t(keys.body)}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
