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
  onClose,
  onCreate,
  onUpdate,
}: Props) {
  const [taskTitle, setTaskTitle] = useState("");
  const [estimatedMinutes, setEstimatedMinutes] = useState(30);
  const [priority, setPriority] = useState<1 | 2 | 3>(2);
  const [strategyMemo, setStrategyMemo] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editingTask) {
      setTaskTitle(editingTask.title);
      setEstimatedMinutes(editingTask.estimated_minutes);
      setPriority(editingTask.priority);
      setStrategyMemo(editingTask.strategy_memo);
      return;
    }

    if (open) {
      setTaskTitle("");
      setEstimatedMinutes(30);
      setPriority(2);
      setStrategyMemo("");
    }
  }, [open, editingTask]);

  const submit = async () => {
    if (!taskTitle.trim()) return;

    setSaving(true);

    if (editingTask) {
      await onUpdate(editingTask.id, {
        title: taskTitle.trim(),
        estimated_minutes: estimatedMinutes,
        priority,
        strategy_memo: strategyMemo.trim(),
      });
    } else {
      await onCreate({
        title: taskTitle.trim(),
        estimated_minutes: estimatedMinutes,
        priority,
        strategy_memo: strategyMemo.trim(),
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
      title={editingTask ? "Edit Task" : title}
      onClose={onClose}
      footer={
        <button
          onClick={submit}
          disabled={saving}
          className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-medium text-white disabled:opacity-50"
        >
          {saving ? "Saving..." : editingTask ? "Update" : "Create"}
        </button>
      }
    >
      <div className="space-y-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Task name
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
            Target time
          </label>
          <select
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-900"
            value={estimatedMinutes}
            onChange={(e) => setEstimatedMinutes(Number(e.target.value))}
          >
            {TIME_OPTIONS.map((minutes) => (
              <option key={minutes} value={minutes}>
                {minutes}m
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Priority
          </label>
          <select
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-900"
            value={priority}
            onChange={(e) => setPriority(Number(e.target.value) as 1 | 2 | 3)}
          >
            <option value={1}>1 High</option>
            <option value={2}>2 Medium</option>
            <option value={3}>3 Low</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Strategy memo
          </label>
          <textarea
            className="min-h-28 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-900"
            value={strategyMemo}
            onChange={(e) => setStrategyMemo(e.target.value)}
            placeholder="使う資料、進め方、注意点など"
          />
        </div>
      </div>
    </Modal>
  );
}