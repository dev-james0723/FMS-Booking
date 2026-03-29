import type { ReactNode } from "react";
import {
  BookingIconCalendarRolling,
  BookingIconCooldown,
  BookingIconDualQuotaTier,
  BookingIconIdentityPick,
  BookingIconMentorStudent,
  BookingIconPerson,
  BookingIconSingleBucket,
  BookingIconSlot30,
  BookingIconTeaching,
} from "@/components/booking-quota-icons";

type T = (path: string) => string;
type Tr = (path: string, vars: Record<string, string>) => string;

type DayPillTone = "today" | "bookable" | "blocked";

function RollingDayArrow() {
  return (
    <span className="select-none px-0.5 text-[11px] text-stone-400 dark:text-stone-500" aria-hidden>
      →
    </span>
  );
}

function RollingDayPill({
  dateLine,
  tone,
  todayLabel,
  bookableLabel,
  blockedLabel,
}: {
  dateLine: string;
  tone: DayPillTone;
  todayLabel: string;
  bookableLabel: string;
  blockedLabel: string;
}) {
  const shell =
    tone === "today"
      ? "border-violet-500/65 bg-violet-100 shadow-sm dark:border-violet-400/55 dark:bg-violet-950/45"
      : tone === "bookable"
        ? "border-emerald-600/45 bg-emerald-50 dark:border-emerald-500/40 dark:bg-emerald-950/40"
        : "border-dashed border-stone-300 bg-stone-100/70 dark:border-stone-600 dark:bg-stone-800/55";
  const foot =
    tone === "today" ? todayLabel : tone === "bookable" ? bookableLabel : blockedLabel;
  return (
    <div
      className={`flex min-w-[3.1rem] flex-col items-center rounded-lg border px-2 py-1.5 text-center ${shell}`}
    >
      <span className="text-[11px] font-semibold tabular-nums text-stone-900 dark:text-stone-50">
        {dateLine}
      </span>
      <span className="mt-1 text-[9px] font-medium leading-none text-stone-600 dark:text-stone-400">
        {foot}
      </span>
    </div>
  );
}

