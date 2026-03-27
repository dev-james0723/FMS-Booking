import type { Locale } from "@/lib/i18n/types";

export type OrchestraInstrumentEntry = {
  id: string;
  zh: string;
  en: string;
  /** Footprint larger than a cello — must use the separate large-instrument booking page. */
  largerThanCello: boolean;
};

export type OrchestraCategoryId = "strings" | "woodwind" | "brass";

export type OrchestraCategory = {
  id: OrchestraCategoryId;
  instruments: OrchestraInstrumentEntry[];
};

/** Standard symphony orchestra instruments (no percussion — not accepted for this programme). */
export const ORCHESTRA_CATEGORIES: OrchestraCategory[] = [
  {
    id: "strings",
    instruments: [
      { id: "violin", zh: "小提琴", en: "Violin", largerThanCello: false },
      { id: "viola", zh: "中提琴", en: "Viola", largerThanCello: false },
      { id: "cello", zh: "大提琴", en: "Cello", largerThanCello: false },
      { id: "double_bass", zh: "低音大提琴", en: "Double bass", largerThanCello: true },
      { id: "harp", zh: "豎琴", en: "Harp", largerThanCello: true },
    ],
  },
  {
    id: "woodwind",
    instruments: [
      { id: "piccolo", zh: "短笛", en: "Piccolo", largerThanCello: false },
      { id: "flute", zh: "長笛", en: "Flute", largerThanCello: false },
      { id: "alto_flute", zh: "中音長笛", en: "Alto flute", largerThanCello: false },
      { id: "oboe", zh: "雙簧管", en: "Oboe", largerThanCello: false },
      { id: "cor_anglais", zh: "英國管", en: "Cor anglais", largerThanCello: false },
      {
        id: "clarinet",
        zh: "單簧管（B♭／A）",
        en: "Clarinet (B♭ / A)",
        largerThanCello: false,
      },
      { id: "eb_clarinet", zh: "單簧管（E♭）", en: "Clarinet (E♭)", largerThanCello: false },
      {
        id: "bass_clarinet",
        zh: "低音單簧管",
        en: "Bass clarinet",
        largerThanCello: true,
      },
      {
        id: "contrabass_clarinet",
        zh: "倍低音單簧管",
        en: "Contrabass clarinet",
        largerThanCello: true,
      },
      { id: "bassoon", zh: "巴松管", en: "Bassoon", largerThanCello: false },
      {
        id: "contrabassoon",
        zh: "低音巴松管",
        en: "Contrabassoon",
        largerThanCello: true,
      },
      {
        id: "soprano_sax",
        zh: "薩氏管（高音）",
        en: "Soprano saxophone",
        largerThanCello: false,
      },
      {
        id: "alto_sax",
        zh: "薩氏管（中音）",
        en: "Alto saxophone",
        largerThanCello: false,
      },
      {
        id: "tenor_sax",
        zh: "薩氏管（次中音）",
        en: "Tenor saxophone",
        largerThanCello: false,
      },
      {
        id: "baritone_sax",
        zh: "薩氏管（上低音）",
        en: "Baritone saxophone",
        largerThanCello: true,
      },
    ],
  },
  {
    id: "brass",
    instruments: [
      { id: "horn", zh: "圓號", en: "Horn (French horn)", largerThanCello: false },
      { id: "trumpet", zh: "小號", en: "Trumpet", largerThanCello: false },
      { id: "cornet", zh: "短號", en: "Cornet", largerThanCello: false },
      { id: "flugelhorn", zh: "柔音號", en: "Flugelhorn", largerThanCello: false },
      {
        id: "tenor_trombone",
        zh: "長號",
        en: "Trombone (tenor)",
        largerThanCello: true,
      },
      {
        id: "bass_trombone",
        zh: "低音長號",
        en: "Bass trombone",
        largerThanCello: true,
      },
      { id: "tuba", zh: "大號", en: "Tuba", largerThanCello: true },
      {
        id: "euphonium",
        zh: "粗管上低音號（尤風寧）",
        en: "Euphonium",
        largerThanCello: true,
      },
      {
        id: "baritone_horn",
        zh: "細管上低音號",
        en: "Baritone horn",
        largerThanCello: false,
      },
      {
        id: "wagner_tuba",
        zh: "華格納號",
        en: "Wagner tuba",
        largerThanCello: true,
      },
    ],
  },
];

const byId = new Map<string, OrchestraInstrumentEntry>();
for (const cat of ORCHESTRA_CATEGORIES) {
  for (const inst of cat.instruments) {
    byId.set(inst.id, inst);
  }
}

export function getOrchestraInstrument(id: string): OrchestraInstrumentEntry | undefined {
  return byId.get(id);
}

export function instrumentLabel(inst: OrchestraInstrumentEntry, locale: Locale): string {
  return locale === "en" ? inst.en : inst.zh;
}

export function isLargerThanCello(id: string): boolean {
  return byId.get(id)?.largerThanCello ?? false;
}

/** Best-match emoji per instrument (Unicode has no glyph for many orchestral instruments). */
const ORCHESTRA_INSTRUMENT_EMOJI: Record<string, string> = {
  violin: "🎻",
  viola: "🎻",
  cello: "🎻",
  double_bass: "🎻",
  harp: "🎵",
  piccolo: "🪈",
  flute: "🪈",
  alto_flute: "🪈",
  oboe: "🎵",
  cor_anglais: "🎵",
  clarinet: "🎷",
  eb_clarinet: "🎷",
  bass_clarinet: "🎷",
  contrabass_clarinet: "🎷",
  bassoon: "🎵",
  contrabassoon: "🎵",
  soprano_sax: "🎷",
  alto_sax: "🎷",
  tenor_sax: "🎷",
  baritone_sax: "🎷",
  horn: "🎺",
  trumpet: "🎺",
  cornet: "🎺",
  flugelhorn: "🎺",
  tenor_trombone: "🎺",
  bass_trombone: "🎺",
  tuba: "🎺",
  euphonium: "🎺",
  baritone_horn: "🎺",
  wagner_tuba: "🎺",
};

export function emojiForOrchestraInstrument(id: string): string {
  return ORCHESTRA_INSTRUMENT_EMOJI[id] ?? "🎵";
}
