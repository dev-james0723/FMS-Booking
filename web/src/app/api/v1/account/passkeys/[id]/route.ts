import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk } from "@/lib/api-response";
import { requireUserSession } from "@/lib/auth/require-session";

type Ctx = { params: Promise<{ id: string }> };

export async function DELETE(_req: Request, ctx: Ctx) {
  const auth = await requireUserSession();
  if (!auth.ok) return auth.response;

  const { id } = await ctx.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return jsonError("VALIDATION_ERROR", "Invalid id", 422);
  }

  const row = await prisma.webAuthnCredential.findFirst({
    where: { id, userId: auth.userId },
    select: { id: true },
  });
  if (!row) {
    return jsonError("NOT_FOUND", "找不到此通行密鑰", 404);
  }

  await prisma.webAuthnCredential.delete({ where: { id: row.id } });
  return jsonOk({ ok: true });
}
