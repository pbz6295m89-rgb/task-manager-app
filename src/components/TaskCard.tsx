"use client";

import { formatClock, formatShortMinutes } from "@/lib/date";
import type { Task } from "@/lib/types";
import { TaskProgressRing } from "./TaskProgressRing";

type Props = {
  task: Task;
  liveElapsedSeconds: number;
  active: boolean;
  onStart: () => void;
  onPause: () => void;
  onDone: () => void;
  onStrategy: () => void;
};

function statusLabel(status: Task["status"]) {
  if (status === "todo") return "未着手";
  if (status === "working") return "作業中";
  if (status === "break") return "休憩中";
  return "完了";
}

export function TaskCard({
  task,
  liveElapsedSeconds,
  active,
  onStart,
  onPause,
  onDone,
  onStrategy,
}: Props) {
  const elapsed = active ? liveElapsedSeconds : task.actual_seconds;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start gap-4">
        <TaskProgressRing
          estimatedMinutes={task.estimated_minutes}
          elapsedSeconds={elapsed}
        />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
              P{task.priority}
            </span>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
              {statusLabel(task.status)}
            </span>
          </div>

          <h3 className="mt-2 truncate text-base font-semibold text-slate-900">
            {task.title}
          </h3>

          <div className="mt-2 text-sm text-slate-500">
            予定 {task.estimated_minutes}m / 実績 {formatShortMinutes(elapsed)}
          </div>

          {task.due_date ? (
            <div className="mt-1 text-xs text-slate-400">締切 {task.due_date}</div>
          ) : null}

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={onStart}
              className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-medium text-white"
            >
              {active ? "作業中" : "Start"}
            </button>

            <button
              onClick={onPause}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700"
            >
              休憩
            </button>

            <button
              onClick={onDone}
              className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700"
            >
              完了
            </button>

            <button
              onClick={onStrategy}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700"
            >
              戦略メモ
            </button>
          </div>

          {task.strategy_memo ? (
            <div className="mt-3 rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-600">
              {task.strategy_memo}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}