"use client";

import Link from "next/link";
import { useTranslation } from "@/lib/i18n/use-translation";

type Props = {
  open: boolean;
  passkeysSupported: boolean;
  onLater: () => void;
};

export function PasskeySetupAfterResetModal({
  open,
  passkeysSupported,
  onLater,
}: Props) {
  const { t } = useTranslation();
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal
      aria-labelledby="passkey-reset-prompt-title"
    >
      <div className="max-w-md rounded-2xl border border-stone-200 bg-surface p-6 shadow-lg dark:border-stone-700">
        <h2
          id="passkey-reset-prompt-title"
          className="font-serif text-lg text-stone-900 dark:text-stone-50"
        >
          {t("forgotPassword.passkeyTitle")}
        </h2>
        <p className="mt-3 text-sm text-stone-600 dark:text-stone-400">
          {t("forgotPassword.passkeyBody")}
        </p>
        {!passkeysSupported && (
          <p className="mt-2 text-xs text-amber-800 dark:text-amber-200/90">
            {t("reg.errWebauthnBrowser")}
          </p>
        )}
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onLater}
            className="rounded-full border border-stone-300 px-4 py-2 text-sm text-stone-800 hover:bg-stone-50 dark:border-stone-600 dark:text-stone-200 dark:hover:bg-stone-800"
          >
            {t("forgotPassword.passkeyLater")}
          </button>
          {passkeysSupported ? (
            <Link
              href="/account/passkeys"
              className="inline-flex justify-center rounded-full bg-stone-900 px-4 py-2 text-center text-sm text-white hover:bg-stone-800 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-stone-200"
            >
              {t("forgotPassword.passkeySetup")}
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}
