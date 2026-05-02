"use client";

import { useEffect, useState } from "react";
import { Modal } from "./Modal";
import type { Task, TaskInput, TaskType } from "@/lib/types";
import { todayKey } from "@/lib/date";

type Props = {
  open: boolean;
  title: string;
  taskType: TaskType;
  editingTask?: Task | null;
  defaultTitle?: string;
  onClose: () => void;
  onCreate: (input: TaskInput) => Promise<void>;
  onUpdate: (id: string, patch: Partial<Task>) => Promise<void>;
};

const TIME_OPTIONS = [15, 30, 60, 90, 120];

export function TaskFormModal({
  open,
  title,
  taskType,
  editingTask,
  defaultTitle,
  onClose,
  onCreate,
  onUpdate,
}: Props) {
  const [taskTitle, setTaskTitle] = useState("");
  const [estimatedMinutes, setEstimatedMinutes] = useState(30);
  const [priority, setPriority] = useState<1 | 2 | 3>(2);
  const [strategyMemo, setStrategyMemo] = useState("");
  const [questionMemo, setQuestionMemo] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editingTask) {
      setTaskTitle(editingTask.title);
      setEstimatedMinutes(editingTask.estimated_minutes);
      setPriority(editingTask.priority);
      setStrategyMemo(editingTask.strategy_memo ?? "");
      setQuestionMemo(editingTask.question_memo ?? "");
      return;
    }

    if (open) {
      setTaskTitle(defaultTitle ?? "");
      setEstimatedMinutes(30);
      setPriority(2);
      setStrategyMemo("");
      setQuestionMemo("");
    }
  }, [open, editingTask, defaultTitle]);

  const submit = async () => {
    if (!taskTitle.trim()) return;

    setSaving(true);

    if (editingTask) {
      await onUpdate(editingTask.id, {
        title: taskTitle.trim(),
        estimated_minutes: estimatedMinutes,
        priority,
        strategy_memo: strategyMemo.trim(),
        question_memo: questionMemo.trim(),
      });
    } else {
      await onCreate({
        title: taskTitle.trim(),
        estimated_minutes: estimatedMinutes,
        priority,
        strategy_memo: strategyMemo.trim(),
        question_memo: questionMemo.trim(),
        task_type: taskType,
        work_date: todayKey(),
      });
    }

    setSaving(false);
    onClose();
  };

  return (
    <Modal
      open={open}
      title={editingTask ? "タスクを編集" : title}
      onClose={onClose}
      footer={
        <button
          onClick={submit}
          disabled={saving}
          className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition active:bg-emerald-600 active:scale-[0.98] disabled:opacity-50"
        >
          {saving ? "保存中..." : editingTask ? "更新" : "作成"}
        </button>
      }
    >
      <div className="space-y-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            タスク名
          </label>
          <input
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-900"
            value={taskTitle}
            onChange={(e) => setTaskTitle(e.target.value)}
            placeholder="例: 資料作成"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            目標時間
          </label>
          <select
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-900"
            value={estimatedMinutes}
            onChange={(e) => setEstimatedMinutes(Number(e.target.value))}
          >
            {TIME_OPTIONS.map((minutes) => (
              <option key={minutes} value={minutes}>
                {minutes}分
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            優先度
          </label>
          <select
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-900"
            value={priority}
            onChange={(e) => setPriority(Number(e.target.value) as 1 | 2 | 3)}
          >
            <option value={1}>1 高</option>
            <option value={2}>2 中</option>
            <option value={3}>3 低</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            戦略メモ
          </label>
          <textarea
            className="min-h-24 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-900"
            value={strategyMemo}
            onChange={(e) => setStrategyMemo(e.target.value)}
            placeholder="使う資料、進め方、注意点など"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            質問したいこと
          </label>
          <textarea
            className="min-h-24 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-900"
            value={questionMemo}
            onChange={(e) => setQuestionMemo(e.target.value)}
            placeholder="質問したいこと、確認したいこと"
          />
        </div>
      </div>
    </Modal>
  );
}