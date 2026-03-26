"use client";

import { useState } from "react";
import { AdminCalendarPanel } from "@/components/admin-calendar-panel";
import { AdminCalendarTimelinePanel } from "@/components/admin-calendar-timeline-panel";

type TabId = "list" | "timeline";

export function AdminCalendarTabs() {
  const [tab, setTab] = useState<TabId>("list");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-3">
        <button
          type="button"
          onClick={() => setTab("list")}
          className={`rounded-full px-4 py-2 text-sm font-medium transition ${
            tab === "list"
              ? "bg-slate-100 text-slate-900"
              : "text-slate-400 hover:bg-slate-800 hover:text-white"
          }`}
        >
          列表／範圍
        </button>
        <button
          type="button"
          onClick={() => setTab("timeline")}
          className={`rounded-full px-4 py-2 text-sm font-medium transition ${
            tab === "timeline"
              ? "bg-slate-100 text-slate-900"
              : "text-slate-400 hover:bg-slate-800 hover:text-white"
          }`}
        >
          Calendar 時間軸
        </button>
      </div>
      {tab === "list" ? <AdminCalendarPanel /> : <AdminCalendarTimelinePanel />}
    </div>
  );
}
