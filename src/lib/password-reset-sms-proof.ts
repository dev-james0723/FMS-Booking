import { SignJWT, jwtVerify } from "jose";
import { jwtSecretKeyBytes } from "@/lib/jwt-secret";

const TYP = "pwd_reset_sms";

export async function signPasswordResetSmsProof(params: {
  challengeId: string;
  userId: string;
}): Promise<string> {
  return new SignJWT({
    typ: TYP,
    chal: params.challengeId,
    sub: params.userId,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30m")
    .sign(jwtSecretKeyBytes());
}

export type PasswordResetSmsProof = {
  challengeId: string;
  userId: string;
};

export async function verifyPasswordResetSmsProof(
  token: string
): Promise<PasswordResetSmsProof | null> {
  try {
    const { payload } = await jwtVerify(token, jwtSecretKeyBytes());
    if (payload.typ !== TYP) return null;
    const chal = String(payload.chal ?? "");
    const sub = String(payload.sub ?? "");
    if (!chal || !sub) return null;
    return { challengeId: chal, userId: sub };
  } catch {
    return null;
  }
}
