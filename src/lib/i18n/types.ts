export type Locale = "zh-HK" | "en";

/** Same nested shape as the source dictionary, but leaf strings are `string` (for locale variants). */
export type DeepStringValues<T> = T extends string
  ? string
  : T extends ReadonlyArray<infer U>
    ? ReadonlyArray<DeepStringValues<U>>
    : T extends object
      ? { readonly [K in keyof T]: DeepStringValues<T[K]> }
      : T;

export const FMS_LOCALE_STORAGE_KEY = "fms-locale";
export const FMS_LOCALE_EVENT = "fms-locale-change";
