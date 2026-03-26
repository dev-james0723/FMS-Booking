import { AdminNav } from "@/components/admin-nav";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "管理後台｜幻樂空間",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-full bg-slate-900 text-slate-100">
      <AdminNav />
      <div className="mx-auto max-w-6xl px-4 py-8">{children}</div>
    </div>
  );
}
