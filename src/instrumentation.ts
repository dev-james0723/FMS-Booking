/**
 * Runs when the Next.js server/runtime initializes (not during `next build` static analysis).
 * Fails fast in production if core secrets are missing.
 */
export function register() {
  if (process.env.NEXT_PHASE === "phase-production-build") return;
  if (process.env.NODE_ENV !== "production") return;

  const problems: string[] = [];
  if (!process.env.DATABASE_URL?.trim()) {
    problems.push("DATABASE_URL must be set in production.");
  }
  const jwt = process.env.JWT_SECRET?.trim();
  if (!jwt || jwt.length < 16) {
    problems.push("JWT_SECRET must be set in production (minimum 16 characters).");
  }
  if (problems.length > 0) {
    throw new Error(`Environment validation failed:\n${problems.join("\n")}`);
  }
}
