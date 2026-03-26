import { normalizePhoneForSms } from "@/lib/phone-normalize";

/** Opens WhatsApp chat for the given stored phone (HK-friendly). */
export function whatsAppWebUrl(phone: string): string | null {
  const e164 = normalizePhoneForSms(phone);
  if (!e164) return null;
  const digits = e164.replace(/\D/g, "");
  if (digits.length < 8) return null;
  return `https://wa.me/${digits}`;
}
