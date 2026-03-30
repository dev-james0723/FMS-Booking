"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
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

function RegisterSuccessInner() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const tokenFromUrl = searchParams.get("t");
  const [payload, setPayload] = useState<SuccessPayload | null>(null);
  const [gateComplete, setGateComplete] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  const onGateStatus = useCallback((s: { gateComplete: boolean }) => {
    setGateComplete(s.gateComplete);
  }, []);

  useEffect(() => {
    const id = window.setTimeout(() => {
      try {
        const raw = sessionStorage.getItem("fms_registration_success");
        if (raw) {
          sessionStorage.removeItem("fms_registration_success");
          const parsed = JSON.parse(raw) as SuccessPayload;
          if (parsed && typeof parsed.email === "string") {
            setPayload(parsed);
          }
        }
      } catch {
        /* ignore */
      } finally {
        setHydrated(true);
      }
    }, 0);
    return () => window.clearTimeout(id);
  }, []);

  const setupToken = useMemo(() => {
    if (typeof tokenFromUrl === "string" && tokenFromUrl.length >= 16) return tokenFromUrl;
    if (typeof payload?.socialFollowSetupToken === "string") return payload.socialFollowSetupToken;
    return null;
  }, [tokenFromUrl, payload?.socialFollowSetupToken]);

  const showDevPassword = Boolean(payload?.tempPassword);
  /** Setup token is only issued when the user opted in to the social follow commitment. */
  const showSocialPanel = Boolean(setupToken);
  const socialBlocksLogin = Boolean(setupToken);

  return (
    <main className="mx-auto max-w-4xl px-5 sm:px-4 py-24 text-center">
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
      {showSocialPanel ? (
        <SocialFollowSetupPanel token={setupToken} onGateStatus={onGateStatus} />
      ) : payload?.socialFollowOptIn === true && !setupToken ? (
        <p className="mx-auto mt-8 max-w-md rounded-lg border border-amber-200 bg-amber-50 px-5 sm:px-4 py-3 text-left text-sm text-amber-950">
          {t("reg.successPage.socialFollowLinkMissing")}
        </p>
      ) : null}
      <div className="mt-10">
        {!hydrated ? (
          <p className="text-sm text-stone-500 dark:text-stone-400">…</p>
        ) : socialBlocksLogin && !gateComplete ? (
          t("reg.successPage.goLoginBlocked") ? (
            <p className="mx-auto max-w-lg text-sm text-amber-900 dark:text-amber-200">
              {t("reg.successPage.goLoginBlocked")}
            </p>
          ) : null
        ) : (
          <Link
            href="/login"
            className="inline-block rounded-full bg-stone-900 px-8 py-3 text-sm text-white hover:bg-stone-800"
          >
            {t("reg.successPage.goLogin")}
          </Link>
        )}
      </div>
    </main>
  );
}

export default function RegisterSuccessPage() {
  return (
    <Suspense
      fallback={<main className="mx-auto max-w-lg px-5 py-24 text-center text-stone-500">Loading…</main>}
    >
      <RegisterSuccessInner />
    </Suspense>
  );
}
