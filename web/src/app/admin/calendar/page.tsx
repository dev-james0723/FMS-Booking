import { AdminCalendarPanel } from "@/components/admin-calendar-panel";

export default function AdminCalendarPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-white">日曆／時段預覽</h1>
      <p className="mt-1 text-sm text-slate-400">查看每格時段佔用與申請者 Email。</p>
      <div className="mt-8">
        <AdminCalendarPanel />
      </div>
    </div>
  );
}
