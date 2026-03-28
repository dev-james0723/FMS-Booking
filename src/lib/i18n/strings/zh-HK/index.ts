import type { DeepStringValues } from "@/lib/i18n/types";
import { accountZhHK } from "./account-ui";
import { bookingZhHK } from "./booking-ui";
import { coreZhHK } from "./core";
import { directionsZhHK } from "./directions-ui";
import { regZhHK } from "./registration";

export const zhHKStrings = {
  ...coreZhHK,
  reg: regZhHK,
  about: {},
  booking: bookingZhHK,
  account: accountZhHK,
  directions: directionsZhHK,
};

export type AppStrings = DeepStringValues<typeof zhHKStrings>;
