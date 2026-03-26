import Link from "next/link";
import { LogoutButton } from "@/components/logout-button";

type Props = {
  email: string;
};

/** 當 Prisma 無法連上 PostgreSQL（例如 Supabase pooler／網絡）時顯示，避免整頁 Runtime Error。 */
export function AccountDbUnavailable({ email }: Props) {
  return (
    <main className="mx-auto max-w-lg space-y-6 px-4 py-16">
      <h1 className="font-serif text-2xl text-stone-900 dark:text-stone-50">暫時無法載入帳戶資料</h1>
      <p className="text-sm text-stone-600 dark:text-stone-400">
        伺服器無法連接資料庫（常見原因：Supabase 暫停專案、網絡阻斷，或{" "}
        <code className="rounded bg-stone-100 dark:bg-stone-800 px-1 text-xs">DATABASE_URL</code> 設定不正確）。
        您已登入為 <span className="font-medium text-stone-800 dark:text-stone-200">{email}</span>
        ，但儲存頭像等同樣需要資料庫連線。
      </p>
      <ul className="list-inside list-disc space-y-2 text-sm text-stone-600 dark:text-stone-400">
        <li>
          使用 Supabase：到 Dashboard 確認專案未休眠；連線字串建議用{" "}
          <strong>Session pooler</strong>（IPv4 相容），可參考專案{" "}
          <code className="rounded bg-stone-100 dark:bg-stone-800 px-1 text-xs">.env.example</code> 說明。
        </li>
        <li>本機開發：確認 Postgres 已開、防火牆允許，或暫用 Docker 內的資料庫。</li>
      </ul>
      <div className="flex flex-wrap gap-3 pt-2">
        <a
          href="/account"
          className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-stone-900 px-6 py-2.5 text-sm text-white hover:bg-stone-800"
        >
          重新載入此頁
        </a>
        <Link
          href="/"
          className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-stone-300 dark:border-stone-600 px-6 py-2.5 text-sm text-stone-800 dark:text-stone-200 hover:bg-stone-50 dark:hover:bg-stone-800"
        >
          返回主頁
        </Link>
        <LogoutButton />
      </div>
    </main>
  );
}
