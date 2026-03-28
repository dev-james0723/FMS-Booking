import type { AppStrings } from "@/lib/i18n/strings/zh-HK";
import { accountEn } from "./account-ui";
import { bookingEn } from "./booking-ui";
import { coreEn } from "./core";
import { directionsEn } from "./directions-ui";
import { regEn } from "./registration";

export const enStrings: AppStrings = {
  ...coreEn,
  reg: regEn,
  about: {},
  booking: bookingEn,
  account: accountEn,
  directions: directionsEn,
};
