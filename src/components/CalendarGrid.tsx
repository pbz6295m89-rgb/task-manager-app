"use client";

import { format, isSameMonth } from "date-fns";
import { buildMonthGrid } from "@/lib/date";
import type { CalendarEvent, DailyLog, Task } from "@/lib/types";

type Props = {
  monthDate: Date;
  logs: DailyLog[];
  tasks: Task[];
  events: CalendarEvent[];
  onDayClick: (dateKey: string) => void;
};

export function CalendarGrid({
  monthDate,
  logs,
  tasks,
  events,
  onDayClick,
}: Props) {
  const grid = buildMonthGrid(monthDate);
  const logMap = new Map(logs.map((log) => [log.log_date, log]));

  return (
    <div className="grid grid-cols-7 gap-2">
      {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
        <div
          key={day}
          className="pb-1 text-center text-[11px] font-medium text-slate-400"
        >
          {day}
        </div>
      ))}

      {grid.map((date) => {
        const key = format(date, "yyyy-MM-dd");
        const log = logMap.get(key);
        const inMonth = isSameMonth(date, monthDate);

        const dayTasks = tasks.filter((task) => task.work_date === key);
        const dayEvents = events.filter((event) => event.event_date === key);

        return (
          <button
            key={key}
            onClick={() => onDayClick(key)}
            className={`min-h-28 rounded-2xl border p-2 text-left transition ${
              inMonth
                ? "border-slate-200 bg-white"
                : "border-slate-100 bg-slate-50 text-slate-300"
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="text-sm font-semibold">{format(date, "d")}</div>
              {log ? (
                <div className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                  {log.score}
                </div>
              ) : null}
            </div>

            <div className="mt-2 space-y-1 overflow-hidden">
              {dayEvents.slice(0, 2).map((event) => (
                <div
                  key={event.id}
                  className="truncate rounded-md bg-indigo-50 px-1.5 py-0.5 text-[10px] text-indigo-700"
                  title={event.title}
                >
                  {event.title}
                </div>
              ))}

              {dayTasks.slice(0, 2).map((task) => (
                <div
                  key={task.id}
                  className="truncate rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600"
                  title={task.title}
                >
                  {task.title} {task.estimated_minutes}m
                </div>
              ))}

              {dayEvents.length + dayTasks.length > 4 ? (
                <div className="text-[10px] text-slate-400">...</div>
              ) : null}
            </div>
          </button>
        );
      })}
    </div>
  );
}