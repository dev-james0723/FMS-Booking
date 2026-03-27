/**
 * Paths to reference photos (under `public/instruments/`), seeded into `RegistrationInstrumentImage`.
 * Sources: Wikimedia Commons; see each file on commons for license / attribution.
 */
export const REGISTRATION_INSTRUMENT_IMAGE_PATHS: Record<string, string> = {
  piano: "/instruments/piano.jpg",
  violin: "/instruments/violin.jpg",
  viola: "/instruments/viola.jpg",
  cello: "/instruments/cello.jpg",
  double_bass: "/instruments/double_bass.jpg",
  harp: "/instruments/harp.jpg",
  piccolo: "/instruments/piccolo.jpg",
  flute: "/instruments/flute.jpg",
  alto_flute: "/instruments/alto_flute.jpg",
  oboe: "/instruments/oboe.jpg",
  cor_anglais: "/instruments/cor_anglais.jpg",
  clarinet: "/instruments/clarinet.jpg",
  eb_clarinet: "/instruments/eb_clarinet.jpg",
  bass_clarinet: "/instruments/bass_clarinet.jpg",
  contrabass_clarinet: "/instruments/contrabass_clarinet.jpg",
  bassoon: "/instruments/bassoon.jpg",
  contrabassoon: "/instruments/contrabassoon.jpg",
  soprano_sax: "/instruments/soprano_sax.jpg",
  alto_sax: "/instruments/alto_sax.jpg",
  tenor_sax: "/instruments/tenor_sax.jpg",
  baritone_sax: "/instruments/baritone_sax.jpg",
  horn: "/instruments/horn.jpg",
  trumpet: "/instruments/trumpet.jpg",
  cornet: "/instruments/cornet.jpg",
  flugelhorn: "/instruments/flugelhorn.jpg",
  tenor_trombone: "/instruments/tenor_trombone.jpg",
  bass_trombone: "/instruments/bass_trombone.jpg",
  tuba: "/instruments/tuba.jpg",
  euphonium: "/instruments/euphonium.jpg",
  baritone_horn: "/instruments/baritone_horn.jpg",
  wagner_tuba: "/instruments/wagner_tuba.jpg",
};

export function registrationInstrumentImageMap(): Record<string, string> {
  return { ...REGISTRATION_INSTRUMENT_IMAGE_PATHS };
}
