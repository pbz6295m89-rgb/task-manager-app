"use client";

import { format, isSameMonth, isToday } from "date-fns";
import { buildMonthGrid } from "@/lib/date";
import type { CalendarEvent, DailyLog } from "@/lib/types";

type Props = {
  monthDate: Date;
  logs: DailyLog[];
  events: CalendarEvent[];
  onDayClick: (dateKey: string) => void;
};

function scoreStyle(score?: number) {
  if (score === undefined) return "bg-slate-100 text-slate-400";
  if (score >= 500) return "bg-emerald-600 text-white";
  if (score >= 100) return "bg-emerald-50 text-emerald-700";
  if (score >= 0) return "bg-amber-50 text-amber-700";
  return "bg-rose-50 text-rose-700";
}

export function CalendarGrid({
  monthDate,
  logs,
  events,
  onDayClick,
}: Props) {
  const grid = buildMonthGrid(monthDate);
  const logMap = new Map(logs.map((log) => [log.log_date, log]));

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      {/* 曜日 */}
      <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
        {["日", "月", "火", "水", "木", "金", "土"].map((day) => (
          <div
            key={day}
            className="py-2 text-center text-[10px] font-semibold text-slate-400 sm:text-xs"
          >
            {day}
          </div>
        ))}
      </div>

      {/* 日付 */}
      <div className="grid grid-cols-7 gap-0">
        {grid.map((date) => {
          const key = format(date, "yyyy-MM-dd");
          const log = logMap.get(key);
          const inMonth = isSameMonth(date, monthDate);
          const dayEvents = events.filter((event) => event.event_date === key);
          const today = isToday(date);

          return (
            <button
              key={key}
              onClick={() => onDayClick(key)}
              className={`min-h-[96px] border-r border-b border-slate-100 p-1 text-left transition active:bg-emerald-50 sm:min-h-28 sm:p-2 md:min-h-32 md:p-3 ${
                inMonth ? "bg-white" : "bg-slate-50 text-slate-300"
              } ${today ? "bg-slate-50" : ""}`}
            >
              {/* 1. 日付 */}
              <div className="flex justify-center">
                <div
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold sm:h-7 sm:w-7 sm:text-xs ${
                    today
                      ? "bg-slate-900 text-white"
                      : inMonth
                        ? "text-slate-800"
                        : "text-slate-300"
                  }`}
                >
                  {format(date, "d")}
                </div>
              </div>

              {/* 2. スコア */}
              <div className="mt-1 flex justify-center">
                {log ? (
                  <div
                    className={`max-w-full truncate rounded-full px-1.5 py-0.5 text-[9px] font-bold sm:text-[10px] ${scoreStyle(
                      log.score
                    )}`}
                    title={`${log.score} pt`}
                  >
                    {log.score}
                  </div>
                ) : (
                  <div className="h-[18px]" />
                )}
              </div>

              {/* 3. タスク・予定 */}
              <div className="mt-1 space-y-1 overflow-hidden">
                {dayEvents.slice(0, 2).map((event) => (
                  <div
                    key={event.id}
                    className="truncate rounded-md bg-indigo-50 px-1 py-0.5 text-center text-[9px] font-medium text-indigo-700 sm:px-1.5 sm:text-[10px]"
                    title={event.title}
                  >
                    {event.title}
                  </div>
                ))}

                {dayEvents.length > 2 ? (
                  <div className="truncate text-center text-[9px] font-medium text-slate-400 sm:text-[10px]">
                    他{dayEvents.length - 2}件
                  </div>
                ) : null}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}