"use client";

import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { ProjectFormModal } from "@/components/ProjectFormModal";
import { useAppStore } from "@/store/useAppStore";
import { format } from "date-fns";

export default function ProjectsPage() {
  const [open, setOpen] = useState(false);

  const projects = useAppStore((s) => s.projects);
  const tasks = useAppStore((s) => s.tasks);
  const addProject = useAppStore((s) => s.addProject);

  const projectCards = useMemo(() => {
    return projects.map((project) => {
      const projectTasks = tasks.filter((task) => task.project_id === project.id);
      const totalWeight = projectTasks.reduce((sum, task) => sum + task.weight, 0);
      const doneWeight = projectTasks
        .filter((task) => task.status === "done")
        .reduce((sum, task) => sum + task.weight, 0);

      const progress = totalWeight === 0 ? 0 : Math.round((doneWeight / totalWeight) * 100);

      return {
        project,
        totalWeight,
        doneWeight,
        progress,
        count: projectTasks.length,
      };
    });
  }, [projects, tasks]);

  return (
    <AppShell>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500">Projects</p>
            <h1 className="text-2xl font-bold text-slate-900">Project management</h1>
          </div>

          <button
            onClick={() => setOpen(true)}
            className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-medium text-white"
          >
            + New Project
          </button>
        </div>

        <div className="space-y-3">
          {projectCards.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
              プロジェクトを追加してください
            </div>
          ) : (
            projectCards.map(({ project, progress, count }) => (
              <div key={project.id} className="rounded-3xl bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">{project.name}</h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Deadline {project.deadline ?? "—"}
                    </p>
                  </div>

                  <div className="text-right">
                    <div className="text-xs text-slate-500">Progress</div>
                    <div className="text-2xl font-bold text-slate-900">{progress}%</div>
                  </div>
                </div>

                <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-slate-900" style={{ width: `${progress}%` }} />
                </div>

                <div className="mt-3 text-sm text-slate-500">
                  {count} tasks · created {format(new Date(project.created_at), "yyyy/MM/dd")}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <ProjectFormModal open={open} onClose={() => setOpen(false)} onSave={addProject} />
    </AppShell>
  );
}