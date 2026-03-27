"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { startRegistration } from "@simplewebauthn/browser";
import { RecaptchaV2, type RecaptchaV2Handle } from "@/components/recaptcha-v2";
import { withBasePath } from "@/lib/base-path";
import {
  CAMPAIGN_EXPERIENCE_FIRST_DAY_KEY,
  CAMPAIGN_EXPERIENCE_LAST_DAY_KEY,
} from "@/lib/booking/campaign-constants";
import { useTranslation } from "@/lib/i18n/use-translation";
import type { Locale } from "@/lib/i18n/types";
import { buildMonthGrid } from "@/lib/hk-calendar-client";

const IDENTITY_VALUES = [
  "student",
  "performer",
  "freelancer",
  "private_teacher",
  "music_tutor",
  "other",
] as const;

const PREFERRED_TIME_SLOT_IDS = [
  "slot_6_9",
  "slot_9_12",
  "slot_12_15",
  "slot_15_18",
  "slot_18_20",
] as const;

const USAGE_KEY_LIST = [
  "personal_practice",
  "trial_play",
  "audition_prep",
  "competition_recording",
  "rehearsal",
  "creation",
  "try_instrument",
  "teaching",
  "student_lesson",
  "student_recording",
] as const;

/** Optional; when unset, labels render as plain text (no outbound link). */
const DFESTIVAL_INFO_URL = process.env.NEXT_PUBLIC_DFESTIVAL_INFO_URL?.trim() ?? "";
const DMASTERS_INFO_URL = process.env.NEXT_PUBLIC_DMASTERS_INFO_URL?.trim() ?? "";

const interestLinkClass =
  "font-medium text-amber-600 underline decoration-amber-600/70 underline-offset-2 hover:text-amber-500";
const interestPlainClass = "font-medium text-stone-800 dark:text-stone-200";

function isPreferredCampaignDateKey(iso: string): boolean {
  return iso >= CAMPAIGN_EXPERIENCE_FIRST_DAY_KEY && iso <= CAMPAIGN_EXPERIENCE_LAST_DAY_KEY;
}

function formatHkPreferredDate(iso: string, locale: Locale): string {
  const [y, mo, da] = iso.split("-").map((x) => parseInt(x, 10));
  if (!y || !mo || !da) return iso;
  return new Date(y, mo - 1, da).toLocaleDateString(locale === "en" ? "en-GB" : "zh-HK", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  });
}

function formatRegistrationApiError(
  payload: unknown,
  t: (path: string) => string,
  locale: Locale,
): string {
  const fallback = t("reg.validationFail");
  if (!payload || typeof payload !== "object") return fallback;
  const err = (payload as { error?: { message?: string; details?: unknown } }).error;
  const base = typeof err?.message === "string" ? err.message : fallback;
  const details = err?.details;
  if (!details || typeof details !== "object") return base;
  const fieldErrors = (details as { fieldErrors?: Record<string, string[]> }).fieldErrors;
  if (!fieldErrors || typeof fieldErrors !== "object") return base;

  const listSep = locale === "en" ? "; " : "；";
  const kvSep = locale === "en" ? ": " : "：";
  const lines: string[] = [];
  for (const [key, msgs] of Object.entries(fieldErrors)) {
    if (!Array.isArray(msgs) || msgs.length === 0) continue;
    const labelPath = `reg.fieldLabels.${key}`;
    const label = t(labelPath) === labelPath ? key : t(labelPath);
    lines.push(`${label}${kvSep}${msgs.join(listSep)}`);
  }
  if (lines.length === 0) return base;
  return [t("reg.validationFixPrefix"), ...lines].join("\n");
}

