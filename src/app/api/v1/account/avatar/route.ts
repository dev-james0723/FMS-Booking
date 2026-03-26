import { jsonError, jsonOk } from "@/lib/api-response";
import { requireUserSession } from "@/lib/auth/require-session";
import { AVATAR_ANIMALS, type AvatarAnimal, fallbackAvatarDataUrl } from "@/lib/avatar-fallback";
import { prisma } from "@/lib/prisma";
import { jsonDatabaseUnreachable } from "@/lib/prisma-unreachable-response";
import { isUnreachableDbError } from "@/lib/settings-fallback";
import { z } from "zod";

const bodySchema = z.object({
  animal: z.enum(AVATAR_ANIMALS),
  /** 若 true，將頭像固定為內建插畫並寫入資料庫。 */
  useFallbackOnly: z.boolean().optional(),
});

export async function PATCH(req: Request) {
  const auth = await requireUserSession();
  if (!auth.ok) return auth.response;

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return jsonError("INVALID_JSON", "Invalid JSON body", 400);
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return jsonError("VALIDATION_ERROR", "Invalid payload", 422, parsed.error.flatten());
  }

  const animal = parsed.data.animal as AvatarAnimal;
  const dataUrl =
    parsed.data.useFallbackOnly === true ? fallbackAvatarDataUrl(animal) : null;

  try {
    await prisma.userProfile.update({
      where: { userId: auth.userId },
      data: {
        favoriteAvatarAnimal: animal,
        avatarImageDataUrl: dataUrl ?? null,
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
  });
}
