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
  onReview: () => void;
  onDone: () => void;
  onStrategy: () => void;
  onQuestion: () => void;
  onEdit: () => void;
};

function statusLabel(status: Task["status"], actualSeconds: number) {
  if (status === "done") return "完了";
  if (status === "working") return "作業中";
  if (status === "break") return "保留中";
  if (status === "review") return "確認中";
  if (actualSeconds >= 60) return "進行中";
  return "未着手";
}

function typeLabel(type: Task["task_type"]) {
  return type === "initial" ? "初期" : "追加";
}

const buttonBase =
  "rounded-xl px-3 py-2 text-sm font-medium transition active:scale-[0.97] active:bg-emerald-600 active:text-white";

export function TaskCard({
  task,
  liveElapsedSeconds,
  active,
  onStart,
  onReview,
  onDone,
  onStrategy,
  onQuestion,
  onEdit,
}: Props) {
  const hasStrategy = task.strategy_memo.trim().length > 0;
  const hasQuestion = task.question_memo.trim().length > 0;
  const isWorking = task.status === "working";

  return (
    <div
      className={`rounded-2xl border bg-white p-4 shadow-sm transition ${
        isWorking
          ? "border-emerald-400 ring-2 ring-emerald-100"
          : "border-slate-200"
      }`}
    >
      <div className="flex items-start gap-4">
        <TaskProgressRing
          estimatedMinutes={task.estimated_minutes}
          elapsedSeconds={liveElapsedSeconds}
        />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
              優先度{task.priority}
            </span>

            <span
              className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                isWorking
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              {statusLabel(task.status, liveElapsedSeconds)}
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
              className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 active:bg-emerald-100 active:text-emerald-700"
            >
              <Edit3 className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-1 text-sm text-slate-500">
            目標 {task.estimated_minutes}分 / 実績{" "}
            {formatShortMinutes(liveElapsedSeconds)}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={onStart}
              className={`${buttonBase} bg-slate-900 text-white`}
            >
              {active ? "作業中" : "スタート"}
            </button>

            <button
              onClick={onReview}
              className={`${buttonBase} border border-amber-200 bg-amber-50 text-amber-700`}
            >
              社内確認
            </button>

            <button
              onClick={onDone}
              className={`${buttonBase} border border-emerald-200 bg-emerald-50 text-emerald-700`}
            >
              完了
            </button>

            <button
              onClick={onStrategy}
              className={`${buttonBase} border ${
                hasStrategy
                  ? "border-amber-300 bg-amber-50 text-amber-700"
                  : "border-slate-200 bg-white text-slate-700"
              }`}
            >
              戦略メモ
            </button>

            <button
              onClick={onQuestion}
              className={`${buttonBase} border ${
                hasQuestion
                  ? "border-sky-300 bg-sky-50 text-sky-700"
                  : "border-slate-200 bg-white text-slate-700"
              }`}
            >
              質問したいこと
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}