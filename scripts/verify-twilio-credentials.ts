/**
 * Verifies Twilio Account SID + Auth Token against Twilio’s REST API (no SMS sent).
 * Optionally checks that TWILIO_FROM_NUMBER exists on the account.
 *
 * Loads `.env.local` then `.env` from the repo root if present (does not override
 * variables already set in the shell).
 *
 * Usage (repo root):
 *   npx tsx scripts/verify-twilio-credentials.ts
 *
 * After `vercel env pull .env.local`, the same command uses your Vercel secrets locally.
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { sanitizeTwilioSecretValue } from "../src/lib/sms/twilio-env";

function mergeEnvFile(name: string) {
  const p = resolve(process.cwd(), name);
  if (!existsSync(p)) return;
  const text = readFileSync(p, "utf8");
  for (const rawLine of text.split("\n")) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq <= 0) continue;
    const key = line.slice(0, eq).trim();
    let val = line.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = val;
  }
}

function maskSid(sid: string): string {
  if (sid.length <= 8) return "****";
  return `${sid.slice(0, 6)}…${sid.slice(-4)}`;
}

async function main() {
  mergeEnvFile(".env.local");
  mergeEnvFile(".env");

  const sid = sanitizeTwilioSecretValue(process.env.TWILIO_ACCOUNT_SID);
  const token = sanitizeTwilioSecretValue(process.env.TWILIO_AUTH_TOKEN);
  const from = sanitizeTwilioSecretValue(process.env.TWILIO_FROM_NUMBER);

  if (!sid || !token) {
    console.error(
      "Missing TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN (after sanitizing whitespace / invisible chars)."
    );
    console.error("Tip: run from repo root with .env.local, or export vars in your shell.");
    process.exit(1);
  }

  if (!sid.startsWith("AC") || sid.length < 32) {
    console.warn("Warning: Account SID usually starts with AC and is 34 characters.");
  }

  const auth = Buffer.from(`${sid}:${token}`).toString("base64");
  const base = `https://api.twilio.com/2010-04-01/Accounts/${sid}`;

  const accRes = await fetch(`${base}.json`, {
    headers: { Authorization: `Basic ${auth}` },
  });
  const accText = await accRes.text();

  if (!accRes.ok) {
    console.error(`Twilio account lookup failed: HTTP ${accRes.status}`);
    console.error(accText.slice(0, 500));
    process.exit(1);
  }

  let acc: { friendly_name?: string; status?: string };
  try {
    acc = JSON.parse(accText) as { friendly_name?: string; status?: string };
  } catch {
    console.error("Twilio returned non-JSON for account resource.");
    process.exit(1);
  }

  console.log("Twilio credentials: OK (authenticated successfully).");
  console.log(`  Account: ${maskSid(sid)}  status=${acc.status ?? "?"}  name=${acc.friendly_name ?? "?"}`);

  if (acc.status && acc.status !== "active") {
    console.warn(
      "  Account status is not “active”. SMS may fail until Twilio resolves billing / suspension."
    );
  }

  if (from) {
    const q = new URLSearchParams({ PhoneNumber: from });
    const numRes = await fetch(`${base}/IncomingPhoneNumbers.json?${q}`, {
      headers: { Authorization: `Basic ${auth}` },
    });
    const numText = await numRes.text();
    if (!numRes.ok) {
      console.warn(`Could not list incoming numbers (HTTP ${numRes.status}).`);
    } else {
      try {
        const j = JSON.parse(numText) as { incoming_phone_numbers?: unknown[] };
        const n = j.incoming_phone_numbers?.length ?? 0;
        if (n === 0) {
          console.warn(
            `  TWILIO_FROM_NUMBER ${from} was not found on this account’s Incoming Phone Numbers.`
          );
          console.warn(
            "  Fix: use a number purchased on this Twilio account, or switch to TWILIO_MESSAGING_SERVICE_SID."
          );
        } else {
          console.log(`  From number ${from} is on this account.`);
        }
      } catch {
        console.warn("Could not parse IncomingPhoneNumbers response.");
      }
    }
  } else {
    console.log("  TWILIO_FROM_NUMBER not set (OK if you use TWILIO_MESSAGING_SERVICE_SID).");
  }

  console.log("\nNext steps for real SMS:");
  console.log("  • Trial: add recipient numbers under Twilio → Phone Numbers → Verified Caller IDs.");
  console.log("  • HK / international “To”: enable geographic permissions in Twilio Console (Messaging).");
  console.log("  • Redeploy Vercel after changing env vars.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
