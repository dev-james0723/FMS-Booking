export type SendSmsResult =
  | { ok: true; dev?: boolean }
  | { ok: false; error: string };

/**
 * Sends SMS via Twilio REST. In development, if Twilio is not configured, logs the body instead.
 */
export async function sendSms(params: {
  toE164: string;
  body: string;
}): Promise<SendSmsResult> {
  const sid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const token = process.env.TWILIO_AUTH_TOKEN?.trim();
  const from = process.env.TWILIO_FROM_NUMBER?.trim();

  if (!sid || !token || !from) {
    if (process.env.NODE_ENV === "development") {
      console.info(
        `[SMS dev] Twilio 未設定；以下為本機測試用短訊內容\nto=${params.toE164}\n${params.body}`
      );
      return { ok: true, dev: true };
    }
    return {
      ok: false,
      error:
        "SMS 未設定：請設定 TWILIO_ACCOUNT_SID、TWILIO_AUTH_TOKEN、TWILIO_FROM_NUMBER（E.164）",
    };
  }

  const auth = Buffer.from(`${sid}:${token}`).toString("base64");
  const form = new URLSearchParams({
    To: params.toE164,
    From: from,
    Body: params.body,
  });

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
      error: `Twilio 寄送失敗（${res.status}）。請檢查號碼格式及 Twilio 控制台。`,
    };
  }

  return { ok: true };
}
