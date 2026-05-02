"use client";

import Link from "next/link";
import { buildMonthGrid } from "@/lib/date";
import type { DailyLog, Task } from "@/lib/types";
import { format, isSameMonth } from "date-fns";

type Props = {
  monthDate: Date;
  logs: DailyLog[];
  tasks: Task[];
};

export function CalendarGrid({ monthDate, logs, tasks }: Props) {
  const grid = buildMonthGrid(monthDate);
  const logMap = new Map(logs.map((log) => [log.log_date, log]));
  const deadlineMap = new Map<string, number>();

  for (const task of tasks) {
    if (!task.due_date) continue;
    deadlineMap.set(task.due_date, (deadlineMap.get(task.due_date) ?? 0) + 1);
  }

  return (
    <div className="grid grid-cols-7 gap-2">
      {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
        <div key={day} className="pb-1 text-center text-[11px] font-medium text-slate-400">
          {day}
        </div>
      ))}

      {grid.map((date) => {
        const key = format(date, "yyyy-MM-dd");
        const log = logMap.get(key);
        const deadlineCount = deadlineMap.get(key) ?? 0;
        const inMonth = isSameMonth(date, monthDate);

        return (
          <Link
            key={key}
            href={`/report/${key}`}
            className={`min-h-24 rounded-2xl border p-2 text-left transition ${
              inMonth ? "border-slate-200 bg-white" : "border-slate-100 bg-slate-50 text-slate-300"
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="text-sm font-semibold">{format(date, "d")}</div>
              {deadlineCount > 0 ? (
                <div className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-medium text-rose-700">
                  DL {deadlineCount}
                </div>
              ) : null}
            </div>

            <div className="mt-3">
              {log ? (
                <div className="text-lg font-semibold text-emerald-600">{log.score}</div>
              ) : (
                <div className="text-xs text-slate-300">—</div>
              )}
            </div>
          </Link>
        );
      })}
    </div>
  );
}