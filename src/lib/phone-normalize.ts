/**
 * Normalize to E.164 for SMS + unique DB lookup (HK mobiles + generic international).
 */
export function normalizePhoneForSms(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const compact = trimmed.replace(/[\s().-]/g, "");
  if (!compact) return null;

  if (compact.startsWith("+")) {
    if (/^\+[1-9]\d{7,14}$/.test(compact)) return compact;
    return null;
  }

  if (/^[569]\d{7}$/.test(compact)) return `+852${compact}`;
  if (/^852[569]\d{7}$/.test(compact)) return `+${compact}`;
  if (/^0[569]\d{7}$/.test(compact)) return `+852${compact.slice(1)}`;

  if (/^[1-9]\d{7,14}$/.test(compact)) return `+${compact}`;

  return null;
}
