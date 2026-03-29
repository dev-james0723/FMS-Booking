import { Fragment } from "react";
import { sessionCountWithHoursPack, sessionHoursInnerLabel } from "@/lib/i18n/session-hours";
import type { Locale as AppLocale } from "@/lib/i18n/types";

type Locale = "zh" | "en";

function sessionHoursNote(locale: Locale, n: number): string {
  return locale === "zh"
    ? `（${sessionHoursInnerLabel("zh-HK", n)}）`
    : ` (${sessionHoursInnerLabel("en", n)})`;
}

const copy = {
  zh: {
    title: "用戶類別說明（與登記表一致）",
    intro: "請選最貼近您實際用途的一類；系統會據此紀錄並套用對應配額。",
    quotaCaption: "配額速覽（香港曆日）",
    quotaDay: "每日最多",
    quotaRolling: "連續 3 日最多",
    sessionUnit: "節",
    tierPersonal: "個人使用者配額",
    tierTeaching: "教學使用者配額",
    tierTeacherReferredStudent: "老師推薦之學生使用者配額",
    tierDualPracticeTeaching: "個人及教學（雙重需求）使用者配額",
    dualNote: "雙重身份不疊加兩套配額，一律按教學上限計。",
    cats: [
      {
        title: "個人使用者",
        tags: ["個人練習", "試奏／錄影", "學生・演奏者"],
        blurb: "以個人身份使用琴室，不含固定帶學生教學。",
        quota: "personal" as const,
        icon: "user",
      },
      {
        title: "教學／帶學生使用者",
        tags: ["上課", "帶學生", "私人老師／導師"],
        blurb: "主要用途為教學或陪同學生使用。",
        quota: "teaching" as const,
        icon: "teach",
      },
      {
        title: "老師推薦之學生",
        tags: ["學生身份", "需填推薦老師"],
        blurb: "經老師推薦參與，登記時填寫老師資料。",
        quota: "samePersonal" as const,
        icon: "referral",
      },
      {
        title: "個人及教學／帶學生（雙重需求）",
        tags: ["練習", "教學", "同一帳戶"],
        blurb: "同時有個人使用與教學需求者選此項。",
        quota: "teachingDual" as const,
        icon: "both",
      },
    ],
  },
  en: {
    title: "User categories (same as registration)",
    intro: "Pick the option that matches how you will use the studio; quotas follow the tier shown below.",
    quotaCaption: "Quota at a glance (Hong Kong calendar days)",
    quotaDay: "Max per day",
    quotaRolling: "Max in any 3 days",
    sessionUnit: "sessions",
    tierPersonal: "Individual user quota",
    tierTeaching: "Teaching user quota",
    tierTeacherReferredStudent: "Teacher-referred student quota",
    tierDualPracticeTeaching: "Practice & teaching (dual need) quota",
    dualNote: "Dual use does not double quotas; the teaching cap applies to all sessions.",
    cats: [
      {
        title: "Individual user",
        tags: ["Practice", "Try-outs / recording", "Students & performers"],
        blurb: "Personal use of the studio, not primarily teaching with students.",
        quota: "personal" as const,
        icon: "user",
      },
      {
        title: "Teaching / with students",
        tags: ["Lessons", "With students", "Private teachers"],
        blurb: "Teaching or regularly bringing students as the main use.",
        quota: "teaching" as const,
        icon: "teach",
      },
      {
        title: "Student referred by a teacher",
        tags: ["Student use", "Referrer details"],
        blurb: "Taking part via a teacher referral; enter referrer on registration.",
        quota: "samePersonal" as const,
        icon: "referral",
      },
      {
        title: "Both practice & teaching",
        tags: ["Practice", "Teaching", "One account"],
        blurb: "You need both personal practice and teaching slots.",
        quota: "teachingDual" as const,
        icon: "both",
      },
    ],
  },
} as const;

function IconUser({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.5 20.118a7.5 7.5 0 0115 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.5-1.632z" />
    </svg>
  );
}

