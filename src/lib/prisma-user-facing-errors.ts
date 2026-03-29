import { Prisma } from "@prisma/client";
import { isUnreachableDbError } from "@/lib/settings-fallback";

/**
 * DB unreachable, or schema out of sync (migrations not applied on the deployment DB).
 * Used to avoid a generic Vercel 500 when the user is otherwise authenticated.
 */
export function isUserFacingDbLoadFailure(e: unknown): boolean {
  if (isUnreachableDbError(e)) return true;
  if (e instanceof Prisma.PrismaClientKnownRequestError) {
    return e.code === "P2021" || e.code === "P2022" || e.code === "P2010";
  }
  return false;
}
