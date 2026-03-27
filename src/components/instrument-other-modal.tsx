"use client";

import Link from "next/link";
import { useEffect, useId, useState } from "react";
import { withBasePath } from "@/lib/base-path";
import {
  ORCHESTRA_CATEGORIES,
  getOrchestraInstrument,
  instrumentLabel,
  isLargerThanCello,
} from "@/lib/instruments/orchestra-instruments";
import type { Locale } from "@/lib/i18n/types";

type Props = {
  open: boolean;
  locale: Locale;
  /** When reopening the modal, restore the last confirmed instrument in the dropdown. */
  initialInstrumentId?: string | null;
  /**
   * User is already on open-space (large-instrument) registration (`?for=open-space`).
   * Allow confirming larger-than-cello instruments without redirecting to the separate info page.
   */
  forOpenSpaceRegistration?: boolean;
  onClose: () => void;
  onConfirm: (instrumentId: string, label: string) => void;
  t: (path: string) => string;
};

export function InstrumentOtherModal({
  open,
  locale,
  initialInstrumentId,
  forOpenSpaceRegistration = false,
  onClose,
  onConfirm,
  t,
}: Props) {
  const titleId = useId();
  const [selectedId, setSelectedId] = useState("");

  useEffect(() => {
    if (open) {
      setSelectedId(initialInstrumentId?.trim() ? initialInstrumentId : "");
    }
  }, [open, initialInstrumentId]);

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
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const selected = selectedId ? getOrchestraInstrument(selectedId) : undefined;
  const large = selectedId ? isLargerThanCello(selectedId) : false;
  const mustRedirectForLarge = large && !forOpenSpaceRegistration;

  function handleConfirm() {
    if (!selected) return;
    if (mustRedirectForLarge) return;
    onConfirm(selectedId, instrumentLabel(selected, locale));
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 p-4 sm:items-center"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="max-h-[min(90vh,32rem)] w-full max-w-md overflow-y-auto rounded-xl border border-stone-200 bg-surface p-5 shadow-xl dark:border-stone-700"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <h2 id={titleId} className="font-serif text-lg text-stone-900 dark:text-stone-50">
            {t("reg.instrumentModalTitle")}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg px-2 py-1 text-sm text-stone-600 hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-stone-800"
          >
            {t("reg.instrumentModalClose")}
          </button>
        </div>

        <p className="mt-3 text-xs leading-relaxed text-stone-600 dark:text-stone-400">
          {t("reg.instrumentPercussionNote")}
        </p>
        <p className="mt-2 text-xs leading-relaxed text-stone-600 dark:text-stone-400">
          {forOpenSpaceRegistration
            ? t("reg.instrumentModalSpaceNoteWhenOpenSpace")
            : t("reg.instrumentModalSpaceNote")}
        </p>

        <label className="mt-4 block text-sm">
          <span className="text-stone-700 dark:text-stone-300">{t("reg.instrumentSelectLabel")}</span>
          <select
            className="mt-1 w-full rounded-lg border border-stone-300 bg-surface-input px-3 py-2 text-sm text-foreground dark:border-stone-700"
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            aria-label={t("reg.instrumentSelectLabel")}
          >
            <option value="">{t("reg.instrumentSelectPlaceholder")}</option>
            {ORCHESTRA_CATEGORIES.map((cat) => (
              <optgroup key={cat.id} label={t(`reg.instrumentCat.${cat.id}`)}>
                {cat.instruments.map((inst) => (
                  <option key={inst.id} value={inst.id}>
                    {instrumentLabel(inst, locale)}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>

        {mustRedirectForLarge && selected && (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-3 dark:border-amber-900/50 dark:bg-amber-950/40">
            <Link
              href={withBasePath("/register/large-instrument")}
              onClick={onClose}
              className="motion-safe:animate-cta-attention flex w-full origin-center items-center justify-center rounded-[15px] bg-stone-900 px-3 py-2.5 text-center text-sm font-medium leading-snug text-white hover:bg-stone-800 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-stone-200"
            >
              {t("reg.instrumentLargeCta")}
            </Link>
          </div>
        )}

        <div className="mt-4 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-stone-300 px-4 py-2 text-sm text-stone-800 hover:bg-stone-50 dark:border-stone-600 dark:text-stone-200 dark:hover:bg-stone-800"
          >
            {t("reg.instrumentCancel")}
          </button>
          <button
            type="button"
            disabled={!selected || mustRedirectForLarge}
            onClick={handleConfirm}
            className="rounded-lg bg-stone-800 px-4 py-2 text-sm text-white hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-stone-200 dark:text-stone-900 dark:hover:bg-white"
          >
            {t("reg.instrumentConfirm")}
          </button>
        </div>
      </div>
    </div>
  );
}
