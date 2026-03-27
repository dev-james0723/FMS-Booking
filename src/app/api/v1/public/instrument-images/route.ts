import { jsonOk } from "@/lib/api-response";
import { registrationInstrumentImageMap } from "@/lib/instruments/instrument-reference-images";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const rows = await prisma.registrationInstrumentImage.findMany();
  const fallback = registrationInstrumentImageMap();
  const images: Record<string, string> = { ...fallback };
  for (const row of rows) {
    images[row.instrumentKey] = row.imageUrl;
  }
  return jsonOk({ images });
}
