import { SignJWT, jwtVerify } from "jose";

const TYP = "passkey_pre";

function secret(): Uint8Array {
  const s = process.env.JWT_SECRET;
  if (!s || s.length < 16) {
    throw new Error("JWT_SECRET must be set (min 16 chars)");
  }
  return new TextEncoder().encode(s);
}

export async function signPasskeyPreregToken(preregChallengeId: string): Promise<string> {
  return new SignJWT({ typ: TYP, cid: preregChallengeId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("20m")
    .sign(secret());
}

export async function verifyPasskeyPreregToken(
  token: string
): Promise<{ preregChallengeId: string } | null> {
  try {
    const { payload } = await jwtVerify(token, secret());
    if (payload.typ !== TYP) return null;
    const cid = String(payload.cid ?? "");
    if (!cid) return null;
    return { preregChallengeId: cid };
  } catch {
    return null;
  }
}
