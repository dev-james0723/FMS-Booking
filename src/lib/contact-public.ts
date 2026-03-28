/** Public contact channels (site footer, contact page, transactional emails). */
export const CONTACT_PHONE_E164 = "+85291636378";
/** Human-readable HK number (matches contact page copy). */
export const CONTACT_PHONE_DISPLAY = "+852 9163 6378";
export const CONTACT_PUBLIC_EMAIL = "fantasiamusicspace@gmail.com";
export const CONTACT_WHATSAPP_URL = "https://wa.link/y4ody9";

export function gmailComposeUrl(to: string): string {
  return `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(to)}`;
}
