import { GoogleGenAI, type GenerateContentResponse } from "@google/genai";
import { jsonError, jsonOk } from "@/lib/api-response";
import { requireUserSession } from "@/lib/auth/require-session";
import {
  AVATAR_ANIMAL_LABELS,
  type AvatarAnimal,
  fallbackAvatarDataUrl,
  isAvatarAnimal,
} from "@/lib/avatar-fallback";
import { prisma } from "@/lib/prisma";
import { jsonDatabaseUnreachable } from "@/lib/prisma-unreachable-response";
import { isUnreachableDbError } from "@/lib/settings-fallback";
import { z } from "zod";

const bodySchema = z.object({
  animal: z.enum(["cat", "dog", "rabbit", "hamster"]).optional(),
});

const EN_LABEL: Record<AvatarAnimal, string> = {
  cat: "fluffy cat",
  dog: "goofy happy dog",
  rabbit: "cute bouncy rabbit",
  hamster: "round chubby hamster",
};

const MAX_STORED_CHARS = 1_200_000;

function buildPrompt(animal: AvatarAnimal): string {
  const en = EN_LABEL[animal];
  const zh = AVATAR_ANIMAL_LABELS[animal];
  return [
    `Create a single square mobile app icon (1024px concept, flat export).`,
    `Subject: a ${en} (${zh}) playing a grand piano — funny, cute, comedy kawaii style, big expressive eyes, slight absurd humor, bold clean outlines, soft pastel palette, plain white background.`,
    `No text, no watermark, no letters, no human faces. Centered mascot suitable as user avatar.`,
  ].join(" ");
}

function imageDataUrlFromResponse(response: GenerateContentResponse): string | null {
  const parts = response.candidates?.[0]?.content?.parts ?? [];
  for (const p of parts) {
    const id = p.inlineData;
    if (
      id &&
      typeof id.mimeType === "string" &&
      id.mimeType.startsWith("image/") &&
      typeof id.data === "string" &&
      id.data.length > 0
    ) {
      return `data:${id.mimeType};base64,${id.data}`;
    }
  }
  return null;
}

/** 使用 @google/genai（官方現行 SDK）；舊版 @google/generative-ai 對圖像模型請求不完整。 */
async function tryGeminiImage(
  apiKey: string,
  animal: AvatarAnimal
): Promise<string | null> {
  const ai = new GoogleGenAI({ apiKey });
  const prompt = buildPrompt(animal);
  const modelNames = [
    "gemini-2.5-flash-image",
    "gemini-3.1-flash-image-preview",
    "gemini-2.0-flash-preview-image-generation",
    "gemini-2.0-flash-exp-image-generation",
  ];
  for (const model of modelNames) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          responseModalities: ["TEXT", "IMAGE"],
          imageConfig: { aspectRatio: "1:1", imageSize: "1K" },
        },
      });
      const dataUrl = imageDataUrlFromResponse(response);
      if (dataUrl) return dataUrl;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.warn(`[avatar/generate] Gemini model ${model} failed:`, msg);
    }
  }
  return null;
}

export async function POST(req: Request) {
  const auth = await requireUserSession();
  if (!auth.ok) return auth.response;

  const key = process.env.GEMINI_API_KEY?.trim();

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    json = {};
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return jsonError("VALIDATION_ERROR", "Invalid payload", 422, parsed.error.flatten());
  }

  let profile;
  try {
    profile = await prisma.userProfile.findUnique({
      where: { userId: auth.userId },
    });
  } catch (e) {
    if (isUnreachableDbError(e)) {
      return jsonDatabaseUnreachable();
    }
    throw e;
  }
  if (!profile) {
    return jsonError("NOT_FOUND", "Profile not found", 404);
  }

  const fromBody = parsed.data.animal;
  const fromProfile = profile.favoriteAvatarAnimal;
  const animalRaw = fromBody ?? fromProfile;
  if (!isAvatarAnimal(animalRaw)) {
    return jsonError(
      "AVATAR_ANIMAL_REQUIRED",
      "請先選擇您喜歡的動物，再按生成。",
      400
    );
  }
  const animal = animalRaw;

  let dataUrl =
    key && key.length > 0 ? await tryGeminiImage(key, animal) : null;
  let source: "gemini" | "fallback" | "fallback_no_api_key" = "gemini";
  if (!key || key.length === 0) {
    dataUrl = fallbackAvatarDataUrl(animal);
    source = "fallback_no_api_key";
  } else if (!dataUrl) {
    dataUrl = fallbackAvatarDataUrl(animal);
    source = "fallback";
  }

  if (dataUrl.length > MAX_STORED_CHARS) {
    dataUrl = fallbackAvatarDataUrl(animal);
    source = "fallback";
  }

  try {
    await prisma.userProfile.update({
      where: { userId: auth.userId },
      data: {
        favoriteAvatarAnimal: animal,
        avatarImageDataUrl: dataUrl,
      },
    });
  } catch (e) {
    if (isUnreachableDbError(e)) {
      return jsonDatabaseUnreachable();
    }
    throw e;
  }

  return jsonOk({
    ok: true,
    favoriteAvatarAnimal: animal,
    avatarImageDataUrl: dataUrl,
    source,
  });
}
