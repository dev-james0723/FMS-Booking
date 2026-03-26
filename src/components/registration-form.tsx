"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { startRegistration } from "@simplewebauthn/browser";
import { RecaptchaV2, type RecaptchaV2Handle } from "@/components/recaptcha-v2";
import { withBasePath } from "@/lib/base-path";

const IDENTITY_OPTIONS = [
  { value: "student", label: "學生" },
  { value: "performer", label: "個人演奏者" },
  { value: "freelancer", label: "自由工作者" },
  { value: "private_teacher", label: "私人老師" },
  { value: "music_tutor", label: "音樂導師" },
  { value: "other", label: "其他" },
];

/** April 2026 only — local calendar grid (month index 3 = April). */
const PREFERRED_DATE_YEAR = 2026;
const PREFERRED_DATE_MONTH_INDEX = 3;
const PREFERRED_DATE_DAYS = 30;

const PREFERRED_TIME_SLOTS = [
  { id: "slot_6_9", label: "6 AM - 9 AM" },
  { id: "slot_9_12", label: "9 AM - 12 NOON" },
  { id: "slot_12_15", label: "12 NOON - 3 PM" },
  { id: "slot_15_18", label: "3 PM - 6 PM" },
  { id: "slot_18_20", label: "6 PM - 8 PM" },
] as const;

/** Optional; when unset, labels render as plain text (no outbound link). */
const DFESTIVAL_INFO_URL = process.env.NEXT_PUBLIC_DFESTIVAL_INFO_URL?.trim() ?? "";
const DMASTERS_INFO_URL = process.env.NEXT_PUBLIC_DMASTERS_INFO_URL?.trim() ?? "";

const interestLinkClass =
  "font-medium text-amber-600 underline decoration-amber-600/70 underline-offset-2 hover:text-amber-500";
const interestPlainClass = "font-medium text-stone-800";

function april2026FirstWeekday(): number {
  return new Date(PREFERRED_DATE_YEAR, PREFERRED_DATE_MONTH_INDEX, 1).getDay();
}

function isoApril2026(day: number): string {
  const m = String(PREFERRED_DATE_MONTH_INDEX + 1).padStart(2, "0");
  const d = String(day).padStart(2, "0");
  return `${PREFERRED_DATE_YEAR}-${m}-${d}`;
}

function formatHkPreferredDate(iso: string): string {
  const [y, mo, da] = iso.split("-").map((x) => parseInt(x, 10));
  if (!y || !mo || !da) return iso;
  return new Date(y, mo - 1, da).toLocaleDateString("zh-HK", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  });
}

const USAGE_KEYS = [
  { key: "personal_practice", label: "個人練習" },
  { key: "trial_play", label: "試奏" },
  { key: "audition_prep", label: "audition 準備" },
  { key: "competition_recording", label: "比賽錄影" },
  { key: "rehearsal", label: "綵排" },
  { key: "creation", label: "創作" },
  { key: "try_instrument", label: "試琴" },
  { key: "teaching", label: "教學" },
  { key: "student_lesson", label: "帶學生上課" },
  { key: "student_recording", label: "協助學生錄影" },
] as const;

const REGISTRATION_FIELD_LABELS: Record<string, string> = {
  nameZh: "中文姓名",
  nameEn: "英文姓名",
  email: "Email",
  phone: "聯絡電話",
  age: "年齡",
  phoneVerificationToken: "電話短訊驗證",
  teacherRecommended: "是否由老師推薦",
  teacherName: "推薦老師姓名",
  teacherContact: "推薦老師聯絡方式",
  userCategoryCode: "使用者類別",
  instrumentField: "樂器／音樂領域",
  identityFlags: "身份",
  identityOtherText: "其他身份說明",
  usagePurposes: "使用用途",
  preferredDates: "希望使用日期",
  preferredTimeText: "希望使用時段",
  extraNotes: "補充說明",
  interestDfestival: "D Festival 資訊",
  interestDmasters: "D Masters 資訊",
  marketingOptIn: "接收通知",
  socialFollowClaimed: "社群獎勵",
  wantsAmbassador: "D Ambassador",
  agreedTerms: "活動條款",
  agreedPrivacy: "私隱政策",
  agreedEmailNotifications: "電郵通知",
  referralCode: "推薦碼",
  captchaToken: "我不是機械人驗證",
  passkeyPreregToken: "生物認證（通行密鑰）",
};

