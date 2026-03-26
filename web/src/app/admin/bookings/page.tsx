import { AdminBookingsPanel } from "@/components/admin-bookings-panel";
import { Suspense } from "react";

export default function AdminBookingsPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-white">預約申請</h1>
      <p className="mt-1 text-sm text-slate-400">
        批核、後補或拒絕；用戶將收到電郵（開發模式見終端機 / email_logs）。可從「登記用戶」帶入篩選，或由此連回該用戶之登記資料。
      </p>
      <div className="mt-8">
        <Suspense fallback={<p className="text-sm text-slate-500">載入中…</p>}>
          <AdminBookingsPanel />
        </Suspense>
      </div>
    </div>
  );
}
