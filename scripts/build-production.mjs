#!/usr/bin/env node
/**
 * Vercel / CI: Prisma requires DIRECT_URL in schema.prisma. If only DATABASE_URL
 * is configured, default DIRECT_URL so migrate deploy + generate can run.
 * For Supabase pooled DATABASE_URL, still set DIRECT_URL to the direct :5432 URI in env.
 */
import { spawnSync } from "node:child_process";

const env = { ...process.env };
if (!String(env.DIRECT_URL ?? "").trim() && env.DATABASE_URL) {
  env.DIRECT_URL = env.DATABASE_URL;
}

function run(cmd) {
  const r = spawnSync(cmd, { stdio: "inherit", env, shell: true });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

run("npx prisma migrate deploy");
run("npx tsx scripts/backfill-booking-slots-6-20-hkt.ts");
run("npx prisma generate");
run("npx next build");
