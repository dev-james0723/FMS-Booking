import { jsonError, jsonOk } from "@/lib/api-response";
import { requireAdminSession } from "@/lib/auth/require-admin";
import { parseBookingTestMode } from "@/lib/booking/booking-portal-live";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const KEY = "booking_test_mode";

export async function GET() {
  const auth = await requireAdminSession();
  if (!auth.ok) return auth.response;

  const row = await prisma.systemSetting.findUnique({ where: { key: KEY } });
  const enabled = parseBookingTestMode(row?.valueJson);

  return jsonOk({ enabled });
}

const bodySchema = z.object({
  enabled: z.boolean(),
});

export async function PATCH(req: Request) {
  const auth = await requireAdminSession();
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

  await prisma.systemSetting.upsert({
    where: { key: KEY },
    create: { key: KEY, valueJson: parsed.data.enabled },
    update: { valueJson: parsed.data.enabled },
  });

  return jsonOk({ ok: true, enabled: parsed.data.enabled });
}
