"use client";

import { useEffect, useState } from "react";
import { Modal } from "./Modal";
import type { Project, TaskInput } from "@/lib/types";

type Props = {
  open: boolean;
  onClose: () => void;
  onSave: (input: TaskInput) => Promise<void>;
  projects: Project[];
};

export function TaskFormModal({ open, onClose, onSave, projects }: Props) {
  const [title, setTitle] = useState("");
  const [estimatedMinutes, setEstimatedMinutes] = useState(60);
  const [priority, setPriority] = useState<1 | 2 | 3>(2);
  const [weight, setWeight] = useState(1);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [dueDate, setDueDate] = useState("");
  const [strategyMemo, setStrategyMemo] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) {
      setTitle("");
      setEstimatedMinutes(60);
      setPriority(2);
      setWeight(1);
      setProjectId(null);
      setDueDate("");
      setStrategyMemo("");
      setSaving(false);
    }
  }, [open]);

  const submit = async () => {
    if (!title.trim()) return;
    setSaving(true);
    await onSave({
      title: title.trim(),
      estimated_minutes: estimatedMinutes,
      priority,
      weight,
      project_id: projectId,
      due_date: dueDate || null,
      strategy_memo: strategyMemo.trim(),
    });
    setSaving(false);
    onClose();
  };

  return (
    <Modal
      open={open}
      title="New Task"
      onClose={onClose}
      footer={
        <button
          onClick={submit}
          disabled={saving}
          className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-medium text-white disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save"}
        </button>
      }
    >
      <div className="space-y-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Task name</label>
          <input
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-900"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="例: 対面商談"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Target time (min)</label>
            <input
              type="number"
              min={1}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-900"
              value={estimatedMinutes}
              onChange={(e) => setEstimatedMinutes(Number(e.target.value))}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Priority</label>
            <select
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-900"
              value={priority}
              onChange={(e) => setPriority(Number(e.target.value) as 1 | 2 | 3)}
            >
              <option value={1}>1 (High)</option>
              <option value={2}>2 (Mid)</option>
              <option value={3}>3 (Low)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Weight</label>
            <input
              type="number"
              min={1}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-900"
              value={weight}
              onChange={(e) => setWeight(Number(e.target.value))}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Project</label>
            <select
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-900"
              value={projectId ?? ""}
              onChange={(e) => setProjectId(e.target.value || null)}
            >
              <option value="">No project</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Deadline</label>
          <input
            type="date"
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-900"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Strategy memo</label>
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