function RegistrationPreferredDateMonth(props: {
  title: string;
  year: number;
  month1: number;
  selectedPreferredDates: string[];
  onToggleDate: (iso: string) => void;
  weekdays: string[];
}) {
  const grid = useMemo(
    () => buildMonthGrid(props.year, props.month1),
    [props.year, props.month1]
  );
  return (
    <div className="rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900/80 dark:bg-stone-900/80 p-4 lg:flex-1">
      <p className="text-center text-sm font-medium text-stone-800 dark:text-stone-200">{props.title}</p>
      <div className="mt-3 grid grid-cols-7 gap-1 text-center text-xs text-stone-500 dark:text-stone-500">
        {props.weekdays.map((w) => (
          <div key={w} className="py-1 font-medium">
            {w}
          </div>
        ))}
        {grid.map((cell, idx) => {
          if (!cell.dateKey) {
            return <div key={`pad-${props.month1}-${idx}`} />;
          }
          const iso = cell.dateKey;
          const on = props.selectedPreferredDates.includes(iso);
          const selectable = isPreferredCampaignDateKey(iso);
          const dayNum = Number(iso.slice(8, 10));
          if (!selectable) {
            return (
              <div
                key={iso}
                className="flex aspect-square items-center justify-center rounded-lg bg-stone-200/50 dark:bg-stone-700/50 text-sm font-medium text-stone-400 dark:text-stone-500"
              >
                {dayNum}
              </div>
            );
          }
          return (
            <button
              key={iso}
              type="button"
              onClick={() => props.onToggleDate(iso)}
              className={`aspect-square rounded-lg text-sm font-medium transition ${
                on
                  ? "bg-stone-900 text-white shadow-sm"
                  : "bg-surface text-stone-800 dark:text-stone-200 ring-1 ring-stone-200 dark:ring-stone-600 hover:bg-stone-100 dark:hover:bg-stone-800"
              }`}
            >
              {dayNum}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function RegistrationForm() {
  const { t, tr, locale } = useTranslation();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [nameZh, setNameZh] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [smsCode, setSmsCode] = useState("");
  const [phoneVerificationToken, setPhoneVerificationToken] = useState<string | null>(null);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [smsBusy, setSmsBusy] = useState(false);
  const [verifyBusy, setVerifyBusy] = useState(false);
  const [smsCooldown, setSmsCooldown] = useState(0);
  const [passkeyPreregToken, setPasskeyPreregToken] = useState<string | null>(null);
  const [passkeyBusy, setPasskeyBusy] = useState(false);
  const [webauthnSupported, setWebauthnSupported] = useState(false);
  const [age, setAge] = useState(18);
  const [teacherRecommended, setTeacherRecommended] = useState(false);
  const [teacherName, setTeacherName] = useState("");
  const [teacherContact, setTeacherContact] = useState("");
  const [userCategoryCode, setUserCategoryCode] = useState<"personal" | "teaching">("personal");
  const [instrumentField, setInstrumentField] = useState("");
  const [identityFlags, setIdentityFlags] = useState<string[]>([]);
  const [identityOtherText, setIdentityOtherText] = useState("");
  const [usage, setUsage] = useState<Record<string, boolean>>({});
  const [usageOther, setUsageOther] = useState("");
  const [selectedPreferredDates, setSelectedPreferredDates] = useState<string[]>([]);
  const [preferredTimeSlotIds, setPreferredTimeSlotIds] = useState<string[]>([]);
  const [extraNotes, setExtraNotes] = useState("");
  const [interestDfestival, setInterestDfestival] = useState(false);
  const [interestDmasters, setInterestDmasters] = useState(false);
  const [marketingOptIn, setMarketingOptIn] = useState(false);
  const [socialFollowClaimed, setSocialFollowClaimed] = useState(false);
  const [socialRepostClaimed, setSocialRepostClaimed] = useState(false);
  const [wantsAmbassador, setWantsAmbassador] = useState(false);
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [agreedPrivacy, setAgreedPrivacy] = useState(false);
  const [agreedEmailNotifications, setAgreedEmailNotifications] = useState(false);
  const [referralCode, setReferralCode] = useState("");

  const interestSelectAllRef = useRef<HTMLInputElement>(null);
  const consentSelectAllRef = useRef<HTMLInputElement>(null);
  const recaptchaRef = useRef<RecaptchaV2Handle>(null);

  const recaptchaSiteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY ?? "";
  const skipRecaptcha = process.env.NEXT_PUBLIC_SKIP_RECAPTCHA === "true";
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);

  const identityOptions = useMemo(
    () =>
      IDENTITY_VALUES.map((value) => ({
        value,
        label: t(`reg.identity.${value}`),
      })),
    [t],
  );

  const usageKeys = useMemo(
    () =>
      USAGE_KEY_LIST.map((key) => ({
        key,
        label: t(`reg.usage.${key}`),
      })),
    [t],
  );

  const preferredSlots = useMemo(
    () =>
      PREFERRED_TIME_SLOT_IDS.map((id) => ({
        id,
        label: t(`reg.slot.${id}`),
      })),
    [t],
  );

  const calWeekdays = useMemo(
    () => [
      t("reg.weekday.sun"),
      t("reg.weekday.mon"),
      t("reg.weekday.tue"),
      t("reg.weekday.wed"),
      t("reg.weekday.thu"),
      t("reg.weekday.fri"),
      t("reg.weekday.sat"),
    ],
    [t],
  );

  const interestCheckValues = [
    interestDfestival,
    interestDmasters,
    marketingOptIn,
    socialFollowClaimed,
    socialRepostClaimed,
    wantsAmbassador,
  ];
  const allInterestSelected = interestCheckValues.every(Boolean);
  const someInterestSelected = interestCheckValues.some(Boolean);

  useEffect(() => {
    const el = interestSelectAllRef.current;
    if (el) el.indeterminate = someInterestSelected && !allInterestSelected;
  }, [someInterestSelected, allInterestSelected]);

  const consentCheckValues = [agreedTerms, agreedPrivacy, agreedEmailNotifications];
  const allConsentSelected = consentCheckValues.every(Boolean);
  const someConsentSelected = consentCheckValues.some(Boolean);

  useEffect(() => {
    const el = consentSelectAllRef.current;
    if (el) el.indeterminate = someConsentSelected && !allConsentSelected;
  }, [someConsentSelected, allConsentSelected]);

  useEffect(() => {
    if (smsCooldown <= 0) return;
    const t = window.setInterval(() => {
      setSmsCooldown((s) => (s <= 1 ? 0 : s - 1));
    }, 1000);
    return () => window.clearInterval(t);
  }, [smsCooldown]);

  useEffect(() => {
    setWebauthnSupported(
      typeof window !== "undefined" && typeof window.PublicKeyCredential !== "undefined"
    );
  }, []);

  useEffect(() => {
    if (!identityFlags.includes("other")) setIdentityOtherText("");
  }, [identityFlags]);

  async function sendPhoneCode() {
    setError(null);
    const p = phone.trim();
    if (p.length < 8) {
      setError(t("reg.phoneRequired"));
      return;
    }
    setSmsBusy(true);
    try {
      const res = await fetch(withBasePath("/api/v1/registration/phone/send-code"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: p }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error?.message ?? t("reg.smsSendFail"));
        return;
      }
      setPhoneVerificationToken(null);
      setPhoneVerified(false);
      setSmsCode("");
      setSmsCooldown(60);
    } catch {
      setError(t("reg.networkError"));
    } finally {
      setSmsBusy(false);
    }
  }

  async function verifyPhoneCode() {
    setError(null);
    const p = phone.trim();
    if (!/^\d{6}$/.test(smsCode.trim())) {
      setError(t("reg.codeSixDigits"));
      return;
    }
    setVerifyBusy(true);
    try {
      const res = await fetch(withBasePath("/api/v1/registration/phone/verify-code"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: p, code: smsCode.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error?.message ?? t("reg.verifyFail"));
        setPhoneVerified(false);
        setPhoneVerificationToken(null);
        return;
      }
      const tok = data?.phoneVerificationToken;
      if (typeof tok !== "string" || !tok) {
        setError(t("reg.verifyResponseBad"));
        return;
      }
      setPhoneVerificationToken(tok);
      setPhoneVerified(true);
    } catch {
      setError(t("reg.networkError"));
    } finally {
      setVerifyBusy(false);
    }
  }

  async function bindPasskey() {
    setError(null);
    if (!email.trim()) {
      setError(t("reg.emailForPasskey"));
      return;
    }
    if (!phoneVerificationToken || !phoneVerified) {
      setError(t("reg.phoneVerifyFirst"));
      return;
    }
    setPasskeyBusy(true);
    try {
      const optRes = await fetch(withBasePath("/api/v1/registration/passkey/options"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          phone: phone.trim(),
          phoneVerificationToken,
          displayName: nameZh.trim() || undefined,
        }),
      });
      const optData = await optRes.json().catch(() => ({}));
      if (!optRes.ok) {
        setError(
          typeof optData?.error?.message === "string"
            ? optData.error.message
            : t("reg.passkeyStartFail")
        );
        return;
      }
      const options = optData?.options;
      const preregChallengeId = optData?.preregChallengeId;
      if (!options || typeof preregChallengeId !== "string") {
        setError(t("reg.serverErrorRetry"));
        return;
      }
      setPasskeyPreregToken(null);
      let attResp;
      try {
        attResp = await startRegistration({ optionsJSON: options });
      } catch (e) {
        console.error(e);
        setError(t("reg.passkeyEnv"));
        return;
      }
      const verRes = await fetch(withBasePath("/api/v1/registration/passkey/verify"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          preregChallengeId,
          email: email.trim(),
          phone: phone.trim(),
          phoneVerificationToken,
          credential: attResp,
        }),
      });
      const verData = await verRes.json().catch(() => ({}));
      if (!verRes.ok) {
        setError(
          typeof verData?.error?.message === "string" ? verData.error.message : t("reg.bindFail")
        );
        setPasskeyPreregToken(null);
        return;
      }
      const tok = verData?.passkeyPreregToken;
      if (typeof tok !== "string") {
        setError(t("reg.bindResponseBad"));
        return;
      }
      setPasskeyPreregToken(tok);
    } catch {
      setError(t("reg.networkError"));
    } finally {
      setPasskeyBusy(false);
    }
  }

  function toggleIdentity(v: string) {
    setIdentityFlags((prev) =>
      prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]
    );
  }

  function toggleUsage(key: string) {
    setUsage((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function togglePreferredDate(iso: string) {
    if (!isPreferredCampaignDateKey(iso)) return;
    setSelectedPreferredDates((prev) =>
      prev.includes(iso) ? prev.filter((x) => x !== iso) : [...prev, iso].sort()
    );
  }

  function togglePreferredTimeSlot(id: string) {
    setPreferredTimeSlotIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id].sort()
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (identityFlags.length === 0) {
      setError(t("reg.identityPickOne"));
      return;
    }
    if (identityFlags.includes("other") && !identityOtherText.trim()) {
      setError(t("reg.identityOtherDetail"));
      return;
    }
    if (!socialFollowClaimed || !socialRepostClaimed) {
      setError(t("reg.errSocialPromise"));
      return;
    }
    if (!agreedTerms || !agreedPrivacy || !agreedEmailNotifications) {
      setError(t("reg.consentThree"));
      return;
    }
    if (!Number.isFinite(age) || age < 1 || age > 120) {
      setError(t("reg.errAge"));
      return;
    }
    if (!phoneVerificationToken || !phoneVerified) {
      setError(t("reg.phoneSmsPasskey"));
      return;
    }
    if (!webauthnSupported) {
      setError(t("reg.errWebauthnBrowser"));
      return;
    }
    if (!passkeyPreregToken) {
      setError(t("reg.errPasskeyBeforeSubmit"));
      return;
    }
    if (recaptchaSiteKey && !skipRecaptcha && !captchaToken) {
      setError(t("reg.errCaptcha"));
      return;
    }
    setLoading(true);

    const usagePurposes: Record<string, boolean | string> = { ...usage };
    if (usageOther.trim()) usagePurposes.otherText = usageOther.trim();

    const preferredDatesArr = selectedPreferredDates.length ? selectedPreferredDates : null;
    const preferredTimeLines = preferredSlots.filter((s) =>
      preferredTimeSlotIds.includes(s.id)
    ).map((s) => s.label);
    const preferredTimeTextOut =
      preferredTimeLines.length > 0 ? preferredTimeLines.join("\n") : null;

    const body = {
      nameZh: nameZh.trim(),
      nameEn: nameEn.trim() || null,
      email: email.trim(),
      phone: phone.trim(),
      phoneVerificationToken,
      age,
      teacherRecommended,
      teacherName: teacherName.trim() || null,
      teacherContact: teacherContact.trim() || null,
      userCategoryCode,
      instrumentField: instrumentField.trim(),
      identityFlags,
      identityOtherText: identityFlags.includes("other")
        ? identityOtherText.trim()
        : null,
      usagePurposes,
      preferredDates: preferredDatesArr,
      preferredTimeText: preferredTimeTextOut,
      extraNotes: extraNotes || null,
      interestDfestival,
      interestDmasters,
      marketingOptIn,
      socialFollowClaimed,
      socialRepostClaimed,
      wantsAmbassador,
      agreedTerms,
      agreedPrivacy,
      agreedEmailNotifications,
      referralCode: referralCode.trim() || null,
      captchaToken: captchaToken ?? null,
      passkeyPreregToken,
    };

    try {
      const res = await fetch(withBasePath("/api/v1/registration"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        let msg =
          res.status === 422
            ? formatRegistrationApiError(data, t, locale)
            : typeof data?.error?.message === "string"
              ? data.error.message
              : t("reg.submitFail");
        const det = data?.error?.details;
        if (
          det &&
          typeof det === "object" &&
          det !== null &&
          "devMessage" in det &&
          typeof (det as { devMessage?: string }).devMessage === "string" &&
          (det as { devMessage: string }).devMessage.length > 0
        ) {
          msg += `\n\n（開發用）${(det as { devMessage: string }).devMessage}`;
        }
        setError(msg);
        recaptchaRef.current?.reset();
        setCaptchaToken(null);
        setLoading(false);
        return;
      }
      try {
        sessionStorage.setItem(
          "fms_registration_success",
          JSON.stringify({
            email,
            tempPassword: typeof data?.tempPassword === "string" ? data.tempPassword : undefined,
            emailSent: !!data?.emailSent,
            emailChannel: typeof data?.emailChannel === "string" ? data.emailChannel : undefined,
            devNote: typeof data?.devNote === "string" ? data.devNote : undefined,
            emailError: typeof data?.emailError === "string" ? data.emailError : undefined,
            socialFollowOptIn: socialFollowClaimed,
            socialFollowSetupToken:
              typeof data?.socialFollowSetupToken === "string"
                ? data.socialFollowSetupToken
                : null,
          })
        );
      } catch {
        /* ignore quota / private mode */
      }
      router.push("/register/success");
    } catch {
      setError(t("reg.networkError"));
    }
    setLoading(false);
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-2xl space-y-10 pb-24">
      {error && (
        <div className="whitespace-pre-wrap rounded-lg border border-red-200 bg-red-50 px-5 sm:px-4 py-3 text-sm text-red-900">
          {error}
        </div>
      )}

      <section className="space-y-4">
        <h2 className="font-serif text-xl text-stone-900 dark:text-stone-50">{t("reg.sectionBasic")}</h2>
        <label className="block text-sm">
          <span className="text-stone-700 dark:text-stone-300">{t("reg.nameZh")}</span>
          <input
            required
            className="mt-1 w-full rounded-lg border border-stone-300 bg-surface-input px-4 py-2 sm:px-3 text-foreground dark:border-stone-700"
            value={nameZh}
            onChange={(e) => setNameZh(e.target.value)}
          />
        </label>
        <label className="block text-sm">
          <span className="text-stone-700 dark:text-stone-300">{t("reg.nameEn")}</span>
          <input
            className="mt-1 w-full rounded-lg border border-stone-300 bg-surface-input px-4 py-2 sm:px-3 text-foreground dark:border-stone-700"
            value={nameEn}
            onChange={(e) => setNameEn(e.target.value)}
          />
        </label>
        <label className="block text-sm">
          <span className="text-stone-700 dark:text-stone-300">{t("reg.email")}</span>
          <input
            required
            type="email"
            className="mt-1 w-full rounded-lg border border-stone-300 bg-surface-input px-4 py-2 sm:px-3 text-foreground dark:border-stone-700"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setPasskeyPreregToken(null);
            }}
          />
        </label>
        <div className="rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900/80 dark:bg-stone-900/80 px-5 sm:px-4 py-4">
          <div className="mb-4 rounded-lg border border-emerald-100 bg-emerald-50/90 px-3 py-3 text-xs text-emerald-950">
            <p className="font-medium text-emerald-900">{t("reg.privacyTitle")}</p>
            <p className="mt-2 leading-relaxed text-emerald-900/90">{t("reg.privacyP1")}</p>
            <p className="mt-2 leading-relaxed text-emerald-900/90">{t("reg.privacyP2")}</p>
          </div>
          <label className="block text-sm">
            <span className="text-stone-700 dark:text-stone-300">{t("reg.phoneLabel")}</span>
            <span className="mt-1 block text-xs text-stone-500 dark:text-stone-500">
              {t("reg.phoneHint")}
            </span>
            <input
              required
              className="mt-2 w-full rounded-lg border border-stone-300 bg-surface-input px-4 py-2 sm:px-3 text-foreground dark:border-stone-700"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                setPhoneVerificationToken(null);
                setPhoneVerified(false);
                setSmsCode("");
                setPasskeyPreregToken(null);
              }}
              placeholder={t("reg.phonePlaceholder")}
            />
          </label>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={smsBusy || smsCooldown > 0 || !phone.trim()}
              onClick={() => void sendPhoneCode()}
              className="rounded-lg bg-stone-800 px-5 sm:px-4 py-2 text-sm text-white hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {smsCooldown > 0
                ? tr("reg.smsSentWait", { seconds: String(smsCooldown) })
                : smsBusy
                  ? t("reg.smsSending")
                  : t("reg.smsSend")}
            </button>
            {phoneVerified && (
              <span className="text-sm font-medium text-emerald-700">{t("reg.phoneVerified")}</span>
            )}
          </div>
          <div className="mt-4 flex flex-wrap items-end gap-2">
            <label className="block text-sm">
              <span className="text-stone-700 dark:text-stone-300">{t("reg.smsCodeLabel")}</span>
              <input
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                className="mt-1 w-40 rounded-lg border border-stone-300 bg-surface-input px-4 py-2 sm:px-3 font-mono text-foreground dark:border-stone-700 tracking-widest"
                value={smsCode}
                onChange={(e) => setSmsCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="______"
              />
            </label>
            <button
              type="button"
              disabled={verifyBusy || smsCode.length !== 6 || !phone.trim()}
              onClick={() => void verifyPhoneCode()}
              className="rounded-lg border border-stone-400 dark:border-stone-500 bg-surface px-5 sm:px-4 py-2 text-sm text-stone-800 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-700 dark:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {verifyBusy ? t("reg.verifying") : t("reg.verifyCode")}
            </button>
          </div>
          {phoneVerified && webauthnSupported && (
            <div className="mt-6 border-t border-stone-200 dark:border-stone-700 pt-4">
              <p className="text-sm font-medium text-stone-800 dark:text-stone-200">{t("reg.bioTitle")}</p>
              <p className="mt-1 text-xs text-stone-600 dark:text-stone-400">{t("reg.bioHint")}</p>
              {!email.trim() && (
                <p className="mt-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-950">
                  {t("reg.bioEmailFirst")}
                </p>
              )}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={passkeyBusy}
                  onClick={() => void bindPasskey()}
                  className="rounded-lg border border-stone-700 bg-surface px-5 sm:px-4 py-2 text-sm text-stone-900 dark:text-stone-50 hover:bg-stone-100 dark:hover:bg-stone-700 dark:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {passkeyBusy
                    ? t("reg.processing")
                    : passkeyPreregToken
                      ? t("reg.passkeyRebind")
                      : t("reg.passkeyBind")}
                </button>
                {passkeyPreregToken && (
                  <span className="text-sm font-medium text-emerald-700">{t("reg.passkeyDone")}</span>
                )}
              </div>
            </div>
          )}
          {phoneVerified && !webauthnSupported && (
            <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 px-3 py-3 text-xs text-amber-950">
              <p className="font-medium">{t("reg.passkeyRequiredTitle")}</p>
              <p className="mt-1 text-amber-900/90">{t("reg.passkeyBrowser")}</p>
            </div>
          )}
        </div>
        <label className="block text-sm">
          <span className="text-stone-700 dark:text-stone-300">{t("reg.age")}</span>
          <input
            required
            type="number"
            min={1}
            max={120}
            className="mt-1 w-full rounded-lg border border-stone-300 bg-surface-input px-4 py-2 sm:px-3 text-foreground dark:border-stone-700"
            value={age}
            onChange={(e) => setAge(Number(e.target.value))}
          />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={teacherRecommended}
            onChange={(e) => setTeacherRecommended(e.target.checked)}
          />
          {t("reg.teacherRecommended")}
        </label>
        {teacherRecommended && (
          <>
            <label className="block text-sm">
              <span className="text-stone-700 dark:text-stone-300">{t("reg.teacherName")}</span>
              <input
                className="mt-1 w-full rounded-lg border border-stone-300 bg-surface-input px-4 py-2 sm:px-3 text-foreground dark:border-stone-700"
                value={teacherName}
                onChange={(e) => setTeacherName(e.target.value)}
              />
            </label>
            <label className="block text-sm">
              <span className="text-stone-700 dark:text-stone-300">{t("reg.teacherContact")}</span>
              <input
                className="mt-1 w-full rounded-lg border border-stone-300 bg-surface-input px-4 py-2 sm:px-3 text-foreground dark:border-stone-700"
                value={teacherContact}
                onChange={(e) => setTeacherContact(e.target.value)}
              />
            </label>
          </>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="font-serif text-xl text-stone-900 dark:text-stone-50">{t("reg.sectionUserType")}</h2>
        <select
          className="w-full rounded-lg border border-stone-300 bg-surface-input px-4 py-2 sm:px-3 text-sm text-foreground dark:border-stone-700"
          value={userCategoryCode}
          onChange={(e) => setUserCategoryCode(e.target.value as "personal" | "teaching")}
        >
          <option value="personal">{t("reg.userCatPersonal")}</option>
          <option value="teaching">{t("reg.userCatTeaching")}</option>
        </select>
      </section>

      <section className="space-y-4">
        <h2 className="font-serif text-xl text-stone-900 dark:text-stone-50">{t("reg.sectionMusic")}</h2>
        <label className="block text-sm">
          <span className="text-stone-700 dark:text-stone-300">{t("reg.instrument")}</span>
          <input
            required
            className="mt-1 w-full rounded-lg border border-stone-300 bg-surface-input px-4 py-2 sm:px-3 text-foreground dark:border-stone-700"
            value={instrumentField}
            onChange={(e) => setInstrumentField(e.target.value)}
          />
        </label>
        <p className="text-sm text-stone-700 dark:text-stone-300">{t("reg.identityHeading")}</p>
        <div className="flex flex-wrap gap-3">
          {identityOptions.map((o) => (
            <label key={o.value} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={identityFlags.includes(o.value)}
                onChange={() => toggleIdentity(o.value)}
              />
              {o.label}
            </label>
          ))}
        </div>
        {identityFlags.includes("other") && (
          <label className="block text-sm">
            <span className="text-stone-700 dark:text-stone-300">{t("reg.identityOtherExplain")}</span>
            <input
              required
              className="mt-1 w-full rounded-lg border border-stone-300 bg-surface-input px-4 py-2 sm:px-3 text-foreground dark:border-stone-700"
              value={identityOtherText}
              onChange={(e) => setIdentityOtherText(e.target.value)}
              placeholder={t("reg.identityOtherPh")}
            />
          </label>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="font-serif text-xl text-stone-900 dark:text-stone-50">{t("reg.sectionUsage")}</h2>
        <div className="grid gap-2 sm:grid-cols-2">
          {usageKeys.map((u) => (
            <label key={u.key} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={!!usage[u.key]}
                onChange={() => toggleUsage(u.key)}
              />
              {u.label}
            </label>
          ))}
        </div>
        <label className="block text-sm">
          <span className="text-stone-700 dark:text-stone-300">{t("reg.usageOther")}</span>
          <input
            className="mt-1 w-full rounded-lg border border-stone-300 bg-surface-input px-4 py-2 sm:px-3 text-foreground dark:border-stone-700"
            value={usageOther}
            onChange={(e) => setUsageOther(e.target.value)}
          />
        </label>
      </section>

      <section className="space-y-4">
        <h2 className="font-serif text-xl text-stone-900 dark:text-stone-50">{t("reg.intentTitle")}</h2>
        <div>
          <p className="text-sm text-stone-700 dark:text-stone-300">{t("reg.prefDates")}</p>
          <p className="mt-1 text-xs text-stone-500 dark:text-stone-500">
            {tr("reg.prefDatesHint", { campaignRange: t("campaign.dateRange") })}
          </p>
          <div className="mt-4 flex flex-col gap-6 lg:flex-row lg:items-start">
            <RegistrationPreferredDateMonth
              title={t("reg.monthApr")}
              year={2026}
              month1={4}
              selectedPreferredDates={selectedPreferredDates}
              onToggleDate={togglePreferredDate}
              weekdays={calWeekdays}
            />
            <RegistrationPreferredDateMonth
              title={t("reg.monthMay")}
              year={2026}
              month1={5}
              selectedPreferredDates={selectedPreferredDates}
              onToggleDate={togglePreferredDate}
              weekdays={calWeekdays}
            />
            <div className="min-h-[8rem] flex-1 rounded-xl border border-stone-200 dark:border-stone-700 bg-surface px-5 sm:px-4 py-3">
              <p className="text-sm font-medium text-stone-800 dark:text-stone-200">{t("reg.selectedDates")}</p>
              {selectedPreferredDates.length === 0 ? (
                <p className="mt-2 text-sm text-stone-500 dark:text-stone-500">{t("reg.noneSelected")}</p>
              ) : (
                <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-stone-700 dark:text-stone-300">
                  {selectedPreferredDates.map((iso) => (
                    <li key={iso}>{formatHkPreferredDate(iso, locale)}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
        <div>
          <p className="text-sm text-stone-700 dark:text-stone-300">{t("reg.prefSlots")}</p>
          <div className="mt-2 space-y-2">
            {preferredSlots.map((s) => (
              <label
                key={s.id}
                className="flex cursor-pointer items-center gap-3 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900/60 dark:bg-stone-900/60 px-3 py-2.5 text-sm hover:bg-stone-100 dark:hover:bg-stone-700 dark:bg-stone-800/80"
              >
                <input
                  type="checkbox"
                  checked={preferredTimeSlotIds.includes(s.id)}
                  onChange={() => togglePreferredTimeSlot(s.id)}
                />
                <span>{s.label}</span>
              </label>
            ))}
          </div>
        </div>
        <label className="block text-sm">
          <span className="text-stone-700 dark:text-stone-300">{t("reg.extraNotes")}</span>
          <textarea
            className="mt-1 w-full rounded-lg border border-stone-300 bg-surface-input px-4 py-2 sm:px-3 text-foreground dark:border-stone-700"
            rows={3}
            value={extraNotes}
            onChange={(e) => setExtraNotes(e.target.value)}
          />
        </label>
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-serif text-xl text-stone-900 dark:text-stone-50">{t("reg.sectionInterest")}</h2>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-stone-600 dark:text-stone-400">
            <input
              ref={interestSelectAllRef}
              type="checkbox"
              checked={allInterestSelected}
              onChange={(e) => {
                const v = e.target.checked;
                setInterestDfestival(v);
                setInterestDmasters(v);
                setMarketingOptIn(v);
                setSocialFollowClaimed(v);
                setSocialRepostClaimed(v);
                setWantsAmbassador(v);
              }}
            />
            {t("reg.selectAll")}
          </label>
        </div>
        <label className="flex cursor-pointer items-start gap-2 text-sm leading-snug">
          <input
            type="checkbox"
            className="mt-0.5 shrink-0"
            checked={interestDfestival}
            onChange={(e) => setInterestDfestival(e.target.checked)}
          />
          <span>
            {DFESTIVAL_INFO_URL ? (
              <a
                href={DFESTIVAL_INFO_URL}
                target="_blank"
                rel="noopener noreferrer"
                className={interestLinkClass}
                onClick={(e) => e.stopPropagation()}
              >
                {t("reg.interestDf")}
              </a>
            ) : (
              <span className={interestPlainClass}>{t("reg.interestDf")}</span>
            )}
          </span>
        </label>
        <label className="flex cursor-pointer items-start gap-2 text-sm leading-snug">
          <input
            type="checkbox"
            className="mt-0.5 shrink-0"
            checked={interestDmasters}
            onChange={(e) => setInterestDmasters(e.target.checked)}
          />
          <span>
            {DMASTERS_INFO_URL ? (
              <a
                href={DMASTERS_INFO_URL}
                target="_blank"
                rel="noopener noreferrer"
                className={interestLinkClass}
                onClick={(e) => e.stopPropagation()}
              >
                {t("reg.interestDm")}
              </a>
            ) : (
              <span className={interestPlainClass}>{t("reg.interestDm")}</span>
            )}
          </span>
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={marketingOptIn}
            onChange={(e) => setMarketingOptIn(e.target.checked)}
          />
          {t("reg.marketingOptIn")}
        </label>
        <label className="flex cursor-pointer items-start gap-2 text-sm leading-snug">
          <input
            type="checkbox"
            className="mt-0.5 shrink-0"
            required
            checked={socialFollowClaimed}
            onChange={(e) => setSocialFollowClaimed(e.target.checked)}
          />
          <span>{t("reg.socialFollow")}</span>
        </label>
        <label className="flex cursor-pointer items-start gap-2 text-sm leading-snug">
          <input
            type="checkbox"
            className="mt-0.5 shrink-0"
            required
            checked={socialRepostClaimed}
            onChange={(e) => setSocialRepostClaimed(e.target.checked)}
          />
          <span>{t("reg.socialRepost")}</span>
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={wantsAmbassador}
            onChange={(e) => setWantsAmbassador(e.target.checked)}
          />
          {t("reg.ambassador")}
        </label>
        <label className="block text-sm">
          <span className="text-stone-700 dark:text-stone-300">{t("reg.referral")}</span>
          <input
            className="mt-1 w-full rounded-lg border border-stone-300 bg-surface-input px-4 py-2 sm:px-3 text-foreground dark:border-stone-700"
            value={referralCode}
            onChange={(e) => setReferralCode(e.target.value)}
          />
        </label>
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-serif text-xl text-stone-900 dark:text-stone-50">{t("reg.sectionConsent")}</h2>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-stone-600 dark:text-stone-400">
            <input
              ref={consentSelectAllRef}
              type="checkbox"
              checked={allConsentSelected}
              onChange={(e) => {
                const v = e.target.checked;
                setAgreedTerms(v);
                setAgreedPrivacy(v);
                setAgreedEmailNotifications(v);
              }}
            />
            {t("reg.selectAll")}
          </label>
        </div>
        <label className="flex cursor-pointer items-start gap-2 text-sm leading-snug">
          <input
            type="checkbox"
            className="mt-0.5 shrink-0"
            required
            checked={agreedTerms}
            onChange={(e) => setAgreedTerms(e.target.checked)}
          />
          <span>{t("reg.agreeTerms")}</span>
        </label>
        <label className="flex cursor-pointer items-start gap-2 text-sm leading-snug">
          <input
            type="checkbox"
            className="mt-0.5 shrink-0"
            required
            checked={agreedPrivacy}
            onChange={(e) => setAgreedPrivacy(e.target.checked)}
          />
          <span>{t("reg.agreePrivacy")}</span>
        </label>
        <label className="flex cursor-pointer items-start gap-2 text-sm leading-snug">
          <input
            type="checkbox"
            className="mt-0.5 shrink-0"
            required
            checked={agreedEmailNotifications}
            onChange={(e) => setAgreedEmailNotifications(e.target.checked)}
          />
          <span>{t("reg.agreeEmail")}</span>
        </label>
      </section>

      {recaptchaSiteKey && !skipRecaptcha ? (
        <section className="space-y-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900/80 dark:bg-stone-900/80 px-5 sm:px-4 py-4">
          <h2 className="font-serif text-lg text-stone-900 dark:text-stone-50">{t("reg.sectionSecurity")}</h2>
          <RecaptchaV2
            ref={recaptchaRef}
            siteKey={recaptchaSiteKey}
            onTokenChange={setCaptchaToken}
          />
        </section>
      ) : null}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-full bg-stone-900 py-3 text-white transition hover:bg-stone-800 disabled:opacity-60"
      >
        {loading ? t("reg.submitting") : t("reg.submit")}
      </button>
    </form>
  );
}
