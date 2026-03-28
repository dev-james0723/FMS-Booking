"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { startRegistration } from "@simplewebauthn/browser";
import { withBasePath } from "@/lib/base-path";
import { PENDING_REFERRAL_SESSION_KEY } from "@/lib/referral/constants";
import {
  CAMPAIGN_EXPERIENCE_FIRST_DAY_KEY,
  CAMPAIGN_EXPERIENCE_LAST_DAY_KEY,
} from "@/lib/booking/campaign-constants";
import { useTranslation } from "@/lib/i18n/use-translation";
import type { Locale } from "@/lib/i18n/types";
import { buildMonthGrid } from "@/lib/hk-calendar-client";
import { InstrumentOtherModal } from "@/components/instrument-other-modal";
import {
  emojiForOrchestraInstrument,
  getOrchestraInstrument,
  instrumentLabel,
} from "@/lib/instruments/orchestra-instruments";
import { registrationInstrumentImageMap } from "@/lib/instruments/instrument-reference-images";
import type { RegistrationProfileKind } from "@/lib/registration/profile-kind";

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

const interestLinkClass =
  "font-medium text-amber-600 underline decoration-amber-600/70 underline-offset-2 hover:text-amber-500";
const interestPlainClass = "font-medium text-stone-800 dark:text-stone-200";
const consentLinkClass =
  "font-medium text-blue-600 underline decoration-blue-600/80 underline-offset-2 hover:text-blue-500 dark:text-blue-400 dark:decoration-blue-400/80 dark:hover:text-blue-300";

