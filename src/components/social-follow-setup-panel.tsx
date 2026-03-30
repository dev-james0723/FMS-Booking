"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ElfsightDfestivalRepostWidget } from "@/components/elfsight-dfestival-repost-widget";
import {
  SOCIAL_FOLLOW_ACCOUNTS,
  SOCIAL_FOLLOW_LINK_KEYS,
  getSocialFollowUrl,
  type SocialFollowLinkKey,
} from "@/lib/social-follow";
import { withBasePath } from "@/lib/base-path";
import { useTranslation } from "@/lib/i18n/use-translation";

type ApiClicks = Partial<Record<SocialFollowLinkKey, boolean>>;

type Props = {
  /** Opaque token from registration (not logged in). */
  token?: string | null;
  /** Logged-in user finishing steps — uses session cookie, no token. */
  authenticated?: boolean;
  onGateStatus?: (s: { gateComplete: boolean }) => void;
};

export function SocialFollowSetupPanel({
  token,
  authenticated,
  onGateStatus,
}: Props) {
  const { t, tr } = useTranslation();
  const missingUrlCount = SOCIAL_FOLLOW_LINK_KEYS.filter((k) => !getSocialFollowUrl(k)).length;
  const sessionRefreshed = useRef(false);
  const onGateStatusRef = useRef<Props["onGateStatus"]>(onGateStatus);
  onGateStatusRef.current = onGateStatus;

  const [clicks, setClicks] = useState<ApiClicks>({});
  const [followVerified, setFollowVerified] = useState(false);
  const [repostConfirmed, setRepostConfirmed] = useState(false);
  const [gateComplete, setGateComplete] = useState(false);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingKey, setPendingKey] = useState<SocialFollowLinkKey | null>(null);
  const [repostBusy, setRepostBusy] = useState(false);
  const [userChoseNo, setUserChoseNo] = useState(false);

  const refreshSessionIfNeeded = useCallback(async () => {
    if (!authenticated || sessionRefreshed.current) return;
    sessionRefreshed.current = true;
    try {
      await fetch(withBasePath("/api/v1/auth/session/refresh"), {
        method: "POST",
        credentials: "same-origin",
      });
    } catch {
      sessionRefreshed.current = false;
    }
  }, [authenticated]);

  const applyState = useCallback(
    (data: Record<string, unknown>) => {
      if (data?.clicks && typeof data.clicks === "object") {
        setClicks(data.clicks as ApiClicks);
      }
      const v = data?.verified === true;
      const r = data?.repostConfirmed === true;
      const g = data?.gateComplete === true;
      setFollowVerified(v);
      setRepostConfirmed(r);
      setGateComplete(g);
      if (typeof data?.progress === "number") setProgress(data.progress as number);
      if (v && typeof data?.progress !== "number") setProgress(6);
      onGateStatusRef.current?.({ gateComplete: g });
      if (g && authenticated) void refreshSessionIfNeeded();
    },
    [authenticated, refreshSessionIfNeeded]
  );

  const buildBody = useCallback(
    (extra: Record<string, unknown>) => {
      const o: Record<string, unknown> = { ...extra };
      if (!authenticated) {
        if (!token) return null;
        o.token = token;
      }
      return o;
    },
    [authenticated, token]
  );

  const sync = useCallback(
    async (linkKey?: SocialFollowLinkKey) => {
      setError(null);
      if (linkKey) setPendingKey(linkKey);
      else setLoading(true);
      const body = buildBody(linkKey ? { linkKey } : {});
      if (!body) {
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(withBasePath("/api/v1/registration/social-follow-intent"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify(body),
        });
        const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
        if (!res.ok) {
          const msg =
            typeof (data?.error as { message?: string })?.message === "string"
              ? String((data.error as { message: string }).message).trim()
              : "";
          setError(
            msg || t("reg.socialFollowSetup.progressUpdateFail")
          );
          return;
        }
        applyState(data);
      } catch {
        setError(t("reg.socialFollowSetup.networkError"));
      } finally {
        setPendingKey(null);
        if (!linkKey) setLoading(false);
      }
    },
    [applyState, buildBody, t]
  );

  useEffect(() => {
    if (!authenticated && !token) {
      setLoading(false);
      return;
    }
    void sync();
  }, [authenticated, token, sync]);

  async function declareRepost(yes: boolean) {
    setError(null);
    setRepostBusy(true);
    const body = buildBody({ repostDeclaration: yes ? "yes" : "no" });
    if (!body) {
      setRepostBusy(false);
      return;
    }
    try {
      const res = await fetch(withBasePath("/api/v1/registration/social-follow-intent"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(body),
      });
      const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
      if (!res.ok) {
        const msg =
          typeof (data?.error as { message?: string })?.message === "string"
            ? String((data.error as { message: string }).message).trim()
            : "";
        setError(msg || t("reg.socialFollowSetup.progressUpdateFail"));
        return;
      }
      if (yes) setUserChoseNo(false);
      else setUserChoseNo(true);
      applyState(data);
    } catch {
      setError(t("reg.socialFollowSetup.networkError"));
    } finally {
      setRepostBusy(false);
    }
  }

  function openAndRecord(linkKey: SocialFollowLinkKey) {
    const url = getSocialFollowUrl(linkKey);
    if (!url) {
      setError(t("reg.socialFollowSetup.linkNotConfigured"));
      return;
    }
    window.open(url, "_blank", "noopener,noreferrer");
    void sync(linkKey);
  }

  if (!authenticated && !token) {
    return null;
  }

  if (gateComplete) {
    return (
      <section className="mx-auto mt-10 max-w-4xl rounded-2xl border border-emerald-200 bg-emerald-50/70 px-5 sm:px-4 py-6 text-left">
        <h2 className="font-serif text-lg text-stone-900 dark:text-stone-50">
          {t("reg.socialFollowSetup.allDoneTitle")}
        </h2>
        <p className="mt-2 text-sm text-stone-700 dark:text-stone-300">
          {authenticated
            ? t("reg.socialFollowSetup.allDoneBodyAuthed")
            : t("reg.socialFollowSetup.allDoneBodyPreLogin")}
        </p>
      </section>
    );
  }

  return (
    <div className="mx-auto mt-10 max-w-4xl space-y-8">
      {!followVerified ? (
        <section className="rounded-2xl border border-violet-200 bg-violet-50/50 px-5 sm:px-4 py-6 text-left">
          <h2 className="font-serif text-lg text-stone-900 dark:text-stone-50">
            {t("reg.socialFollowSetup.sectionTitle")}
          </h2>
          <p className="mt-2 text-sm font-medium text-stone-800 dark:text-stone-200">
            {t("reg.socialFollowSetup.intro")}
          </p>
          {missingUrlCount > 0 && (
            <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-950">
              {tr("reg.socialFollowSetup.missingUrls", { count: String(missingUrlCount) })}
            </p>
          )}
          {error && (
            <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900">
              {error}
            </p>
          )}
          <p className="mt-3 text-sm font-medium text-stone-800 dark:text-stone-200">
            {t("reg.socialFollowSetup.progressLabel")}
            {loading ? t("reg.socialFollowSetup.progressLoading") : `${progress} / 6`}
          </p>

          <div className="mt-6 grid gap-6 md:grid-cols-3">
            {SOCIAL_FOLLOW_ACCOUNTS.map((col) => (
              <div
                key={col.columnTitle}
                className="rounded-xl border border-stone-200 dark:border-stone-700 bg-surface px-3 py-4 shadow-sm"
              >
                <h3 className="text-sm font-semibold leading-snug text-stone-900 dark:text-stone-50">
                  {col.columnTitle}
                </h3>
                <div className="mt-4 flex flex-col gap-2">
                  <FollowButton
                    label="Instagram"
                    done={!!clicks[col.keys.ig]}
                    busy={pendingKey === col.keys.ig}
                    disabled={loading || !getSocialFollowUrl(col.keys.ig)}
                    onPress={() => openAndRecord(col.keys.ig)}
                  />
                  <FollowButton
                    label="Facebook"
                    done={!!clicks[col.keys.fb]}
                    busy={pendingKey === col.keys.fb}
                    disabled={loading || !getSocialFollowUrl(col.keys.fb)}
                    onPress={() => openAndRecord(col.keys.fb)}
                  />
                </div>
              </div>
            ))}
          </div>
          {t("reg.socialFollowSetup.desktopHint") ? (
            <p className="mt-4 text-xs font-medium text-amber-900 dark:text-amber-200">
              {t("reg.socialFollowSetup.desktopHint")}
            </p>
          ) : null}
        </section>
      ) : (
        <section className="rounded-2xl border border-emerald-200 bg-emerald-50/60 px-5 sm:px-4 py-5 text-left">
          <h2 className="font-serif text-lg text-stone-900 dark:text-stone-50">
            {t("reg.socialFollowSetup.followPhaseDoneTitle")}
          </h2>
          <p className="mt-2 text-sm text-stone-700 dark:text-stone-300">
            {t("reg.socialFollowSetup.followPhaseDoneBody")}
          </p>
        </section>
      )}

      {followVerified ? (
        <section className="space-y-4">
          <ElfsightDfestivalRepostWidget />
          {error && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900">
              {error}
            </p>
          )}
          <div className="rounded-2xl border border-stone-200 dark:border-stone-700 bg-surface px-5 sm:px-4 py-5 text-left">
            <h3 className="font-serif text-base text-stone-900 dark:text-stone-50">
              {t("reg.socialFollowSetup.repostDeclareTitle")}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-stone-600 dark:text-stone-400">
              {t("reg.socialFollowSetup.repostDeclareQuestion")}
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                disabled={repostBusy || repostConfirmed}
                onClick={() => void declareRepost(true)}
                className="rounded-full bg-emerald-700 px-6 py-2.5 text-sm font-medium text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {t("reg.socialFollowSetup.repostYes")}
              </button>
              <button
                type="button"
                disabled={repostBusy}
                onClick={() => void declareRepost(false)}
                className="rounded-full border border-stone-400 bg-surface px-6 py-2.5 text-sm font-medium text-stone-800 dark:text-stone-200 hover:bg-stone-50 dark:hover:bg-stone-800 disabled:opacity-50"
              >
                {t("reg.socialFollowSetup.repostNo")}
              </button>
            </div>
            {userChoseNo && !repostConfirmed ? (
              <p className="mt-4 text-xs text-amber-900 dark:text-amber-200">
                {t("reg.socialFollowSetup.repostNoReminder")}
              </p>
            ) : null}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function FollowButton({
  label,
  done,
  busy,
  disabled,
  onPress,
}: {
  label: string;
  done: boolean;
  busy: boolean;
  disabled: boolean;
  onPress: () => void;
}) {
  const { t, tr } = useTranslation();
  return (
    <button
      type="button"
      disabled={disabled || busy || done}
      onClick={onPress}
      className="flex w-full items-center justify-center gap-2 rounded-lg border border-stone-300 dark:border-stone-600 bg-stone-50 dark:bg-stone-900 px-3 py-2.5 text-sm font-medium text-stone-800 dark:text-stone-200 transition hover:bg-stone-100 dark:hover:bg-stone-700 dark:hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {done ? (
        <>
          <span className="text-emerald-600">✓</span> {tr("reg.socialFollowSetup.followed", { label })}
        </>
      ) : busy ? (
        <>{t("reg.socialFollowSetup.processing")}</>
      ) : (
        <>{tr("reg.socialFollowSetup.goTo", { label })}</>
      )}
    </button>
  );
}
