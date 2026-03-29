import fs from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import sharp from "sharp";
import {
  BRANDING_RGBA_ASSETS,
  isBrandingRgbaSlug,
  type BrandingRgbaSlug,
} from "@/lib/branding/rgba-assets";

export const runtime = "nodejs";

/**
 * Email clients and some `<img>` contexts cannot load raw RGBA; this route rasterises on demand.
 * Source files remain `.rgba` only under `public/branding/`.
 */
export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  const { slug } = await context.params;
  if (!isBrandingRgbaSlug(slug)) {
    return new NextResponse("Not found", { status: 404 });
  }

  const meta = BRANDING_RGBA_ASSETS[slug as BrandingRgbaSlug];
  const filePath = path.join(process.cwd(), "public", "branding", meta.file);
  let buf: Buffer;
  try {
    buf = await fs.readFile(filePath);
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }

  const expected = meta.width * meta.height * 4;
  if (buf.length !== expected) {
    return new NextResponse("Invalid asset", { status: 500 });
  }

  const png = await sharp(buf, {
    raw: { width: meta.width, height: meta.height, channels: 4 },
  })
    .png({ effort: 6 })
    .toBuffer();

  return new NextResponse(new Uint8Array(png), {
    status: 200,
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=86400, immutable",
    },
  });
}