function RollingRuleExpanded({ t, tr, windowDays }: { t: T; tr: Tr; windowDays: string }) {
  const todayL = t("booking.request.ruleRollingLabelToday");
  const bookL = t("booking.request.ruleRollingLabelBookable");
  const blockL = t("booking.request.ruleRollingLabelBlocked");

  return (
    <div className="mt-2 space-y-3 border-l-2 border-stone-200 pl-2.5 text-[11px] leading-relaxed text-stone-600 dark:border-stone-600 dark:text-stone-400">
      <div className="space-y-1.5">
        <p>{t("booking.request.ruleRollingIntro1")}</p>
        <p>{tr("booking.request.ruleRollingIntro2", { windowDays })}</p>
      </div>

      <div
        className="rounded-lg border border-stone-200/90 bg-gradient-to-b from-stone-50/90 to-white/80 p-2.5 dark:border-stone-600 dark:from-stone-950/50 dark:to-stone-900/35"
        role="region"
        aria-label={t("booking.request.ruleRollingVisTitle")}
      >
        <p className="text-[10px] font-semibold uppercase tracking-wide text-violet-800 dark:text-violet-300">
          {t("booking.request.ruleRollingVisTitle")}
        </p>
        <p className="mt-1.5 text-[11px] text-stone-600 dark:text-stone-400">
          {t("booking.request.ruleRollingVisSchematicCaption")}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-y-1">
          <RollingDayPill
            dateLine={t("booking.request.ruleRollingVisDay0")}
            tone="today"
            todayLabel={todayL}
            bookableLabel={bookL}
            blockedLabel={blockL}
          />
          <RollingDayArrow />
          <RollingDayPill
            dateLine={t("booking.request.ruleRollingVisDay1")}
            tone="bookable"
            todayLabel={todayL}
            bookableLabel={bookL}
            blockedLabel={blockL}
          />
          <RollingDayArrow />
          <RollingDayPill
            dateLine={t("booking.request.ruleRollingVisDay2")}
            tone="bookable"
            todayLabel={todayL}
            bookableLabel={bookL}
            blockedLabel={blockL}
          />
        </div>
        <p className="mt-2 flex items-start gap-1.5 text-[10px] text-stone-500 dark:text-stone-500">
          <span className="mt-0.5 inline-block h-3 w-3 shrink-0 rounded-sm bg-violet-400/80 dark:bg-violet-500/70" />
          <span>{t("booking.request.ruleRollingVisRollHint")}</span>
        </p>
      </div>

      <div>
        <p className="mb-2 text-[10px] font-semibold text-stone-700 dark:text-stone-300">
          {t("booking.request.ruleRollingExamplesTitle")}
        </p>
        <div className="space-y-3">
          <div>
            <p className="mb-1.5 text-[11px] font-medium text-stone-800 dark:text-stone-200">
              {t("booking.request.ruleRollingEx1Caption")}
            </p>
            <div className="flex flex-wrap items-center gap-y-1">
              <RollingDayPill
                dateLine="4 / 1"
                tone="today"
                todayLabel={todayL}
                bookableLabel={bookL}
                blockedLabel={blockL}
              />
              <RollingDayArrow />
              <RollingDayPill
                dateLine="4 / 2"
                tone="bookable"
                todayLabel={todayL}
                bookableLabel={bookL}
                blockedLabel={blockL}
              />
              <RollingDayArrow />
              <RollingDayPill
                dateLine="4 / 3"
                tone="bookable"
                todayLabel={todayL}
                bookableLabel={bookL}
                blockedLabel={blockL}
              />
            </div>
          </div>
          <div>
            <p className="mb-1.5 text-[11px] font-medium text-stone-800 dark:text-stone-200">
              {t("booking.request.ruleRollingEx2Caption")}
            </p>
            <div className="flex flex-wrap items-center gap-y-1">
              <RollingDayPill
                dateLine="4 / 1"
                tone="blocked"
                todayLabel={todayL}
                bookableLabel={bookL}
                blockedLabel={blockL}
              />
              <RollingDayArrow />
              <RollingDayPill
                dateLine="4 / 2"
                tone="today"
                todayLabel={todayL}
                bookableLabel={bookL}
                blockedLabel={blockL}
              />
              <RollingDayArrow />
              <RollingDayPill
                dateLine="4 / 3"
                tone="bookable"
                todayLabel={todayL}
                bookableLabel={bookL}
                blockedLabel={blockL}
              />
              <RollingDayArrow />
              <RollingDayPill
                dateLine="4 / 4"
                tone="bookable"
                todayLabel={todayL}
                bookableLabel={bookL}
                blockedLabel={blockL}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function RuleCard({
  media,
  title,
  summary,
  detailsContent,
  detailsLabel,
}: {
  media: ReactNode;
  title: string;
  summary: string;
  detailsContent?: ReactNode;
  detailsLabel?: string;
}) {
  return (
    <div className="rounded-xl border border-stone-200 bg-white/90 px-3.5 py-3 shadow-sm dark:border-stone-700 dark:bg-stone-900/45">
      <div className="flex gap-3">
        <div className="shrink-0">{media}</div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-stone-900 dark:text-stone-50">{title}</p>
          <p className="mt-1 text-xs leading-relaxed text-stone-600 dark:text-stone-400">{summary}</p>
          {detailsContent && detailsLabel ? (
            <details className="mt-2 text-xs text-stone-600 dark:text-stone-400">
              <summary className="cursor-pointer select-none font-medium text-blue-800 underline decoration-blue-800/40 underline-offset-2 hover:text-blue-900 dark:text-blue-300 dark:decoration-blue-300/40 dark:hover:text-blue-200">
                {detailsLabel}
              </summary>
              {typeof detailsContent === "string" ? (
                <p className="mt-2 whitespace-pre-line border-l-2 border-stone-200 pl-2.5 text-[11px] leading-relaxed text-stone-500 dark:border-stone-600 dark:text-stone-500">
                  {detailsContent}
                </p>
              ) : (
                detailsContent
              )}
            </details>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function IconWrap({
  children,
  className,
}: {
  children: ReactNode;
  className: string;
}) {
  return (
    <div
      className={`flex h-11 w-11 items-center justify-center rounded-lg ${className}`}
      aria-hidden
    >
      {children}
    </div>
  );
}

export function BookingRulesVisual({ t, tr, windowDays }: { t: T; tr: Tr; windowDays: string }) {
  return (
    <div className="space-y-3">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400">
        {t("booking.request.rulesAtAGlance")}
      </h2>
      <div className="grid grid-cols-1 gap-3">
        <RuleCard
          media={
            <IconWrap className="bg-violet-100 text-violet-800 dark:bg-violet-950/55 dark:text-violet-200">
              <BookingIconCalendarRolling className="h-6 w-6" />
            </IconWrap>
          }
          title={t("booking.request.ruleCardRollingTitle")}
          summary={tr("booking.request.ruleCardRollingSummary", { windowDays })}
          detailsContent={<RollingRuleExpanded t={t} tr={tr} windowDays={windowDays} />}
          detailsLabel={t("booking.request.ruleRollingExpand")}
        />

        <RuleCard
          media={
            <IconWrap className="bg-amber-100 text-amber-900 dark:bg-amber-950/45 dark:text-amber-200">
              <BookingIconSlot30 className="h-6 w-6" />
            </IconWrap>
          }
          title={t("booking.request.ruleCardSlotTitle")}
          summary={t("booking.request.ruleCardSlotSummary")}
        />

        <RuleCard
          media={
            <IconWrap className="bg-sky-100 text-sky-800 dark:bg-sky-950/50 dark:text-sky-200">
              <BookingIconPerson className="h-6 w-6" />
            </IconWrap>
          }
          title={t("booking.request.ruleCardIndividualTitle")}
          summary={t("booking.request.ruleCardIndividualSummary")}
        />

        <RuleCard
          media={
            <IconWrap className="bg-teal-100 text-teal-800 dark:bg-teal-950/50 dark:text-teal-200">
              <BookingIconMentorStudent className="h-6 w-6" />
            </IconWrap>
          }
          title={t("booking.request.ruleCardTeacherReferredTitle")}
          summary={t("booking.request.ruleCardTeacherReferredSummary")}
        />

        <RuleCard
          media={
            <IconWrap className="bg-indigo-100 text-indigo-900 dark:bg-indigo-950/50 dark:text-indigo-200">
              <BookingIconTeaching className="h-6 w-6" />
            </IconWrap>
          }
          title={t("booking.request.ruleCardTeachingTitle")}
          summary={t("booking.request.ruleCardTeachingSummary")}
        />

        <RuleCard
          media={
            <IconWrap className="bg-fuchsia-100 text-fuchsia-900 dark:bg-fuchsia-950/45 dark:text-fuchsia-200">
              <BookingIconDualQuotaTier className="h-6 w-6" />
            </IconWrap>
          }
          title={t("booking.request.ruleCardDualQuotaTitle")}
          summary={t("booking.request.ruleCardDualQuotaSummary")}
        />

        <RuleCard
          media={
            <IconWrap className="bg-orange-100 text-orange-900 dark:bg-orange-950/45 dark:text-orange-200">
              <BookingIconCooldown className="h-6 w-6" />
            </IconWrap>
          }
          title={t("booking.request.ruleCardCooldownTitle")}
          summary={t("booking.request.ruleCardCooldownSummary")}
        />

        <RuleCard
          media={
            <IconWrap className="bg-rose-100 text-rose-900 dark:bg-rose-950/45 dark:text-rose-200">
              <BookingIconIdentityPick className="h-6 w-6" />
            </IconWrap>
          }
          title={t("booking.request.ruleCardIdentityTitle")}
          summary={t("booking.request.ruleCardIdentitySummary")}
        />

        <RuleCard
          media={
            <IconWrap className="bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-200">
              <BookingIconSingleBucket className="h-6 w-6" />
            </IconWrap>
          }
          title={t("booking.request.ruleCardBucketTitle")}
          summary={t("booking.request.ruleCardBucketSummary")}
        />
      </div>
    </div>
  );
}
