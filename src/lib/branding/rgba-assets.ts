/** Raw RGBA sources in `public/branding/` (width × height × 4 bytes). */
export const BRANDING_RGBA_ASSETS = {
  "d-festival-young-pianist": {
    file: "d-festival-young-pianist.rgba",
    width: 3407,
    height: 1149,
  },
  "fantasia-music-space": {
    file: "fantasia-music-space.rgba",
    width: 2481,
    height: 2481,
  },
} as const;

export type BrandingRgbaSlug = keyof typeof BRANDING_RGBA_ASSETS;

export function isBrandingRgbaSlug(s: string): s is BrandingRgbaSlug {
  return s in BRANDING_RGBA_ASSETS;
}
