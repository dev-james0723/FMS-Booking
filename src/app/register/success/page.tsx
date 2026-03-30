"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ElfsightDfestivalRepostWidget } from "@/components/elfsight-dfestival-repost-widget";
import { SocialFollowSetupPanel } from "@/components/social-follow-setup-panel";
import { useTranslation } from "@/lib/i18n/use-translation";

type SuccessPayload = {
  email: string;
  tempPassword?: string;
  emailSent?: boolean;
  emailChannel?: string;
  devNote?: string;
  emailError?: string;
  socialFollowOptIn?: boolean;
  socialFollowSetupToken?: string | null;
};

export default function RegisterSuccessPage() {
  const { t } = useTranslation();
  const [payload, setPayload] = useState<SuccessPayload | null>(null);

  useEffect(() => {
    const id = window.setTimeout(() => {
      try {
        const raw = sessionStorage.getItem("fms_registration_success");
        if (!raw) return;
        sessionStorage.removeItem("fms_registration_success");
        const parsed = JSON.parse(raw) as SuccessPayload;
        if (parsed && typeof parsed.email === "string") {
          setPayload(parsed);
        }
      } catch {
        /* ignore */
      }
    }, 0);
    return () => window.clearTimeout(id);
  }, []);

  const showDevPassword = Boolean(payload?.tempPassword);

  return (
    <main className="mx-auto max-w-lg px-5 sm:px-4 py-24 text-center">
      <h1 className="font-serif text-2xl text-stone-900 dark:text-stone-50">
        {t("reg.successPage.title")}
      </h1>
      {payload?.emailSent ? (
        <p className="mt-4 text-sm text-stone-600 dark:text-stone-400">
          {t("reg.successPage.emailSentBody")}
        </p>
      ) : (
        <p className="mt-4 text-sm text-stone-600 dark:text-stone-400">
          {t("reg.successPage.emailNotSentBody")}
        </p>
      )}
      {payload?.devNote && (
        <p className="mx-auto mt-3 max-w-md rounded-lg border border-amber-200 bg-amber-50 px-5 sm:px-4 py-3 text-left text-sm text-amber-950">
          {payload.devNote}
        </p>
      )}
      {payload?.emailError && !payload.emailSent && (
        <p className="mx-auto mt-3 max-w-md rounded-lg border border-red-200 bg-red-50 px-5 sm:px-4 py-3 text-left text-xs text-red-900">
          {payload.emailError}
        </p>
      )}
      {showDevPassword && (
        <div className="mx-auto mt-6 max-w-md rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 px-5 sm:px-4 py-4 text-left text-sm text-stone-800 dark:text-stone-200">
          <p className="font-medium text-stone-900 dark:text-stone-50">
            {t("reg.successPage.devModeTitle")}
          </p>
          <p className="mt-2">
            <span className="text-stone-600 dark:text-stone-400">
              {t("reg.successPage.devEmailLabel")}
            </span>
            <br />
            <span className="mt-1 inline-block break-all font-mono text-stone-900 dark:text-stone-50">
              {payload!.email}
            </span>
          </p>
          <p className="mt-3">
            <span className="text-stone-600 dark:text-stone-400">
              {t("reg.successPage.devPasswordLabel")}
            </span>
            <br />
            <code className="mt-1 inline-block rounded-lg bg-surface px-3 py-2 font-mono text-stone-900 dark:text-stone-50 ring-1 ring-stone-200 dark:ring-stone-600">
              {payload!.tempPassword}
            </code>
          </p>
          <p className="mt-3 text-xs text-stone-500 dark:text-stone-500">
            {t("reg.successPage.devPasswordWarning")}
          </p>
        </div>
      )}
      <p className="mt-6 text-sm text-stone-600 dark:text-stone-400">
        {t("reg.successPage.footerHint")}
      </p>
      {payload?.socialFollowOptIn && payload.socialFollowSetupToken ? (
        <SocialFollowSetupPanel token={payload.socialFollowSetupToken} />
      ) : payload?.socialFollowOptIn && !payload.socialFollowSetupToken ? (
        <p className="mx-auto mt-8 max-w-md rounded-lg border border-amber-200 bg-amber-50 px-5 sm:px-4 py-3 text-left text-sm text-amber-950">
          {t("reg.successPage.socialFollowLinkMissing")}
        </p>
      ) : null}
      {payload ? <ElfsightDfestivalRepostWidget /> : null}
      <Link
        href="/login"
        className="mt-8 inline-block rounded-full bg-stone-900 px-8 py-3 text-sm text-white hover:bg-stone-800"
      >
        {t("reg.successPage.goLogin")}
      </Link>
    </main>
  );
}
