"use client";

import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { CalendarGrid } from "@/components/CalendarGrid";
import { monthLabel } from "@/lib/date";
import { useAppStore } from "@/store/useAppStore";

export default function CalendarPage() {
  const [monthDate, setMonthDate] = useState(new Date());
  const refreshMonth = useAppStore((s) => s.refreshMonth);
  const logs = useAppStore((s) => s.logs);
  const tasks = useAppStore((s) => s.tasks);

  useEffect(() => {
    refreshMonth(monthDate);
  }, [monthDate, refreshMonth]);

  const label = useMemo(() => monthLabel(monthDate), [monthDate]);

  return (
    <AppShell>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500">Calendar</p>
            <h1 className="text-2xl font-bold text-slate-900">{label}</h1>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setMonthDate(new Date(monthDate.getFullYear(), monthDate.getMonth() - 1, 1))}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700"
            >
              Prev
            </button>
            <button
              onClick={() => setMonthDate(new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 1))}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700"
            >
              Next
            </button>
          </div>
        </div>

        <CalendarGrid monthDate={monthDate} logs={logs} tasks={tasks} />
      </div>
    </AppShell>
  );
}