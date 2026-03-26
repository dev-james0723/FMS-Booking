/**
 * Verifies Google reCAPTCHA v2 / v3 response token (siteverify API).
 */
export async function verifyRecaptchaResponse(
  token: string | undefined,
  remoteIp?: string
): Promise<boolean> {
  const secret = process.env.RECAPTCHA_SECRET_KEY?.trim();
  if (!secret) {
    return true;
  }
  if (!token?.trim()) {
    return false;
  }

  const params = new URLSearchParams();
  params.set("secret", secret);
  params.set("response", token.trim());
  if (remoteIp) {
    params.set("remoteip", remoteIp);
  }

  const res = await fetch("https://www.google.com/recaptcha/api/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  if (!res.ok) {
    return false;
  }

  const data = (await res.json()) as {
    success?: boolean;
    score?: number;
    action?: string;
    "error-codes"?: string[];
  };

  if (!data.success) {
    return false;
  }

  return true;
}
