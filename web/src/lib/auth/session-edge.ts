import { jwtVerify } from "jose";
import type { AccountStatus } from "@prisma/client";

export type SessionPayload = {
  sub: string;
  email: string;
  accountStatus: AccountStatus;
  mustChangePassword: boolean;
  hasCompletedRegistration: boolean;
};

export async function verifyUserSessionToken(
  token: string,
  secret: string
): Promise<SessionPayload | null> {
  try {
    const key = new TextEncoder().encode(secret);
    const { payload } = await jwtVerify(token, key);
    const sub = String(payload.sub ?? "");
    const email = String(payload.email ?? "");
    if (!sub || !email) return null;
    return {
      sub,
      email,
      accountStatus: payload.accountStatus as AccountStatus,
      mustChangePassword: Boolean(payload.mustChangePassword),
      hasCompletedRegistration: Boolean(payload.hasCompletedRegistration),
    };
  } catch {
    return null;
  }
}
