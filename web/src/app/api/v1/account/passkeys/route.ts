import { prisma } from "@/lib/prisma";
import { jsonOk } from "@/lib/api-response";
import { requireUserSession } from "@/lib/auth/require-session";
import { formatCredentialHint } from "@/lib/webauthn/credential-hint";

export async function GET() {
  const auth = await requireUserSession();
  if (!auth.ok) return auth.response;

  const rows = await prisma.webAuthnCredential.findMany({
    where: { userId: auth.userId },
    orderBy: { createdAt: "desc" },
    select: { id: true, createdAt: true, credentialId: true },
  });

  return jsonOk({
    passkeys: rows.map((r) => ({
      id: r.id,
      createdAt: r.createdAt.toISOString(),
      hint: formatCredentialHint(r.credentialId),
    })),
  });
}
