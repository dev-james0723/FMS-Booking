export const AVATAR_ANIMALS = ["cat", "dog", "rabbit", "hamster"] as const;
export type AvatarAnimal = (typeof AVATAR_ANIMALS)[number];

export const AVATAR_ANIMAL_LABELS: Record<AvatarAnimal, string> = {
  cat: "貓",
  dog: "狗",
  rabbit: "兔子",
  hamster: "倉鼠",
};

/** 內建插畫風格 SVG（無 API 金鑰時使用）。 */
export function fallbackAvatarDataUrl(animal: AvatarAnimal): string {
  const svg = AVATAR_SVGS[animal];
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

const AVATAR_SVGS: Record<AvatarAnimal, string> = {
  cat: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
  <rect width="120" height="120" rx="24" fill="#fff7ed"/>
  <ellipse cx="60" cy="88" rx="44" ry="14" fill="#fed7aa" opacity=".5"/>
  <rect x="22" y="62" width="76" height="28" rx="4" fill="#44403c"/>
  <rect x="18" y="58" width="84" height="10" rx="2" fill="#57534e"/>
  <rect x="26" y="52" width="12" height="38" fill="#292524"/>
  <circle cx="60" cy="38" r="22" fill="#fdba74" stroke="#9a3412" stroke-width="2"/>
  <path d="M48 30 L44 18 L50 22 Z M72 30 L76 18 L70 22 Z" fill="#9a3412"/>
  <ellipse cx="52" cy="36" rx="4" ry="6" fill="#1c1917"/>
  <ellipse cx="68" cy="36" rx="4" ry="6" fill="#1c1917"/>
  <path d="M54 46 Q60 52 66 46" fill="none" stroke="#9a3412" stroke-width="2" stroke-linecap="round"/>
  <text x="60" y="108" text-anchor="middle" font-size="9" fill="#78716c" font-family="system-ui,sans-serif">Meow-piano!</text>
</svg>`,
  dog: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
  <rect width="120" height="120" rx="24" fill="#eff6ff"/>
  <ellipse cx="60" cy="88" rx="44" ry="14" fill="#bfdbfe" opacity=".5"/>
  <rect x="22" y="62" width="76" height="28" rx="4" fill="#1e3a8a"/>
  <rect x="18" y="58" width="84" height="10" rx="2" fill="#2563eb"/>
  <rect x="26" y="52" width="12" height="38" fill="#172554"/>
  <ellipse cx="60" cy="40" rx="24" ry="22" fill="#fcd34d" stroke="#b45309" stroke-width="2"/>
  <ellipse cx="42" cy="34" rx="8" ry="14" fill="#fcd34d" stroke="#b45309" stroke-width="2"/>
  <ellipse cx="78" cy="34" rx="8" ry="14" fill="#fcd34d" stroke="#b45309" stroke-width="2"/>
  <circle cx="52" cy="40" r="4" fill="#1e293b"/>
  <circle cx="68" cy="40" r="4" fill="#1e293b"/>
  <path d="M52 50 Q60 58 68 50" fill="none" stroke="#b45309" stroke-width="2" stroke-linecap="round"/>
  <text x="60" y="108" text-anchor="middle" font-size="9" fill="#64748b" font-family="system-ui,sans-serif">Woof-sonata!</text>
</svg>`,
  rabbit: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
  <rect width="120" height="120" rx="24" fill="#fdf2f8"/>
  <ellipse cx="60" cy="88" rx="44" ry="14" fill="#fbcfe8" opacity=".5"/>
  <rect x="22" y="62" width="76" height="28" rx="4" fill="#831843"/>
  <rect x="18" y="58" width="84" height="10" rx="2" fill="#be185d"/>
  <rect x="26" y="52" width="12" height="38" fill="#500724"/>
  <ellipse cx="48" cy="28" rx="6" ry="22" fill="#fce7f3" stroke="#9d174d" stroke-width="2"/>
  <ellipse cx="72" cy="28" rx="6" ry="22" fill="#fce7f3" stroke="#9d174d" stroke-width="2"/>
  <circle cx="60" cy="48" r="20" fill="#fff" stroke="#9d174d" stroke-width="2"/>
  <circle cx="54" cy="46" r="3" fill="#1e293b"/>
  <circle cx="66" cy="46" r="3" fill="#1e293b"/>
  <path d="M56 54 Q60 58 64 54" fill="none" stroke="#9d174d" stroke-width="1.5"/>
  <text x="60" y="108" text-anchor="middle" font-size="9" fill="#9d174d" font-family="system-ui,sans-serif">Hop étude!</text>
</svg>`,
  hamster: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
  <rect width="120" height="120" rx="24" fill="#fefce8"/>
  <ellipse cx="60" cy="88" rx="44" ry="14" fill="#fde68a" opacity=".5"/>
  <rect x="22" y="62" width="76" height="28" rx="4" fill="#713f12"/>
  <rect x="18" y="58" width="84" height="10" rx="2" fill="#a16207"/>
  <rect x="26" y="52" width="12" height="38" fill="#422006"/>
  <ellipse cx="60" cy="44" rx="26" ry="20" fill="#fde047" stroke="#854d0e" stroke-width="2"/>
  <circle cx="48" cy="42" r="5" fill="#1c1917"/>
  <circle cx="72" cy="42" r="5" fill="#1c1917"/>
  <ellipse cx="60" cy="52" rx="8" ry="5" fill="#fbbf24"/>
  <circle cx="38" cy="48" r="6" fill="#fde047" stroke="#854d0e" stroke-width="1"/>
  <circle cx="82" cy="48" r="6" fill="#fde047" stroke="#854d0e" stroke-width="1"/>
  <text x="60" y="108" text-anchor="middle" font-size="8" fill="#a16207" font-family="system-ui,sans-serif">Tiny paws, big chords!</text>
</svg>`,
};

export function isAvatarAnimal(s: string | null | undefined): s is AvatarAnimal {
  return !!s && (AVATAR_ANIMALS as readonly string[]).includes(s);
}
