"use client";

import { useEffect, useState } from "react";
import { Modal } from "./Modal";
import type { ProjectInput } from "@/lib/types";

type Props = {
  open: boolean;
  onClose: () => void;
  onSave: (input: ProjectInput) => Promise<void>;
};

export function ProjectFormModal({ open, onClose, onSave }: Props) {
  const [name, setName] = useState("");
  const [deadline, setDeadline] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) {
      setName("");
      setDeadline("");
      setSaving(false);
    }
  }, [open]);

  const submit = async () => {
    if (!name.trim()) return;
    setSaving(true);
    await onSave({
      name: name.trim(),
      deadline: deadline || null,
    });
    setSaving(false);
    onClose();
  };

  return (
    <Modal
      open={open}
      title="New Project"
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
          <label className="mb-1 block text-sm font-medium text-slate-700">Project name</label>
          <input
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-900"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="例: English Study"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Deadline</label>
          <input
            type="date"
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-900"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
          />
        </div>
      </div>
    </Modal>
  );
}