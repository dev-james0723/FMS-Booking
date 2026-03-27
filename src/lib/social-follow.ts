export const SOCIAL_FOLLOW_LINK_KEYS = [
  "dfestival_ig",
  "dfestival_fb",
  "hk_fantasia_mgmt_ig",
  "hk_fantasia_mgmt_fb",
  "fantasia_space_ig",
  "fantasia_space_fb",
] as const;

export type SocialFollowLinkKey = (typeof SOCIAL_FOLLOW_LINK_KEYS)[number];

export const SOCIAL_FOLLOW_ACCOUNTS: {
  columnTitle: string;
  keys: { ig: SocialFollowLinkKey; fb: SocialFollowLinkKey };
}[] = [
  {
    columnTitle: "D Festival 青年鋼琴家藝術節",
    keys: { ig: "dfestival_ig", fb: "dfestival_fb" },
  },
  {
    columnTitle: "香港幻樂國際有限公司",
    keys: { ig: "hk_fantasia_mgmt_ig", fb: "hk_fantasia_mgmt_fb" },
  },
  {
    columnTitle: "幻樂空間 Fantasia Music Space",
    keys: { ig: "fantasia_space_ig", fb: "fantasia_space_fb" },
  },
];

const ENV_URL_KEYS: Record<SocialFollowLinkKey, string> = {
  dfestival_ig: "NEXT_PUBLIC_SOCIAL_DFESTIVAL_IG_URL",
  dfestival_fb: "NEXT_PUBLIC_SOCIAL_DFESTIVAL_FB_URL",
  hk_fantasia_mgmt_ig: "NEXT_PUBLIC_SOCIAL_HK_FANTASIA_MGMT_IG_URL",
  hk_fantasia_mgmt_fb: "NEXT_PUBLIC_SOCIAL_HK_FANTASIA_MGMT_FB_URL",
  fantasia_space_ig: "NEXT_PUBLIC_SOCIAL_FANTASIA_SPACE_IG_URL",
  fantasia_space_fb: "NEXT_PUBLIC_SOCIAL_FANTASIA_SPACE_FB_URL",
};

/** Production defaults; override per key with matching NEXT_PUBLIC_* in `.env` if URLs change. */
export const DEFAULT_SOCIAL_FOLLOW_URLS: Record<SocialFollowLinkKey, string> = {
  dfestival_ig:
    "https://www.instagram.com/dfestival_2026?igsh=MTk2ZjY0c3JlamlpdQ%3D%3D&utm_source=qr",
  dfestival_fb: "https://www.facebook.com/share/1EZ2TaR9zf/?mibextid=wwXIfr",
  hk_fantasia_mgmt_ig:
    "https://www.instagram.com/fantasia_music_space?igsh=MXV3OGp5ZmgyNnRobA%3D%3D&utm_source=qr",
  hk_fantasia_mgmt_fb: "https://www.facebook.com/share/17shpXd199/?mibextid=wwXIfr",
  fantasia_space_ig:
    "https://www.instagram.com/fimm_hk?igsh=MXY0bXB6OXlmMXFpcg%3D%3D&utm_source=qr",
  fantasia_space_fb: "https://www.facebook.com/share/14YQ5F5VMXZ/?mibextid=wwXIfr",
};

export function getSocialFollowUrl(key: SocialFollowLinkKey): string {
  const envName = ENV_URL_KEYS[key];
  const v = process.env[envName];
  if (v && /^https?:\/\//i.test(v.trim())) return v.trim();
  return DEFAULT_SOCIAL_FOLLOW_URLS[key] ?? "";
}

export function parseClicks(raw: unknown): Record<SocialFollowLinkKey, boolean> {
  const out = {} as Record<SocialFollowLinkKey, boolean>;
  for (const k of SOCIAL_FOLLOW_LINK_KEYS) out[k] = false;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return out;
  const o = raw as Record<string, unknown>;
  for (const k of SOCIAL_FOLLOW_LINK_KEYS) {
    if (o[k] === true) out[k] = true;
  }
  return out;
}

export function allSocialFollowLinksClicked(
  clicks: Record<SocialFollowLinkKey, boolean>
): boolean {
  return SOCIAL_FOLLOW_LINK_KEYS.every((k) => clicks[k]);
}

export function socialFollowProgress(
  clicks: Record<SocialFollowLinkKey, boolean>
): number {
  return SOCIAL_FOLLOW_LINK_KEYS.filter((k) => clicks[k]).length;
}
