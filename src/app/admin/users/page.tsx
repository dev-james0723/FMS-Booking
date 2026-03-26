import { AdminUsersPanel } from "@/components/admin-users-panel";
import { Suspense } from "react";

export default function AdminUsersPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-white">登記用戶</h1>
      <p className="mt-1 text-sm text-slate-400">
        顯示「登記資料及建立帳戶」所提交嘅資料；可展開查看每位用戶嘅預約申請、日期與節數，並連結到「預約申請」同「日曆／時段」。
      </p>
      <div className="mt-8">
        <Suspense fallback={<p className="text-sm text-slate-500">載入中…</p>}>
          <AdminUsersPanel />
        </Suspense>
      </div>
    </div>
  );
}
