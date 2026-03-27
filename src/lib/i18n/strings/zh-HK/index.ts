import type { DeepStringValues } from "@/lib/i18n/types";
import { accountZhHK } from "./account-ui";
import { bookingZhHK } from "./booking-ui";
import { coreZhHK } from "./core";
import { regZhHK } from "./registration";

export const zhHKStrings = {
  ...coreZhHK,
  reg: regZhHK,
  about: {},
  booking: bookingZhHK,
  account: accountZhHK,
};

export type AppStrings = DeepStringValues<typeof zhHKStrings>;
