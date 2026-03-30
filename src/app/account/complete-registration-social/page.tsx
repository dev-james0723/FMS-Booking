"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useState } from "react";
import { SocialFollowSetupPanel } from "@/components/social-follow-setup-panel";
import { withBasePath } from "@/lib/base-path";
import { useTranslation } from "@/lib/i18n/use-translation";
import { safeNextPath } from "@/lib/safe-next-path";

function CompleteRegistrationSocialContent() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = safeNextPath(searchParams.get("next"), "/account");
  const [gateComplete, setGateComplete] = useState(false);

  const onGateStatus = useCallback((s: { gateComplete: boolean }) => {
    setGateComplete(s.gateComplete);
  }, []);

  return (
    <main className="mx-auto max-w-4xl px-5 sm:px-4 py-16">
      <h1 className="font-serif text-2xl text-stone-900 dark:text-stone-50">
        {t("reg.completeRegistrationSocial.title")}
      </h1>
      <p className="mt-4 text-sm leading-relaxed text-stone-600 dark:text-stone-400">
        {t("reg.completeRegistrationSocial.intro")}
      </p>
      <SocialFollowSetupPanel authenticated onGateStatus={onGateStatus} />
      {gateComplete ? (
        <div className="mt-10 flex justify-center">
          <button
            type="button"
            onClick={async () => {
              try {
                await fetch(withBasePath("/api/v1/auth/session/refresh"), {
                  method: "POST",
                  credentials: "same-origin",
                });
              } catch {
                /* still navigate — change-password is exempt from social-gate redirect */
              }
              router.refresh();
              router.push(
                `${withBasePath("/account/change-password")}?next=${encodeURIComponent(next)}`
              );
            }}
            className="rounded-full bg-stone-900 px-8 py-3 text-sm text-white hover:bg-stone-800"
          >
            {t("reg.completeRegistrationSocial.continueAfterDone")}
          </button>
        </div>
      ) : null}
    </main>
  );
}

export default function CompleteRegistrationSocialPage() {
  return (
    <Suspense
      fallback={<p className="mx-auto max-w-4xl px-5 py-16 text-stone-500">Loading…</p>}
    >
      <CompleteRegistrationSocialContent />
    </Suspense>
  );
}
