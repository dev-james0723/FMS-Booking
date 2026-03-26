import { AdminCalendarTabs } from "@/components/admin-calendar-tabs";

export default function AdminCalendarPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-white">日曆／時段預覽</h1>
      <p className="mt-1 text-sm text-slate-400">
        列表檢視原有範圍載入；「Calendar 時間軸」可選單日 6:00–20:00 宏觀檢視，並顯示預約者聯絡資料（點電話開 WhatsApp）。
      </p>
      <div className="mt-8">
        <AdminCalendarTabs />
      </div>
    </div>
  );
}