function IconTeach({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
      />
    </svg>
  );
}

function IconReferral({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
    </svg>
  );
}

function IconBoth({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5"
      />
    </svg>
  );
}

const iconMap = {
  user: IconUser,
  teach: IconTeach,
  referral: IconReferral,
  both: IconBoth,
} as const;

const iconStyles: Record<string, string> = {
  user: "bg-teal-500/15 text-teal-700 dark:text-teal-300 ring-teal-500/25",
  teach: "bg-violet-500/15 text-violet-700 dark:text-violet-300 ring-violet-500/25",
  referral: "bg-amber-500/15 text-amber-800 dark:text-amber-200 ring-amber-500/25",
  both: "bg-sky-500/15 text-sky-800 dark:text-sky-200 ring-sky-500/25",
};

type QuotaTableLabelKey =
  | "tierPersonal"
  | "tierTeaching"
  | "tierTeacherReferredStudent"
  | "tierDualPracticeTeaching";

const QUOTA_TABLE_ROWS: Array<{
  labelKey: QuotaTableLabelKey;
  dot: string;
  cellBg: string;
  numColor: string;
  day: number;
  rolling: number;
}> = [
  {
    labelKey: "tierPersonal",
    dot: "bg-teal-500",
    cellBg: "bg-teal-500/5",
    numColor: "text-teal-800 dark:text-teal-200",
    day: 5,
    rolling: 7,
  },
  {
    labelKey: "tierTeaching",
    dot: "bg-violet-500",
    cellBg: "bg-violet-500/5",
    numColor: "text-violet-800 dark:text-violet-200",
    day: 8,
    rolling: 16,
  },
  {
    labelKey: "tierTeacherReferredStudent",
    dot: "bg-amber-500",
    cellBg: "bg-amber-500/5",
    numColor: "text-amber-800 dark:text-amber-200",
    day: 5,
    rolling: 7,
  },
  {
    labelKey: "tierDualPracticeTeaching",
    dot: "bg-sky-500",
    cellBg: "bg-sky-500/5",
    numColor: "text-sky-800 dark:text-sky-200",
    day: 8,
    rolling: 16,
  },
];

