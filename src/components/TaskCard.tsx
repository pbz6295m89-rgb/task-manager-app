"use client";

import { Edit3 } from "lucide-react";
import { formatShortMinutes } from "@/lib/date";
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
  onEdit: () => void;
};

function statusLabel(status: Task["status"]) {
  if (status === "todo") return "未着手";
  if (status === "working") return "作業中";
  if (status === "break") return "休憩中";
  return "完了";
}

function typeLabel(type: Task["task_type"]) {
  return type === "initial" ? "Initial" : "Added";
}

export function TaskCard({
  task,
  liveElapsedSeconds,
  active,
  onStart,
  onPause,
  onDone,
  onStrategy,
  onEdit,
}: Props) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start gap-4">
        <TaskProgressRing
          estimatedMinutes={task.estimated_minutes}
          elapsedSeconds={liveElapsedSeconds}
        />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
              P{task.priority}
            </span>

            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
              {statusLabel(task.status)}
            </span>

            <span
              className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                task.task_type === "initial"
                  ? "bg-slate-900 text-white"
                  : "bg-indigo-50 text-indigo-700"
              }`}
            >
              {typeLabel(task.task_type)}
            </span>
          </div>

          <div className="mt-2 flex items-center justify-between gap-2">
            <h3 className="truncate text-base font-semibold text-slate-900">
              {task.title}
            </h3>

            <button
              onClick={onEdit}
              className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            >
              <Edit3 className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-1 text-sm text-slate-500">
            目標 {task.estimated_minutes}m / 実績{" "}
            {formatShortMinutes(liveElapsedSeconds)}
          </div>

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
        </div>
      </div>
    </div>
  );
}