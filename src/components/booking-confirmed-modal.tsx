"use client";

import Link from "next/link";
import { useEffect, useId, useRef } from "react";
import { useTranslation } from "@/lib/i18n/use-translation";

type Props = {
  open: boolean;
  bookingRequestId: string;
  historyHref: string;
  onDismiss: () => void;
};

function CheckCircleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.75" className="opacity-25" />
      <path
        d="M8.5 12.2 11 14.7l5-5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function HashIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M10 4 8 20M16 4l-2 16M5 9h14M4 15h14"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MailIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.75" />
      <path d="m3 7 9 6 9-6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function BookingConfirmedModal({
  open,
  bookingRequestId,
  historyHref,
  onDismiss,
}: Props) {
  const { t } = useTranslation();
  const titleId = useId();
  const descId = useId();
  const emailHintId = useId();
  const primaryRef = useRef<HTMLAnchorElement>(null);
  const unknownRef = bookingRequestId === "OK";

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const focusTimer = window.setTimeout(() => primaryRef.current?.focus(), 0);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onDismiss();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(focusTimer);
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onDismiss]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[110] flex items-end justify-center bg-black/50 p-4 sm:items-center"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onDismiss();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={`${descId} ${emailHintId}`}
        className="w-full max-w-md overflow-hidden rounded-2xl border border-stone-200 bg-surface shadow-2xl dark:border-stone-700"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="relative bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 px-6 pb-10 pt-8 text-center text-white">
          <div
            className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/20 ring-4 ring-white/30 backdrop-blur-sm"
            aria-hidden
          >
            <CheckCircleIcon className="h-10 w-10 text-white" />
          </div>
          <h2 id={titleId} className="mt-4 font-serif text-xl font-semibold tracking-tight">
            {t("booking.request.confirmModalTitle")}
          </h2>
        </div>

        <div className="-mt-6 space-y-4 px-5 pb-5 pt-0">
          <div
            id={descId}
            className="rounded-xl border border-stone-200 bg-stone-50/95 px-4 py-3 dark:border-stone-600 dark:bg-stone-900/50"
          >
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200">
                <HashIcon className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1 text-left">
                <p className="text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400">
                  {t("booking.request.confirmModalRefLabel")}
                </p>
                {unknownRef ? (
                  <p className="mt-1 text-sm text-stone-700 dark:text-stone-300">
                    {t("booking.request.confirmModalRefUnknown")}
                  </p>
                ) : (
                  <p className="mt-1 break-all font-mono text-sm font-medium text-stone-900 dark:text-stone-100">
                    {bookingRequestId}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-3 rounded-xl border border-sky-200/80 bg-sky-50/90 px-4 py-3 dark:border-sky-900/50 dark:bg-sky-950/35">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sky-100 text-sky-800 dark:bg-sky-950/70 dark:text-sky-200">
              <MailIcon className="h-5 w-5" />
            </span>
            <p id={emailHintId} className="text-sm leading-relaxed text-sky-950 dark:text-sky-100">
              {t("booking.request.confirmModalEmailHint")}
            </p>
          </div>

          <div className="flex flex-col gap-2 pt-1">
            <Link
              ref={primaryRef}
              href={historyHref}
              className="inline-flex w-full items-center justify-center rounded-xl bg-stone-900 px-4 py-3 text-center text-sm font-semibold text-white shadow-sm transition hover:bg-stone-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-500 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-white"
            >
              {t("booking.request.viewHistory")}
            </Link>
            <button
              type="button"
              onClick={onDismiss}
              className="rounded-lg py-2 text-center text-sm text-stone-600 underline-offset-2 hover:underline dark:text-stone-400"
            >
              {t("booking.request.confirmModalDismiss")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
