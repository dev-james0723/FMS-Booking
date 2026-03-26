import { Prisma } from "@prisma/client";
import { jsonError, jsonOk } from "@/lib/api-response";
import { requireAdminSession } from "@/lib/auth/require-admin";
import { prisma } from "@/lib/prisma";

type Ctx = { params: Promise<{ id: string }> };

export async function DELETE(_req: Request, ctx: Ctx) {
  const auth = await requireAdminSession();
  if (!auth.ok) return auth.response;

  const { id } = await ctx.params;
  const trimmed = id?.trim();
  if (!trimmed) {
    return jsonError("VALIDATION_ERROR", "缺少用戶 ID", 400);
  }

  try {
    await prisma.user.delete({ where: { id: trimmed } });
    return jsonOk({ ok: true });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === "P2025") {
        return jsonError("NOT_FOUND", "找不到此用戶", 404);
      }
      if (e.code === "P2003") {
        return jsonError(
          "FK_CONSTRAINT",
          "無法刪除此用戶：仍有資料與此帳戶關聯",
          409
        );
      }
    }
    console.error("[admin/users DELETE]", e);
    return jsonError(
      "DELETE_FAILED",
      e instanceof Error ? e.message : "刪除失敗",
      500
    );
  }
}
