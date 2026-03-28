import type { BookingVenueKind } from "@prisma/client";
import { accountEn } from "@/lib/i18n/strings/en/account-ui";
import { accountZhHK } from "@/lib/i18n/strings/zh-HK/account-ui";
import type { Locale } from "@/lib/i18n/types";

/** Same copy as `account.*` strings; used for headings so SSR and client stay aligned. */
export function accountPageHeading(locale: Locale, bookingVenueKind: BookingVenueKind): string {
  const a = locale === "en" ? accountEn : accountZhHK;
  return bookingVenueKind === "open_space" ? a.pageTitleOpenSpace : a.pageTitleStudio;
}
