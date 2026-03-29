/** Elfsight Instagram Feed — default app id (override with NEXT_PUBLIC_ELFSIGHT_FANTASIA_MUSIC_SPACE_WIDGET_CLASS). */
export const FANTASIA_MUSIC_SPACE_ELFSIGHT_WIDGET_CLASS =
  "elfsight-app-353c18a5-3fca-44e6-88a7-17f4afd3d7ae";

/** Elfsight Instagram (or feed) widget class for the Fantasia Music Space page. */
export function fantasiaInstagramElfsightClassFromEnv(): string {
  const raw =
    process.env.NEXT_PUBLIC_ELFSIGHT_FANTASIA_MUSIC_SPACE_WIDGET_CLASS?.trim() ?? "";
  return raw && /^elfsight-app-[a-z0-9-]+$/i.test(raw)
    ? raw
    : FANTASIA_MUSIC_SPACE_ELFSIGHT_WIDGET_CLASS;
}
