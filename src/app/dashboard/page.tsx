"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { differenceInSeconds } from "date-fns";
import { AppShell } from "@/components/AppShell";
import { TaskFormModal } from "@/components/TaskFormModal";
import { TaskCard } from "@/components/TaskCard";
import { Modal } from "@/components/Modal";
import { formatClock, todayKey } from "@/lib/date";
import { calcDailyBaseScore, calcTaskScore } from "@/lib/score";
import type { Task } from "@/lib/types";
import { useAppStore } from "@/store/useAppStore";

export default function DashboardPage() {
  const router = useRouter();
  const [now, setNow] = useState(Date.now());
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [strategyTask, setStrategyTask] = useState<Task | null>(null);

  const tasks = useAppStore((s) => s.tasks);
  const projects = useAppStore((s) => s.projects);
  const logs = useAppStore((s) => s.logs);
  const activeTaskId = useAppStore((s) => s.activeTaskId);
  const timerStartedAt = useAppStore((s) => s.timerStartedAt);

  const addTask = useAppStore((s) => s.addTask);
  const startTask = useAppStore((s) => s.startTask);
  const pauseActiveTask = useAppStore((s) => s.pauseActiveTask);
  const completeTask = useAppStore((s) => s.completeTask);
  const finishDay = useAppStore((s) => s.finishDay);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const activeTask = useMemo(
    () => tasks.find((task) => task.id === activeTaskId) ?? null,
    [tasks, activeTaskId]
  );

  const liveTasks = useMemo(() => {
    return tasks.map((task) => {
      if (task.id !== activeTaskId || !timerStartedAt) return task;
      const liveElapsed =
        task.actual_seconds + differenceInSeconds(new Date(now), new Date(timerStartedAt));
      return { ...task, actual_seconds: liveElapsed };
    });
  }, [tasks, activeTaskId, timerStartedAt, now]);

  const totalEstimated = useMemo(
    () => liveTasks.reduce((sum, task) => sum + task.estimated_minutes, 0),
    [liveTasks]
  );

  const totalActualSeconds = useMemo(
    () => liveTasks.reduce((sum, task) => sum + task.actual_seconds, 0),
    [liveTasks]
  );

  const scorePreview = useMemo(() => calcDailyBaseScore(liveTasks), [liveTasks]);

  const taskList = useMemo(() => {
    return [...liveTasks].sort((a, b) => a.priority - b.priority || a.created_at.localeCompare(b.created_at));
  }, [liveTasks]);

  return (
    <AppShell>
      <div className="space-y-5">
        <section className="rounded-3xl bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-slate-500">Today</p>
              <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
                {todayKey()}
              </h1>
            </div>

            <div className="text-right">
              <div className="text-xs text-slate-500">Score</div>
              <div className="text-3xl font-bold text-emerald-600">{scorePreview}</div>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="text-xs text-slate-500">Estimated total</div>
              <div className="mt-1 text-xl font-semibold text-slate-900">{totalEstimated}m</div>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="text-xs text-slate-500">Actual total</div>
              <div className="mt-1 text-xl font-semibold text-slate-900">
                {formatClock(totalActualSeconds)}
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-3xl bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Now working</h2>
            <button
              onClick={() => setTaskModalOpen(true)}
              className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-medium text-white"
            >
              + Add Task
            </button>
          </div>

          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            {activeTask ? (
              <div className="space-y-3">
                <div className="text-sm text-slate-500">Working on</div>
                <div className="text-xl font-semibold text-slate-900">{activeTask.title}</div>
                <div className="text-3xl font-bold tracking-tight text-slate-900">
                  {formatClock(activeTask.actual_seconds)}
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={pauseActiveTask}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700"
                  >
                    休憩
                  </button>

                  <button
                    onClick={() => completeTask(activeTask.id)}
                    className="rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white"
                  >
                    完了
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-6 text-center text-slate-500">
                タスクを選択してください
              </div>
            )}
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Tasks</h2>
            <button
              onClick={async () => {
                const date = await finishDay();
                if (date) router.push(`/report/${date}`);
              }}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700"
            >
              本日の業務終了
            </button>
          </div>

          {taskList.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
              タスクを追加してください
            </div>
          ) : (
            <div className="space-y-3">
              {taskList.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  liveElapsedSeconds={task.actual_seconds}
                  active={task.id === activeTaskId}
                  onStart={() => startTask(task.id)}
                  onPause={pauseActiveTask}
                  onDone={() => completeTask(task.id)}
                  onStrategy={() => setStrategyTask(task)}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      <TaskFormModal
        open={taskModalOpen}
        onClose={() => setTaskModalOpen(false)}
        onSave={addTask}
        projects={projects}
      />

      <Modal
        open={!!strategyTask}
        title="Strategy memo"
        onClose={() => setStrategyTask(null)}
        footer={
          <button
            onClick={async () => {
              if (strategyTask) {
                await useAppStore.getState().saveStrategyMemo(strategyTask.id, strategyTask.strategy_memo);
              }
              setStrategyTask(null);
            }}
            className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-medium text-white"
          >
            Save
          </button>
        }
      >
        <StrategyEditor task={strategyTask} />
      </Modal>
    </AppShell>
  );
}

function StrategyEditor({ task }: { task: Task | null }) {
  const [value, setValue] = useState(task?.strategy_memo ?? "");

  useEffect(() => {
    setValue(task?.strategy_memo ?? "");
  }, [task]);

  if (!task) return null;

  return (
    <textarea
      className="min-h-40 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-900"
      value={value}
      onChange={(e) => {
        setValue(e.target.value);
        task.strategy_memo = e.target.value;
      }}
      placeholder="How will you do this task?"
    />
  );
}