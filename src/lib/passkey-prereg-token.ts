import { SignJWT, jwtVerify } from "jose";
import { jwtSecretKeyBytes } from "@/lib/jwt-secret";

const TYP = "passkey_pre";

export async function signPasskeyPreregToken(preregChallengeId: string): Promise<string> {
  return new SignJWT({ typ: TYP, cid: preregChallengeId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("20m")
    .sign(jwtSecretKeyBytes());
}

export async function verifyPasskeyPreregToken(
  token: string
): Promise<{ preregChallengeId: string } | null> {
  try {
    const { payload } = await jwtVerify(token, jwtSecretKeyBytes());
    if (payload.typ !== TYP) return null;
    const cid = String(payload.cid ?? "");
    if (!cid) return null;
    return { preregChallengeId: cid };
  } catch {
    return null;
  }
}
