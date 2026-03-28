import { sanitizeTwilioSecretValue } from "@/lib/sms/twilio-env";

export type SendSmsResult =
  | { ok: true; dev?: boolean }
  | { ok: false; error: string };

function twilioApiErrorMessage(status: number, bodyText: string): string {
  try {
    const j = JSON.parse(bodyText) as { message?: string; code?: number };
    if (j.message) {
      return typeof j.code === "number"
        ? `${j.message}（Twilio 錯誤碼 ${j.code}）`
        : j.message;
    }
  } catch {
    /* non-JSON body */
  }
  return `Twilio 寄送失敗（HTTP ${status}）。請檢查號碼格式、寄件號碼／Messaging Service 及 Twilio 控制台。`;
}

/**
 * Sends SMS via Twilio REST. In development, if Twilio is not configured, logs the body instead.
 * Set either TWILIO_FROM_NUMBER (E.164) or TWILIO_MESSAGING_SERVICE_SID (MG…).
 */
export async function sendSms(params: {
  toE164: string;
  body: string;
}): Promise<SendSmsResult> {
  const sid = sanitizeTwilioSecretValue(process.env.TWILIO_ACCOUNT_SID);
  const token = sanitizeTwilioSecretValue(process.env.TWILIO_AUTH_TOKEN);
  const from = sanitizeTwilioSecretValue(process.env.TWILIO_FROM_NUMBER);
  const messagingServiceSid = sanitizeTwilioSecretValue(
    process.env.TWILIO_MESSAGING_SERVICE_SID
  );

  const senderOk = Boolean(from) || Boolean(messagingServiceSid);
  if (!sid || !token || !senderOk) {
    if (process.env.NODE_ENV === "development") {
      console.info(
        `[SMS dev] Twilio 未設定；以下為本機測試用短訊內容\nto=${params.toE164}\n${params.body}`
      );
      return { ok: true, dev: true };
    }
    return {
      ok: false,
      error:
        "SMS 未設定：請設定 TWILIO_ACCOUNT_SID、TWILIO_AUTH_TOKEN，以及 TWILIO_FROM_NUMBER（E.164）或 TWILIO_MESSAGING_SERVICE_SID。",
    };
  }

  const auth = Buffer.from(`${sid}:${token}`).toString("base64");
  const form = new URLSearchParams({
    To: params.toE164,
    Body: params.body,
  });
  if (messagingServiceSid) {
    form.set("MessagingServiceSid", messagingServiceSid);
  } else {
    form.set("From", from!);
  }

  try {
    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: form.toString(),
      }
    );

    if (!res.ok) {
      const text = await res.text();
      console.error("[SMS Twilio]", res.status, text);
      return {
        ok: false,
        error: twilioApiErrorMessage(res.status, text),
      };
    }

    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[SMS Twilio] request failed", e);
    return {
      ok: false,
      error: `無法連線至 Twilio：${msg}`,
    };
  }
}