function RedRequiredStarLead({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-start gap-0">
      <span
        className="mt-0.5 shrink-0 text-[0.65rem] font-bold leading-none text-red-600"
        aria-hidden
      >
        *
      </span>
      <span>{children}</span>
    </span>
  );
}

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
  const searchParams = useSearchParams();
  const registerForOpenSpace = searchParams.get("for") === "open-space";
  const { t, tr, locale } = useTranslation();
  const dfestivalInfoUrl =
    locale === "en" ? "https://d-festival.org/en-us" : "https://d-festival.org/zh-hk";
  const dmastersInfoUrl =
    locale === "en"
      ? "https://d-festival.org/dmasters/en-us"
      : "https://d-festival.org/zh-hk/dmasters";
  const router = useRouter();
  const registrationIdempotencyKey = useMemo(() => {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
      return crypto.randomUUID();
    }
    return `reg-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
  }, []);
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
  const [registrationProfileKind, setRegistrationProfileKind] =
    useState<RegistrationProfileKind>("personal_user");
  const [teacherName, setTeacherName] = useState("");
  const [teacherContact, setTeacherContact] = useState("");
  const [instrumentField, setInstrumentField] = useState("");
  const [instrumentMode, setInstrumentMode] = useState<"none" | "piano" | "other">("none");
  const [otherInstrumentOpen, setOtherInstrumentOpen] = useState(false);
  const [otherInstrumentId, setOtherInstrumentId] = useState<string | null>(null);
  const [instrumentImages, setInstrumentImages] = useState<Record<string, string>>(() =>
    registrationInstrumentImageMap()
  );
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

  const interestSelectAllRef = useRef<HTMLInputElement>(null);
  const consentSelectAllRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const ref = searchParams.get("ref")?.trim().toLowerCase() ?? "";
    if (!ref) return;
    try {
      sessionStorage.setItem(PENDING_REFERRAL_SESSION_KEY, ref);
    } catch {
      /* ignore */
    }
  }, [searchParams]);

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

  const instrumentPreviewKey = useMemo((): string | null => {
    if (instrumentMode === "piano") return "piano";
    if (instrumentMode === "other" && otherInstrumentId) return otherInstrumentId;
    return null;
  }, [instrumentMode, otherInstrumentId]);

  const instrumentPreviewAlt = useMemo(() => {
    if (instrumentMode === "piano") return t("reg.instrumentPiano");
    if (otherInstrumentId) {
      const inst = getOrchestraInstrument(otherInstrumentId);
      if (inst) return instrumentLabel(inst, locale);
    }
    return instrumentField.trim() || t("reg.instrument");
  }, [instrumentMode, otherInstrumentId, instrumentField, locale, t]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch(withBasePath("/api/v1/public/instrument-images"));
        if (!res.ok) return;
        const data = (await res.json()) as { images?: Record<string, string> };
        if (!cancelled && data.images) setInstrumentImages(data.images);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

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
    if (!instrumentField.trim()) {
      setError(
        registerForOpenSpace ? t("reg.instrumentRequiredOpenSpace") : t("reg.instrumentRequired")
      );
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
    if (registrationProfileKind === "teacher_referred_student") {
      if (!teacherName.trim() || !teacherContact.trim()) {
        setError(t("reg.validationFail"));
        return;
      }
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

    let referralCode: string | null = searchParams.get("ref")?.trim().toLowerCase() ?? null;
    if (!referralCode) {
      try {
        const stored = sessionStorage.getItem(PENDING_REFERRAL_SESSION_KEY)?.trim().toLowerCase() ?? "";
        referralCode = stored.length > 0 ? stored : null;
      } catch {
        referralCode = null;
      }
    }

    const body = {
      nameZh: nameZh.trim(),
      nameEn: nameEn.trim() || null,
      email: email.trim(),
      phone: phone.trim(),
      phoneVerificationToken,
      age,
      registrationProfileKind,
      teacherName: teacherName.trim() || null,
      teacherContact: teacherContact.trim() || null,
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
      referralCode,
      passkeyPreregToken,
      bookingVenueKind: registerForOpenSpace ? "open_space" : "studio_room",
    };

    try {
      const res = await fetch(withBasePath("/api/v1/registration"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": registrationIdempotencyKey,
        },
        body: JSON.stringify(body),
      });
      const rawText = await res.text();
      let data: unknown = {};
      try {
        data = rawText.length > 0 ? JSON.parse(rawText) : {};
      } catch {
        data = {};
      }
      const apiData = data && typeof data === "object" && data !== null ? data : {};
      const errObj =
        "error" in apiData &&
        apiData.error &&
        typeof apiData.error === "object" &&
        apiData.error !== null
          ? (apiData.error as { message?: string; code?: string; details?: unknown })
          : undefined;
      if (!res.ok) {
        let msg =
          res.status === 422
            ? formatRegistrationApiError(apiData, t, locale)
            : typeof errObj?.message === "string"
              ? errObj.message
              : locale === "en"
                ? `Submission failed (HTTP ${res.status}). Please try again or contact the organisers.`
                : `提交失敗（伺服器回應 HTTP ${res.status}）。請稍後再試或聯絡主辦方。`;
        if (typeof errObj?.code === "string" && errObj.code.length > 0) {
          msg += locale === "en" ? ` [${errObj.code}]` : `［${errObj.code}］`;
        }
        if (!errObj?.message && rawText.length > 0 && rawText.length < 400 && rawText.trim().startsWith("<")) {
          msg +=
            locale === "en"
              ? " The server returned a non-JSON error page (often a timeout or crash). Please retry."
              : " 伺服器回傳了非 JSON 的錯誤頁（常見於逾時或程式崩潰），請稍後再試。";
        }
        const det = errObj?.details;
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
        setLoading(false);
        return;
      }
      const okPayload = apiData as {
        tempPassword?: string;
        emailSent?: boolean;
        emailChannel?: string;
        devNote?: string;
        emailError?: string;
        socialFollowSetupToken?: string;
      };
      try {
        sessionStorage.setItem(
          "fms_registration_success",
          JSON.stringify({
            email,
            tempPassword: typeof okPayload.tempPassword === "string" ? okPayload.tempPassword : undefined,
            emailSent: !!okPayload.emailSent,
            emailChannel: typeof okPayload.emailChannel === "string" ? okPayload.emailChannel : undefined,
            devNote: typeof okPayload.devNote === "string" ? okPayload.devNote : undefined,
            emailError: typeof okPayload.emailError === "string" ? okPayload.emailError : undefined,
            socialFollowOptIn: socialFollowClaimed,
            socialFollowSetupToken:
              typeof okPayload.socialFollowSetupToken === "string"
                ? okPayload.socialFollowSetupToken
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
      {registerForOpenSpace && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 px-5 sm:px-4 py-3 text-sm text-amber-950 dark:border-amber-800/60 dark:bg-amber-950/35 dark:text-amber-100">
          {t("reg.openSpaceRegistrationBanner")}
        </div>
      )}

      <section className="space-y-4">
        <h2 className="font-serif text-xl text-stone-900 dark:text-stone-50">{t("reg.sectionMusic")}</h2>
        <div className="block text-sm">
          <RedRequiredStarLead>
            <span className="text-stone-700 dark:text-stone-300">{t("reg.instrument")}</span>
          </RedRequiredStarLead>
          <div
            className={
              registerForOpenSpace ? "mt-2 grid grid-cols-1 gap-3" : "mt-2 grid grid-cols-2 gap-3"
            }
          >
            {!registerForOpenSpace && (
              <button
                type="button"
                aria-pressed={instrumentMode === "piano"}
                onClick={() => {
                  setInstrumentMode("piano");
                  setInstrumentField(t("reg.instrumentPiano"));
                  setOtherInstrumentId(null);
                  setOtherInstrumentOpen(false);
                }}
                className={`rounded-lg border px-4 py-3 text-sm font-medium transition ${
                  instrumentMode === "piano"
                    ? "border-stone-900 bg-stone-900 text-white dark:border-stone-100 dark:bg-stone-100 dark:text-stone-900"
                    : "border-stone-300 bg-surface text-stone-800 hover:bg-stone-50 dark:border-stone-600 dark:text-stone-200 dark:hover:bg-stone-800"
                }`}
              >
                <span className="inline-flex items-center justify-center gap-1.5">
                  <span aria-hidden>🎹</span>
                  {t("reg.instrumentPiano")}
                </span>
              </button>
            )}
            <button
              type="button"
              aria-pressed={instrumentMode === "other"}
              onClick={() => setOtherInstrumentOpen(true)}
              className={`rounded-lg border px-3 py-3 text-sm font-medium transition ${
                instrumentMode === "other"
                  ? "border-stone-900 bg-stone-900 text-white dark:border-stone-100 dark:bg-stone-100 dark:text-stone-900"
                  : "border-stone-300 bg-surface text-stone-800 hover:bg-stone-50 dark:border-stone-600 dark:text-stone-200 dark:hover:bg-stone-800"
              }`}
            >
              <span className="inline-flex min-w-0 max-w-full items-center justify-center gap-1.5 text-center leading-tight">
                <span className="shrink-0" aria-hidden>
                  {instrumentMode === "other" && otherInstrumentId
                    ? emojiForOrchestraInstrument(otherInstrumentId)
                    : "🎻"}
                </span>
                <span className="min-w-0 break-words">
                  {instrumentMode === "other" && instrumentField.trim()
                    ? instrumentField
                    : registerForOpenSpace
                      ? t("reg.instrumentOpenSpaceTrigger")
                      : t("reg.instrumentOther")}
                </span>
              </span>
            </button>
          </div>
          {instrumentPreviewKey && instrumentImages[instrumentPreviewKey] ? (
            <div className="mt-6 flex justify-center" key={instrumentPreviewKey}>
              <div className="registration-instrument-pop relative size-[9.5rem] shrink-0 overflow-hidden rounded-full border-[3px] border-stone-300 bg-stone-100 shadow-md sm:size-44 dark:border-stone-600 dark:bg-stone-800">
                <Image
                  src={withBasePath(instrumentImages[instrumentPreviewKey])}
                  alt={instrumentPreviewAlt}
                  fill
                  sizes="(max-width: 640px) 9.5rem, 11rem"
                  className="object-cover"
                />
              </div>
            </div>
          ) : null}
        </div>
        <InstrumentOtherModal
          open={otherInstrumentOpen}
          locale={locale}
          initialInstrumentId={otherInstrumentId}
          forOpenSpaceRegistration={registerForOpenSpace}
          onClose={() => setOtherInstrumentOpen(false)}
          onConfirm={(id, label) => {
            setInstrumentField(label);
            setInstrumentMode("other");
            setOtherInstrumentId(id);
            setOtherInstrumentOpen(false);
          }}
          t={t}
        />
      </section>

      <section className="space-y-4">
        <h2 className="font-serif text-xl text-stone-900 dark:text-stone-50">{t("reg.sectionUserType")}</h2>
        <p className="text-sm text-stone-600 dark:text-stone-400">{t("reg.regProfileHint")}</p>
        <div className="space-y-2" role="radiogroup" aria-label={t("reg.sectionUserType")}>
          {(
            [
              ["personal_user", "reg.regProfilePersonal"],
              ["teaching_user", "reg.regProfileTeaching"],
              ["teacher_referred_student", "reg.regProfileTeacherReferred"],
              ["dual_practice_and_teaching", "reg.regProfileDual"],
            ] as const
          ).map(([value, labelKey]) => (
            <label
              key={value}
              className="flex cursor-pointer items-start gap-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-surface px-3 py-2.5 text-sm text-stone-800 dark:text-stone-200"
            >
              <input
                type="radio"
                name="registrationProfileKind"
                className="mt-1"
                checked={registrationProfileKind === value}
                onChange={() => {
                  setRegistrationProfileKind(value);
                  if (value !== "teacher_referred_student") {
                    setTeacherName("");
                    setTeacherContact("");
                  }
                }}
              />
              <span>{t(labelKey)}</span>
            </label>
          ))}
        </div>
        {registrationProfileKind === "teacher_referred_student" && (
          <>
            <label className="block text-sm">
              <span className="text-stone-700 dark:text-stone-300">{t("reg.teacherName")}</span>
              <input
                required
                className="mt-1 w-full rounded-lg border border-stone-300 bg-surface-input px-4 py-2 sm:px-3 text-foreground dark:border-stone-700"
                value={teacherName}
                onChange={(e) => setTeacherName(e.target.value)}
              />
            </label>
            <label className="block text-sm">
              <span className="text-stone-700 dark:text-stone-300">{t("reg.teacherContact")}</span>
              <input
                required
                className="mt-1 w-full rounded-lg border border-stone-300 bg-surface-input px-4 py-2 sm:px-3 text-foreground dark:border-stone-700"
                value={teacherContact}
                onChange={(e) => setTeacherContact(e.target.value)}
              />
            </label>
          </>
        )}
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
        <div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-serif text-xl text-stone-900 dark:text-stone-50">
              {t("reg.sectionInterest")}
            </h2>
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
          <p className="mt-1 text-xs text-red-600">{t("reg.sectionRequiredHint")}</p>
        </div>
        <label className="flex cursor-pointer items-start gap-2 text-sm leading-snug">
          <input
            type="checkbox"
            className="mt-0.5 shrink-0"
            checked={interestDfestival}
            onChange={(e) => setInterestDfestival(e.target.checked)}
          />
          <span>
            <span className={interestPlainClass}>{t("reg.interestDfPrefix")}</span>
            <a
              href={dfestivalInfoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={interestLinkClass}
              onClick={(e) => e.stopPropagation()}
            >
              {t("reg.interestDfLink")}
            </a>
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
            <span className={interestPlainClass}>{t("reg.interestDmPrefix")}</span>
            <a
              href={dmastersInfoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={interestLinkClass}
              onClick={(e) => e.stopPropagation()}
            >
              {t("reg.interestDmLink")}
            </a>
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
          <span>
            <RedRequiredStarLead>{t("reg.socialFollow")}</RedRequiredStarLead>
          </span>
        </label>
        <label className="flex cursor-pointer items-start gap-2 text-sm leading-snug">
          <input
            type="checkbox"
            className="mt-0.5 shrink-0"
            required
            checked={socialRepostClaimed}
            onChange={(e) => setSocialRepostClaimed(e.target.checked)}
          />
          <span>
            <RedRequiredStarLead>{t("reg.socialRepost")}</RedRequiredStarLead>
          </span>
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={wantsAmbassador}
            onChange={(e) => setWantsAmbassador(e.target.checked)}
          />
          {t("reg.ambassador")}
        </label>
      </section>

      <section className="space-y-4">
        <div>
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
          <p className="mt-1 text-xs text-red-600">{t("reg.sectionRequiredHint")}</p>
        </div>
        <label className="flex cursor-pointer items-start gap-2 text-sm leading-snug">
          <input
            type="checkbox"
            className="mt-0.5 shrink-0"
            required
            checked={agreedTerms}
            onChange={(e) => setAgreedTerms(e.target.checked)}
          />
          <span>
            <RedRequiredStarLead>
              <>
                {t("reg.agreeTermsPrefix")}
                <a
                  href={withBasePath("/terms")}
                  className={consentLinkClass}
                  onClick={(e) => e.stopPropagation()}
                >
                  {t("reg.agreeTermsLink")}
                </a>
                {t("reg.agreeTermsSuffix")}
              </>
            </RedRequiredStarLead>
          </span>
        </label>
        <label className="flex cursor-pointer items-start gap-2 text-sm leading-snug">
          <input
            type="checkbox"
            className="mt-0.5 shrink-0"
            required
            checked={agreedPrivacy}
            onChange={(e) => setAgreedPrivacy(e.target.checked)}
          />
          <span>
            <RedRequiredStarLead>
              <>
                {t("reg.agreePrivacyPrefix")}
                <a
                  href={withBasePath("/privacy")}
                  className={consentLinkClass}
                  onClick={(e) => e.stopPropagation()}
                >
                  {t("reg.agreePrivacyLink")}
                </a>
                {t("reg.agreePrivacySuffix")}
              </>
            </RedRequiredStarLead>
          </span>
        </label>
        <label className="flex cursor-pointer items-start gap-2 text-sm leading-snug">
          <input
            type="checkbox"
            className="mt-0.5 shrink-0"
            required
            checked={agreedEmailNotifications}
            onChange={(e) => setAgreedEmailNotifications(e.target.checked)}
          />
          <span>
            <RedRequiredStarLead>{t("reg.agreeEmail")}</RedRequiredStarLead>
          </span>
        </label>
      </section>

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