export function FaqUserCategoriesSection({ locale }: { locale: Locale }) {
  const t = copy[locale];

  return (
    <section id="user-types" className="scroll-mt-24">
      <h2 className="font-serif text-xl text-stone-900 dark:text-stone-50">{t.title}</h2>
      <p className="mt-3 text-stone-600 dark:text-stone-400">{t.intro}</p>

      <div
        className="mt-5 overflow-hidden rounded-xl border border-stone-200 dark:border-stone-700 bg-surface"
        role="region"
        aria-label={t.quotaCaption}
      >
        <p className="border-b border-stone-200 bg-stone-100/80 px-4 py-2.5 text-xs font-medium uppercase tracking-wide text-stone-600 dark:border-stone-700 dark:bg-stone-800/80 dark:text-stone-400">
          {t.quotaCaption}
        </p>
        <div className="grid grid-cols-[minmax(0,1.4fr)_1fr_1fr] text-sm">
          <div className="border-b border-stone-200 px-3 py-2.5 font-medium text-stone-500 dark:border-stone-700 dark:text-stone-400 sm:px-4" />
          <div className="border-b border-l border-stone-200 px-2 py-2.5 text-center text-xs font-semibold text-stone-700 dark:border-stone-700 dark:text-stone-200 sm:px-3 sm:text-sm">
            {t.quotaDay}
          </div>
          <div className="border-b border-l border-stone-200 px-2 py-2.5 text-center text-xs font-semibold text-stone-700 dark:border-stone-700 dark:text-stone-200 sm:px-3 sm:text-sm">
            {t.quotaRolling}
          </div>
          {QUOTA_TABLE_ROWS.map((row, i) => (
            <Fragment key={row.labelKey}>
              <div
                className={`flex items-center gap-2 px-3 py-3 sm:px-4 ${i > 0 ? "border-t border-stone-200 dark:border-stone-700" : ""}`}
              >
                <span className={`inline-block h-2 w-2 shrink-0 rounded-full ${row.dot}`} aria-hidden />
                <span className="font-medium text-stone-900 dark:text-stone-50">{t[row.labelKey]}</span>
              </div>
              <div
                className={`flex flex-col items-center justify-center border-l border-stone-200 px-2 py-3 text-center dark:border-stone-700 ${row.cellBg} ${i > 0 ? "border-t border-stone-200 dark:border-stone-700" : ""}`}
              >
                <span className={`text-lg font-semibold tabular-nums ${row.numColor}`}>
                  {row.day}
                  <span className="ml-1 text-xs font-normal text-stone-500 dark:text-stone-400">{t.sessionUnit}</span>
                </span>
                <span className="mt-0.5 text-[10px] leading-tight text-stone-500 dark:text-stone-400">
                  {sessionHoursNote(locale, row.day)}
                </span>
              </div>
              <div
                className={`flex flex-col items-center justify-center border-l border-stone-200 px-2 py-3 text-center dark:border-stone-700 ${row.cellBg} ${i > 0 ? "border-t border-stone-200 dark:border-stone-700" : ""}`}
              >
                <span className={`text-lg font-semibold tabular-nums ${row.numColor}`}>
                  {row.rolling}
                  <span className="ml-1 text-xs font-normal text-stone-500 dark:text-stone-400">{t.sessionUnit}</span>
                </span>
                <span className="mt-0.5 text-[10px] leading-tight text-stone-500 dark:text-stone-400">
                  {sessionHoursNote(locale, row.rolling)}
                </span>
              </div>
            </Fragment>
          ))}
        </div>
      </div>

      <ul className="mt-5 space-y-3 list-none p-0">
        {t.cats.map((cat) => {
          const Icon = iconMap[cat.icon];
          const ring = iconStyles[cat.icon];
          let quotaLabel: string;
          const appLoc: AppLocale = locale === "zh" ? "zh-HK" : "en";
          if (cat.quota === "personal") {
            quotaLabel = `${t.tierPersonal} · ${sessionCountWithHoursPack(appLoc, 5)}／${sessionCountWithHoursPack(appLoc, 7)}`;
          } else if (cat.quota === "teaching") {
            quotaLabel = `${t.tierTeaching} · ${sessionCountWithHoursPack(appLoc, 8)}／${sessionCountWithHoursPack(appLoc, 16)}`;
          } else if (cat.quota === "samePersonal") {
            quotaLabel = `${t.tierTeacherReferredStudent} · ${sessionCountWithHoursPack(appLoc, 5)}／${sessionCountWithHoursPack(appLoc, 7)}`;
          } else {
            quotaLabel = `${t.tierDualPracticeTeaching} · ${sessionCountWithHoursPack(appLoc, 8)}／${sessionCountWithHoursPack(appLoc, 16)}`;
          }
          return (
            <li
              key={cat.title}
              className="rounded-xl border border-stone-200 dark:border-stone-700 bg-surface px-4 py-4 sm:px-5"
            >
              <div className="flex gap-4">
                <div
                  className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ring-1 ring-inset ${ring}`}
                >
                  <Icon className="h-7 w-7" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-stone-900 dark:text-stone-50">{cat.title}</h3>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {cat.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-stone-200 bg-stone-100/80 px-2.5 py-0.5 text-xs font-medium text-stone-700 dark:border-stone-600 dark:bg-stone-800/80 dark:text-stone-300"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">{cat.blurb}</p>
                  <p className="mt-3 inline-flex flex-wrap items-center gap-2">
                    <span className="rounded-lg bg-stone-900 px-2.5 py-1 text-xs font-semibold text-stone-50 dark:bg-stone-100 dark:text-stone-900">
                      {quotaLabel}
                    </span>
                    {cat.quota === "teachingDual" ? (
                      <span className="text-xs text-stone-500 dark:text-stone-400">{t.dualNote}</span>
                    ) : null}
                  </p>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
