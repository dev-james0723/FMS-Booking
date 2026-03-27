import { EmailLogStatus } from "@prisma/client";
import { Resend } from "resend";
import { escapeHtml } from "@/lib/email/escape-html";
import { logEmail } from "@/lib/email/log";
import { identityFlagsToZh, userCategoryLabelZh } from "@/lib/identity-labels";
import { regZhHK } from "@/lib/i18n/strings/zh-HK/registration";

const fieldLabels = regZhHK.fieldLabels as Record<string, string>;
const usageLabels = regZhHK.usage as Record<string, string>;

function defaultRegistrationAdminEmails(): string[] {
  const raw =
    process.env.REGISTRATION_ADMIN_NOTIFY_EMAIL?.trim() ||
    "dfestival.office@gmail.com";
  return raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

function formatIsoDateZhHk(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (!m) return iso;
  const y = parseInt(m[1], 10);
  const mo = parseInt(m[2], 10);
  const da = parseInt(m[3], 10);
  const d = new Date(Date.UTC(y, mo - 1, da, 12, 0, 0));
  return d.toLocaleDateString("zh-HK", {
    timeZone: "Asia/Hong_Kong",
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  });
}

function formatBool(v: unknown): string {
  if (v === true) return "是";
  if (v === false) return "否";
  return "—";
}

function formatUsagePurposes(up: unknown): string {
  if (!up || typeof up !== "object") return "—";
  const o = up as Record<string, unknown>;
  const parts: string[] = [];
  for (const [k, v] of Object.entries(o)) {
    if (k === "otherText") {
      if (typeof v === "string" && v.trim()) parts.push(`其他用途說明：${v.trim()}`);
      continue;
    }
    const label = usageLabels[k] ?? k;
    if (typeof v === "boolean" && v) parts.push(label);
    else if (typeof v === "string" && v.trim()) parts.push(`${label}：${v.trim()}`);
  }
  return parts.length ? parts.join("；") : "—";
}

const SNAPSHOT_FIELD_ORDER: string[] = [
  "nameZh",
  "nameEn",
  "email",
  "phone",
  "age",
  "isAge17OrAbove",
  "teacherRecommended",
  "teacherName",
  "teacherContact",
  "userCategoryCode",
  "instrumentField",
  "identityFlags",
  "identityOtherText",
  "usagePurposes",
  "preferredDates",
  "preferredTimeText",
  "extraNotes",
  "interestDfestival",
  "interestDmasters",
  "marketingOptIn",
  "socialFollowClaimed",
  "socialRepostClaimed",
  "wantsAmbassador",
  "agreedTerms",
  "agreedPrivacy",
  "agreedEmailNotifications",
  "referralCode",
];

function formatSnapshotValue(key: string, value: unknown): string {
  if (value === null || value === undefined) return "—";
  switch (key) {
    case "userCategoryCode":
      return userCategoryLabelZh(typeof value === "string" ? value : "");
    case "identityFlags":
      return identityFlagsToZh(value).join("、") || "—";
    case "usagePurposes":
      return formatUsagePurposes(value);
    case "preferredDates":
      if (!Array.isArray(value) || value.length === 0) return "—";
      return value
        .filter((x): x is string => typeof x === "string")
        .map(formatIsoDateZhHk)
        .join("；");
    case "preferredTimeText":
    case "extraNotes":
      return typeof value === "string" && value.trim() ? value.trim() : "—";
    case "teacherRecommended":
    case "interestDfestival":
    case "interestDmasters":
    case "marketingOptIn":
    case "socialFollowClaimed":
    case "socialRepostClaimed":
    case "wantsAmbassador":
    case "agreedTerms":
    case "agreedPrivacy":
    case "agreedEmailNotifications":
    case "isAge17OrAbove":
      return formatBool(value);
    default:
      if (typeof value === "boolean") return formatBool(value);
      if (typeof value === "number" && Number.isFinite(value)) return String(value);
      if (typeof value === "string") return value.trim() || "—";
      try {
        return JSON.stringify(value);
      } catch {
        return String(value);
      }
  }
}

function labelForKey(key: string): string {
  return fieldLabels[key] ?? key;
}

function buildDetailRows(snapshot: Record<string, unknown>): { key: string; label: string; value: string }[] {
  const seen = new Set<string>();
  const rows: { key: string; label: string; value: string }[] = [];

  for (const key of SNAPSHOT_FIELD_ORDER) {
    if (!(key in snapshot)) continue;
    seen.add(key);
    rows.push({
      key,
      label: labelForKey(key),
      value: formatSnapshotValue(key, snapshot[key]),
    });
  }

  const rest = Object.keys(snapshot)
    .filter((k) => !seen.has(k))
    .sort();
  for (const key of rest) {
    rows.push({
      key,
      label: labelForKey(key),
      value: formatSnapshotValue(key, snapshot[key]),
    });
  }

  return rows;
}

export async function sendRegistrationAdminNotification(params: {
  userId: string;
  registrantEmail: string;
  payloadSnapshot: Record<string, unknown>;
  clientIp: string | null;
}): Promise<void> {
  const toList = defaultRegistrationAdminEmails();
  const nameZh =
    typeof params.payloadSnapshot.nameZh === "string"
      ? params.payloadSnapshot.nameZh.trim()
      : "（未有中文姓名）";
  const subject = `【新用戶登記】${nameZh}｜${params.registrantEmail}`;

  const rows = buildDetailRows(params.payloadSnapshot);
  const textLines = [
    "【通知】有新用戶剛完成網上登記並建立帳戶。",
    "",
    "以下為該用戶於登記表格提交之全部資料（與系統儲存快照一致；不含短訊驗證憑證、通行密鑰 token、機械人驗證等敏感欄位）。",
    "",
    `內部用戶 ID：${params.userId}`,
    `登入電郵：${params.registrantEmail}`,
    params.clientIp ? `提交來源 IP：${params.clientIp}` : "提交來源 IP：—",
    "",
    "—— 登記表格資料 ——",
    ...rows.map((r) => `${r.label}：${r.value}`),
  ];
  const text = textLines.join("\n");

  const safe = (v: string) => escapeHtml(v);
  const tableRows = rows
    .map(
      (r) =>
        `<tr><td style="padding:8px 10px;border-bottom:1px solid #e7e5e4;color:#78716c;width:160px;vertical-align:top;">${safe(r.label)}</td><td style="padding:8px 10px;border-bottom:1px solid #e7e5e4;white-space:pre-wrap;word-break:break-word;">${safe(r.value)}</td></tr>`
    )
    .join("");

  const html = `<!DOCTYPE html>
<html lang="zh-HK"><head><meta charset="utf-8" /></head>
<body style="margin:0;padding:20px;font-family:system-ui,sans-serif;font-size:14px;line-height:1.55;color:#1c1917;background:#fafaf9;">
  <div style="max-width:640px;margin:0 auto;">
    <p style="margin:0 0 12px;padding:12px 16px;background:#fef3c7;border-radius:8px;border:1px solid #fcd34d;font-weight:600;color:#78350f;">
      有新用戶剛完成登記
    </p>
    <p style="margin:0 0 16px;color:#44403c;">
      以下為該用戶於登記表格提交之全部資料（與系統儲存快照一致；不含短訊驗證憑證、通行密鑰 token、機械人驗證等敏感欄位）。
    </p>
    <p style="margin:0 0 8px;"><strong>內部用戶 ID</strong> <code>${safe(params.userId)}</code></p>
    <p style="margin:0 0 8px;"><strong>登入電郵</strong> ${safe(params.registrantEmail)}</p>
    <p style="margin:0 0 20px;"><strong>提交來源 IP</strong> ${safe(params.clientIp ?? "—")}</p>
    <h2 style="font-size:16px;margin:0 0 10px;">登記表格資料</h2>
    <table style="border-collapse:collapse;width:100%;background:#fff;border-radius:8px;overflow:hidden;border:1px solid #e7e5e4;">${tableRows}</table>
  </div>
</body></html>`;

  if (process.env.NODE_ENV === "development") {
    console.info("[email:registration_admin_notify]\n", text);
  }

  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from =
    process.env.EMAIL_FROM?.trim() || "D Festival <onboarding@resend.dev>";

  if (!apiKey) {
    for (const toEmail of toList) {
      await logEmail({
        userId: params.userId,
        templateKey: "registration_admin_notify",
        toEmail,
        subject,
        payload: { channel: "none" },
        status: EmailLogStatus.failed,
        error: "RESEND_API_KEY 未設定；管理員註冊通知電郵未寄出。",
      });
    }
    return;
  }

  const resend = new Resend(apiKey);

  for (const toEmail of toList) {
    try {
      const { data, error } = await resend.emails.send({
        from,
        to: [toEmail],
        subject,
        text,
        html,
      });

      if (error) {
        const msg = error.message ?? JSON.stringify(error);
        await logEmail({
          userId: params.userId,
          templateKey: "registration_admin_notify",
          toEmail,
          subject,
          payload: { channel: "resend" },
          status: EmailLogStatus.failed,
          error: msg,
        });
        continue;
      }

      await logEmail({
        userId: params.userId,
        templateKey: "registration_admin_notify",
        toEmail,
        subject,
        payload: { channel: "resend" },
        status: EmailLogStatus.sent,
        providerMessageId: data?.id,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      await logEmail({
        userId: params.userId,
        templateKey: "registration_admin_notify",
        toEmail,
        subject,
        payload: { channel: "resend" },
        status: EmailLogStatus.failed,
        error: msg,
      });
    }
  }
}
