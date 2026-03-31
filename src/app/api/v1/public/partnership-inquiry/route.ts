import { jsonError, jsonOk } from "@/lib/api-response";
import { sendPartnershipInquiryEmails } from "@/lib/email/partnership-inquiry";
import { partnershipInquirySchema } from "@/lib/validation/partnership-inquiry";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError("INVALID_JSON", "Invalid JSON body", 400);
  }

  const parsed = partnershipInquirySchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("VALIDATION_ERROR", "Validation failed", 422, parsed.error.flatten());
  }

  const result = await sendPartnershipInquiryEmails(parsed.data);

  if (!result.confirmationOk || !result.officeOk) {
    return jsonError(
      "EMAIL_SEND_FAILED",
      result.error ?? "無法發送電郵，請稍後再試或直接致電聯絡。",
      502,
    );
  }

  return jsonOk({ ok: true });
}
