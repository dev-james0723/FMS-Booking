"use client";

import { useEffect, useId, useRef } from "react";

type Props = {
  open: boolean;
  message: string;
  title: string;
  okLabel: string;
  onDismiss: () => void;
};

export function RegistrationErrorModal({
  open,
  message,
  title,
  okLabel,
  onDismiss,
}: Props) {
  const titleId = useId();
  const descId = useId();
  const okRef = useRef<HTMLButtonElement>(null);

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
    const focusTimer = window.setTimeout(() => okRef.current?.focus(), 0);
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
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        className="w-full max-w-md rounded-xl border border-stone-200 bg-surface p-5 shadow-xl dark:border-stone-700"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <h2 id={titleId} className="font-serif text-lg text-stone-900 dark:text-stone-50">
          {title}
        </h2>
        <p
          id={descId}
          className="mt-3 whitespace-pre-wrap rounded-lg border border-red-200 bg-red-50 px-3 py-3 text-sm text-red-900 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-100"
        >
          {message}
        </p>
        <div className="mt-5 flex justify-end">
          <button
            ref={okRef}
            type="button"
            onClick={onDismiss}
            className="rounded-lg bg-stone-800 px-4 py-2 text-sm text-white hover:bg-stone-700 dark:bg-stone-200 dark:text-stone-900 dark:hover:bg-white"
          >
            {okLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
