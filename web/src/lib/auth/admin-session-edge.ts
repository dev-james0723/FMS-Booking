import { jwtVerify } from "jose";
import type { AdminRole } from "@prisma/client";

export type AdminSessionPayload = {
  sub: string;
  email: string;
  role: AdminRole;
};

export async function verifyAdminSessionToken(
  token: string,
  secret: string
): Promise<AdminSessionPayload | null> {
  try {
    const key = new TextEncoder().encode(secret);
    const { payload } = await jwtVerify(token, key);
    const sub = String(payload.sub ?? "");
    const email = String(payload.email ?? "");
    if (!sub || !email) return null;
    return {
      sub,
      email,
      role: payload.role as AdminRole,
    };
  } catch {
    return null;
  }
}
