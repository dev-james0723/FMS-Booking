import { AdminBookingsPanel } from "@/components/admin-bookings-panel";
import { Suspense } from "react";

export default function AdminBookingsPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-white">預約</h1>
      <p className="mt-1 text-sm text-slate-400">
        用戶提交預約後一般由系統自動確認（列表顯示為 booked）。你可在此更改時段或取消預約；兩者均會向用戶發送通知電郵（開發模式見終端機 /
        email_logs）。可從「登記用戶」帶入篩選，或由此連回該用戶之登記資料。
      </p>
      <div className="mt-8">
        <Suspense fallback={<p className="text-sm text-slate-500">載入中…</p>}>
          <AdminBookingsPanel />
        </Suspense>
      </div>
    </div>
  );
}