function formatRegistrationApiError(payload: unknown): string {
  const fallback = "驗證失敗";
  if (!payload || typeof payload !== "object") return fallback;
  const err = (payload as { error?: { message?: string; details?: unknown } }).error;
  const base = typeof err?.message === "string" ? err.message : fallback;
  const details = err?.details;
  if (!details || typeof details !== "object") return base;
  const fieldErrors = (details as { fieldErrors?: Record<string, string[]> }).fieldErrors;
  if (!fieldErrors || typeof fieldErrors !== "object") return base;

  const lines: string[] = [];
  for (const [key, msgs] of Object.entries(fieldErrors)) {
    if (!Array.isArray(msgs) || msgs.length === 0) continue;
    const label = REGISTRATION_FIELD_LABELS[key] ?? key;
    lines.push(`${label}：${msgs.join("；")}`);
  }
  if (lines.length === 0) return base;
  return ["請修正以下項目：", ...lines].join("\n");
}

export function RegistrationForm() {
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
  const [wantsAmbassador, setWantsAmbassador] = useState(false);
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [agreedPrivacy, setAgreedPrivacy] = useState(false);
  const [agreedEmailNotifications, setAgreedEmailNotifications] = useState(true);
  const [referralCode, setReferralCode] = useState("");

  const interestSelectAllRef = useRef<HTMLInputElement>(null);
  const consentSelectAllRef = useRef<HTMLInputElement>(null);
  const recaptchaRef = useRef<RecaptchaV2Handle>(null);

  const recaptchaSiteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY ?? "";
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);

  const interestCheckValues = [
    interestDfestival,
    interestDmasters,
    marketingOptIn,
    socialFollowClaimed,
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
      setError("請先填寫有效聯絡電話。");
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
        setError(data?.error?.message ?? "無法發送驗證碼");
        return;
      }
      setPhoneVerificationToken(null);
      setPhoneVerified(false);
      setSmsCode("");
      setSmsCooldown(60);
    } catch {
      setError("網絡錯誤，請稍後再試。");
    } finally {
      setSmsBusy(false);
    }
  }

  async function verifyPhoneCode() {
    setError(null);
    const p = phone.trim();
    if (!/^\d{6}$/.test(smsCode.trim())) {
      setError("請輸入 6 位數字驗證碼。");
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
        setError(data?.error?.message ?? "驗證失敗");
        setPhoneVerified(false);
        setPhoneVerificationToken(null);
        return;
      }
      const tok = data?.phoneVerificationToken;
      if (typeof tok !== "string" || !tok) {
        setError("驗證回應異常，請重試。");
        return;
      }
      setPhoneVerificationToken(tok);
      setPhoneVerified(true);
    } catch {
      setError("網絡錯誤，請稍後再試。");
    } finally {
      setVerifyBusy(false);
    }
  }

  async function bindPasskey() {
    setError(null);
    if (!email.trim()) {
      setError("請先填寫 Email（用作通行密鑰顯示名稱）。");
      return;
    }
    if (!phoneVerificationToken || !phoneVerified) {
      setError("請先完成聯絡電話短訊驗證。");
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
            : "無法開始生物認證"
        );
        return;
      }
      const options = optData?.options;
      const preregChallengeId = optData?.preregChallengeId;
      if (!options || typeof preregChallengeId !== "string") {
        setError("伺服器回應異常，請稍後再試。");
        return;
      }
      setPasskeyPreregToken(null);
      let attResp;
      try {
        attResp = await startRegistration({ optionsJSON: options });
      } catch (e) {
        console.error(e);
        setError(
          "裝置或瀏覽器取消了驗證，或此環境不支援 Face ID／指紋（請使用 Safari／Chrome 並以 HTTPS 或 localhost 開啟）。"
        );
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
          typeof verData?.error?.message === "string" ? verData.error.message : "綁定失敗"
        );
        setPasskeyPreregToken(null);
        return;
      }
      const tok = verData?.passkeyPreregToken;
      if (typeof tok !== "string") {
        setError("綁定回應異常，請重試。");
        return;
      }
      setPasskeyPreregToken(tok);
    } catch {
      setError("網絡錯誤，請稍後再試。");
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
      setError("請至少選擇一項身份。");
      return;
    }
    if (identityFlags.includes("other") && !identityOtherText.trim()) {
      setError("請填寫「其他」身份說明。");
      return;
    }
    if (!agreedTerms || !agreedPrivacy) {
      setError("請勾選所有必須同意事項。");
      return;
    }
    if (!Number.isFinite(age) || age < 1 || age > 120) {
      setError("請填寫有效年齡（1–120）。");
      return;
    }
    if (!phoneVerificationToken || !phoneVerified) {
      setError("請先完成聯絡電話短訊驗證（發送驗證碼並輸入 6 位數字）。");
      return;
    }
    if (!webauthnSupported) {
      setError(
        "必須完成生物認證方可登記。請改用 Safari、Chrome 或 Edge 等支援通行密鑰嘅瀏覽器，並以 HTTPS 或 localhost 開啟本頁。"
      );
      return;
    }
    if (!passkeyPreregToken) {
      setError("請先按「綁定 Face ID／指紋」並通過裝置驗證；生物認證為登記必要步驟。");
      return;
    }
    if (recaptchaSiteKey && !captchaToken) {
      setError("請完成「我不是機械人」驗證。");
      return;
    }
    setLoading(true);

    const usagePurposes: Record<string, boolean | string> = { ...usage };
    if (usageOther.trim()) usagePurposes.otherText = usageOther.trim();

    const preferredDatesArr = selectedPreferredDates.length ? selectedPreferredDates : null;
    const preferredTimeLines = PREFERRED_TIME_SLOTS.filter((s) =>
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
            ? formatRegistrationApiError(data)
            : typeof data?.error?.message === "string"
              ? data.error.message
              : "提交失敗";
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
      setError("網絡錯誤，請稍後再試。");
    }
    setLoading(false);
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-2xl space-y-10 pb-24">
      {error && (
        <div className="whitespace-pre-wrap rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
          {error}
        </div>
      )}

      <section className="space-y-4">
        <h2 className="font-serif text-xl text-stone-900">基本資料</h2>
        <label className="block text-sm">
          <span className="text-stone-700">中文姓名（必填）</span>
          <input
            required
            className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2"
            value={nameZh}
            onChange={(e) => setNameZh(e.target.value)}
          />
        </label>
        <label className="block text-sm">
          <span className="text-stone-700">英文姓名</span>
          <input
            className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2"
            value={nameEn}
            onChange={(e) => setNameEn(e.target.value)}
          />
        </label>
        <label className="block text-sm">
          <span className="text-stone-700">Email（必填，作為登入帳號）</span>
          <input
            required
            type="email"
            className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setPasskeyPreregToken(null);
            }}
          />
        </label>
        <div className="rounded-xl border border-stone-200 bg-stone-50/80 px-4 py-4">
          <div className="mb-4 rounded-lg border border-emerald-100 bg-emerald-50/90 px-3 py-3 text-xs text-emerald-950">
            <p className="font-medium text-emerald-900">私隱與安全</p>
            <p className="mt-2 leading-relaxed text-emerald-900/90">
              於此部分所提供之<strong>聯絡電話</strong>及<strong>生物認證</strong>資料（例如 Face ID、指紋等），我們將視為個人資料並
              <strong>嚴格保密</strong>，僅供身份驗證、防止重複註冊及維護帳戶安全之用，並依您已同意之私隱政策處理；不會用於與本服務無關之推廣，亦不會任意向第三方披露。
            </p>
            <p className="mt-2 leading-relaxed text-emerald-900/90">
              Face ID、指紋等生物特徵資料<strong>主要保留於您的裝置</strong>；我們的伺服器僅儲存經加密處理之通行密鑰相關技術資料，以核實為本人操作，
              <strong>無法還原您的容貌或指紋圖像</strong>。
            </p>
          </div>
          <label className="block text-sm">
            <span className="text-stone-700">
              聯絡電話<span className="text-red-700">（必填）</span>
            </span>
            <span className="mt-1 block text-xs text-stone-500">
              用作接收 SMS 驗證碼；每個電話號碼只可登記一個帳戶（防止重複註冊）。
            </span>
            <input
              required
              className="mt-2 w-full rounded-lg border border-stone-300 bg-white px-3 py-2"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                setPhoneVerificationToken(null);
                setPhoneVerified(false);
                setSmsCode("");
                setPasskeyPreregToken(null);
              }}
              placeholder="例如 91234567 或 +85291234567"
            />
          </label>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={smsBusy || smsCooldown > 0 || !phone.trim()}
              onClick={() => void sendPhoneCode()}
              className="rounded-lg bg-stone-800 px-4 py-2 text-sm text-white hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {smsCooldown > 0 ? `已發送（${smsCooldown}s 後可再發）` : smsBusy ? "發送中…" : "發送驗證碼"}
            </button>
            {phoneVerified && (
              <span className="text-sm font-medium text-emerald-700">✓ 電話已驗證</span>
            )}
          </div>
          <div className="mt-4 flex flex-wrap items-end gap-2">
            <label className="block text-sm">
              <span className="text-stone-700">SMS 驗證碼（6 位數字）</span>
              <input
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                className="mt-1 w-40 rounded-lg border border-stone-300 bg-white px-3 py-2 font-mono tracking-widest"
                value={smsCode}
                onChange={(e) => setSmsCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="______"
              />
            </label>
            <button
              type="button"
              disabled={verifyBusy || smsCode.length !== 6 || !phone.trim()}
              onClick={() => void verifyPhoneCode()}
              className="rounded-lg border border-stone-400 bg-white px-4 py-2 text-sm text-stone-800 hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {verifyBusy ? "驗證中…" : "確認驗證碼"}
            </button>
          </div>
          {phoneVerified && webauthnSupported && (
            <div className="mt-6 border-t border-stone-200 pt-4">
              <p className="text-sm font-medium text-stone-800">生物認證</p>
              <p className="mt-1 text-xs text-stone-600">
                登記前必須於本裝置完成 Face ID、Touch ID 或指紋等驗證（視乎裝置），以綁定通行密鑰；完成後亦可用同一方式登入，並仍可使用電郵及密碼登入。
              </p>
              {!email.trim() && (
                <p className="mt-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-950">
                  請先在<strong className="font-semibold">上方「Email（作為登入帳號）」</strong>
                  填寫有效電郵，然後再按「綁定 Face ID／指紋」。通行密鑰會與該電郵綁定。
                </p>
              )}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={passkeyBusy}
                  onClick={() => void bindPasskey()}
                  className="rounded-lg border border-stone-700 bg-white px-4 py-2 text-sm text-stone-900 hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {passkeyBusy ? "處理中…" : passkeyPreregToken ? "重新綁定 Face ID／指紋" : "綁定 Face ID／指紋"}
                </button>
                {passkeyPreregToken && (
                  <span className="text-sm font-medium text-emerald-700">✓ 已完成生物認證</span>
                )}
              </div>
            </div>
          )}
          {phoneVerified && !webauthnSupported && (
            <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 px-3 py-3 text-xs text-amber-950">
              <p className="font-medium">必須完成生物認證先可以提交登記。</p>
              <p className="mt-1 text-amber-900/90">
                你目前嘅瀏覽器不支援通行密鑰（WebAuthn）。請改用 Safari、Chrome 或 Edge，並以
                HTTPS 或 localhost 開啟本頁，然後重新驗證電話並綁定 Face ID／指紋。
              </p>
            </div>
          )}
        </div>
        <label className="block text-sm">
          <span className="text-stone-700">年齡</span>
          <input
            required
            type="number"
            min={1}
            max={120}
            className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2"
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
          是否由老師推薦
        </label>
        {teacherRecommended && (
          <>
            <label className="block text-sm">
              <span className="text-stone-700">推薦老師姓名</span>
              <input
                className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2"
                value={teacherName}
                onChange={(e) => setTeacherName(e.target.value)}
              />
            </label>
            <label className="block text-sm">
              <span className="text-stone-700">推薦老師聯絡方式</span>
              <input
                className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2"
                value={teacherContact}
                onChange={(e) => setTeacherContact(e.target.value)}
              />
            </label>
          </>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="font-serif text-xl text-stone-900">使用者類別</h2>
        <select
          className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
          value={userCategoryCode}
          onChange={(e) => setUserCategoryCode(e.target.value as "personal" | "teaching")}
        >
          <option value="personal">個人使用者</option>
          <option value="teaching">教學 / 帶學生使用者</option>
        </select>
      </section>

      <section className="space-y-4">
        <h2 className="font-serif text-xl text-stone-900">音樂背景</h2>
        <label className="block text-sm">
          <span className="text-stone-700">樂器 / 音樂領域</span>
          <input
            required
            className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2"
            value={instrumentField}
            onChange={(e) => setInstrumentField(e.target.value)}
          />
        </label>
        <p className="text-sm text-stone-700">身份（可複選）</p>
        <div className="flex flex-wrap gap-3">
          {IDENTITY_OPTIONS.map((o) => (
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
            <span className="text-stone-700">請說明你的身份（必填）</span>
            <input
              required
              className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2"
              value={identityOtherText}
              onChange={(e) => setIdentityOtherText(e.target.value)}
              placeholder="例如：音樂製作人、樂團成員…"
            />
          </label>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="font-serif text-xl text-stone-900">使用用途</h2>
        <div className="grid gap-2 sm:grid-cols-2">
          {USAGE_KEYS.map((u) => (
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
          <span className="text-stone-700">其他用途說明</span>
          <input
            className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2"
            value={usageOther}
            onChange={(e) => setUsageOther(e.target.value)}
          />
        </label>
      </section>

      <section className="space-y-4">
        <h2 className="font-serif text-xl text-stone-900">初步預約意向</h2>
        <div>
          <p className="text-sm text-stone-700">希望使用日期（可複選）</p>
          <p className="mt-1 text-xs text-stone-500">以下為 2026 年 4 月；單擊日子可選取，再單擊可取消。</p>
          <div className="mt-4 flex flex-col gap-6 lg:flex-row lg:items-start">
            <div className="rounded-xl border border-stone-200 bg-stone-50/80 p-4 lg:max-w-md lg:flex-1">
              <p className="text-center text-sm font-medium text-stone-800">2026 年 4 月</p>
              <div className="mt-3 grid grid-cols-7 gap-1 text-center text-xs text-stone-500">
                {["日", "一", "二", "三", "四", "五", "六"].map((w) => (
                  <div key={w} className="py-1 font-medium">
                    {w}
                  </div>
                ))}
                {Array.from({ length: april2026FirstWeekday() }, (_, i) => (
                  <div key={`pad-${i}`} />
                ))}
                {Array.from({ length: PREFERRED_DATE_DAYS }, (_, i) => {
                  const day = i + 1;
                  const iso = isoApril2026(day);
                  const on = selectedPreferredDates.includes(iso);
                  return (
                    <button
                      key={iso}
                      type="button"
                      onClick={() => togglePreferredDate(iso)}
                      className={`aspect-square rounded-lg text-sm font-medium transition ${
                        on
                          ? "bg-stone-900 text-white shadow-sm"
                          : "bg-white text-stone-800 ring-1 ring-stone-200 hover:bg-stone-100"
                      }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="min-h-[8rem] flex-1 rounded-xl border border-stone-200 bg-white px-4 py-3">
              <p className="text-sm font-medium text-stone-800">已選日期</p>
              {selectedPreferredDates.length === 0 ? (
                <p className="mt-2 text-sm text-stone-500">
                  「尚未選擇」，請在日曆點選日子。
                </p>
              ) : (
                <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-stone-700">
                  {selectedPreferredDates.map((iso) => (
                    <li key={iso}>{formatHkPreferredDate(iso)}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
        <div>
          <p className="text-sm text-stone-700">希望使用時段（可複選）</p>
          <div className="mt-2 space-y-2">
            {PREFERRED_TIME_SLOTS.map((s) => (
              <label
                key={s.id}
                className="flex cursor-pointer items-center gap-3 rounded-lg border border-stone-200 bg-stone-50/60 px-3 py-2.5 text-sm hover:bg-stone-100/80"
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
          <span className="text-stone-700">補充說明</span>
          <textarea
            className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2"
            rows={3}
            value={extraNotes}
            onChange={(e) => setExtraNotes(e.target.value)}
          />
        </label>
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-serif text-xl text-stone-900">興趣與資訊</h2>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-stone-600">
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
                setWantsAmbassador(v);
              }}
            />
            全部選取
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
            有興趣了解 2026{" "}
            {DFESTIVAL_INFO_URL ? (
              <a
                href={DFESTIVAL_INFO_URL}
                target="_blank"
                rel="noopener noreferrer"
                className={interestLinkClass}
                onClick={(e) => e.stopPropagation()}
              >
                D Festival 青年鋼琴家藝術節
              </a>
            ) : (
              <span className={interestPlainClass}>D Festival 青年鋼琴家藝術節</span>
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
            有興趣了解 2026{" "}
            {DMASTERS_INFO_URL ? (
              <a
                href={DMASTERS_INFO_URL}
                target="_blank"
                rel="noopener noreferrer"
                className={interestLinkClass}
                onClick={(e) => e.stopPropagation()}
              >
                D Masters 國際鋼琴比賽
              </a>
            ) : (
              <span className={interestPlainClass}>D Masters 國際鋼琴比賽</span>
            )}
          </span>
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={marketingOptIn}
            onChange={(e) => setMarketingOptIn(e.target.checked)}
          />
          願意接收活動資訊與通知
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={socialFollowClaimed}
            onChange={(e) => setSocialFollowClaimed(e.target.checked)}
          />
          我希望追蹤指定社交媒體帳號，以獲取社群獎勵（額外 1 節 30 分鐘 bonus slot）
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={wantsAmbassador}
            onChange={(e) => setWantsAmbassador(e.target.checked)}
          />
          希望成為 D Ambassador / 分享優惠
        </label>
        <label className="block text-sm">
          <span className="text-stone-700">推薦碼（如有）</span>
          <input
            className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2"
            value={referralCode}
            onChange={(e) => setReferralCode(e.target.value)}
          />
        </label>
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-serif text-xl text-stone-900">同意事項</h2>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-stone-600">
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
            全部選取
          </label>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={agreedTerms}
            onChange={(e) => setAgreedTerms(e.target.checked)}
          />
          已閱讀並同意活動條款
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={agreedPrivacy}
            onChange={(e) => setAgreedPrivacy(e.target.checked)}
          />
          已閱讀並同意資料收集安排
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={agreedEmailNotifications}
            onChange={(e) => setAgreedEmailNotifications(e.target.checked)}
          />
          同意透過 Email 收取系統通知
        </label>
      </section>

      {recaptchaSiteKey ? (
        <section className="space-y-2 rounded-xl border border-stone-200 bg-stone-50/80 px-4 py-4">
          <h2 className="font-serif text-lg text-stone-900">安全驗證</h2>
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
        {loading ? "提交中…" : "提交登記"}
      </button>
    </form>
  );
}
