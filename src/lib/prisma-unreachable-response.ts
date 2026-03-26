import { jsonError } from "@/lib/api-response";

export const PRISMA_UNREACHABLE_USER_MESSAGE =
  "資料庫暫時無法連線，無法儲存。請稍後再試；若用 Supabase，請確認專案未休眠，並使用 Session pooler 連線字串（見 .env.example）。";

export function jsonDatabaseUnreachable() {
  return jsonError("DATABASE_UNREACHABLE", PRISMA_UNREACHABLE_USER_MESSAGE, 503);
}
