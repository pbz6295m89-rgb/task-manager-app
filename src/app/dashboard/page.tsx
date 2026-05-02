"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { differenceInSeconds } from "date-fns";
import { AppShell } from "@/components/AppShell";
import { Modal } from "@/components/Modal";
import { TaskCard } from "@/components/TaskCard";
import { TaskFormModal } from "@/components/TaskFormModal";
import { formatClock, todayKey } from "@/lib/date";
import type { Task, TaskType } from "@/lib/types";
import { useAppStore } from "@/store/useAppStore";

export default function DashboardPage() {
  const router = useRouter();

  const [now, setNow] = useState(Date.now());
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [taskModalType, setTaskModalType] = useState<TaskType>("initial");
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [strategyTask, setStrategyTask] = useState<Task | null>(null);
  const [finishOpen, setFinishOpen] = useState(false);

  const tasks = useAppStore((s) => s.tasks);
  const activeTaskId = useAppStore((s) => s.activeTaskId);
  const timerStartedAt = useAppStore((s) => s.timerStartedAt);

  const addTask = useAppStore((s) => s.addTask);
  const updateTask = useAppStore((s) => s.updateTask);
  const startTask = useAppStore((s) => s.startTask);
  const pauseActiveTask = useAppStore((s) => s.pauseActiveTask);
  const completeTask = useAppStore((s) => s.completeTask);
  const finishDay = useAppStore((s) => s.finishDay);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const today = todayKey();

  const todayTasks = useMemo(() => {
    return tasks.filter((task) => task.work_date === today);
  }, [tasks, today]);

  const liveTasks = useMemo(() => {
    return todayTasks.map((task) => {
      if (task.id !== activeTaskId || !timerStartedAt) return task;

      return {
        ...task,
        actual_seconds:
          task.actual_seconds +
          differenceInSeconds(new Date(now), new Date(timerStartedAt)),
      };
    });
  }, [todayTasks, activeTaskId, timerStartedAt, now]);

  const activeTask = useMemo(() => {
    return liveTasks.find((task) => task.id === activeTaskId) ?? null;
  }, [liveTasks, activeTaskId]);

  const activeElapsed = activeTask?.actual_seconds ?? 0;

  const visibleTasks = useMemo(() => {
    return liveTasks
      .filter((task) => task.status !== "done")
      .sort(
        (a, b) =>
          a.priority - b.priority || a.created_at.localeCompare(b.created_at)
      );
  }, [liveTasks]);

  const finishedTasks = useMemo(() => {
    return liveTasks.filter((task) => task.status === "done");
  }, [liveTasks]);

  const totalEstimated = useMemo(() => {
    return liveTasks
      .filter((task) => task.task_type === "initial")
      .reduce((sum, task) => sum + task.estimated_minutes, 0);
  }, [liveTasks]);

  const totalActualSeconds = useMemo(() => {
    return liveTasks.reduce((sum, task) => sum + task.actual_seconds, 0);
  }, [liveTasks]);

  const openCreateModal = (type: TaskType) => {
    setEditingTask(null);
    setTaskModalType(type);
    setTaskModalOpen(true);
  };

  const openEditModal = (task: Task) => {
    setEditingTask(task);
    setTaskModalType(task.task_type);
    setTaskModalOpen(true);
  };

  return (
    <AppShell>
      <div className="space-y-5">
        <section className="rounded-3xl bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-sm text-slate-500">Today</p>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                  {today}
                </h1>

                <button
                  onClick={async () => {
                    const date = await finishDay();
                    if (date) router.push(`/report/${date}`);
                  }}
                  className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-medium text-white"
                >
                  本日の業務終了
                </button>
              </div>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="text-xs text-slate-500">Estimated total</div>
              <div className="mt-1 text-xl font-semibold text-slate-900">
                {totalEstimated}m
              </div>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="text-xs text-slate-500">Actual total</div>
              <div className="mt-1 text-xl font-semibold text-slate-900">
                {formatClock(totalActualSeconds)}
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-3 md:grid-cols-2">
          <div className="rounded-3xl bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900">Now working</h2>

            <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              {activeTask ? (
                <div className="space-y-2">
                  <div className="truncate text-base font-semibold text-slate-900">
                    {activeTask.title}
                  </div>

                  <div className="text-2xl font-bold tracking-tight text-slate-900">
                    {formatClock(activeElapsed)}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={pauseActiveTask}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700"
                    >
                      休憩
                    </button>

                    <button
                      onClick={() => completeTask(activeTask.id)}
                      className="rounded-xl bg-emerald-600 px-3 py-2 text-sm font-medium text-white"
                    >
                      完了
                    </button>
                  </div>
                </div>
              ) : (
                <div className="py-4 text-sm text-slate-500">
                  実行するタスクを選び、Startボタンを押してください
                </div>
              )}
            </div>
          </div>

          <button
            onClick={() => setFinishOpen(true)}
            className="rounded-3xl border border-slate-200 bg-white p-4 text-left shadow-sm"
          >
            <h2 className="text-sm font-semibold text-slate-900">Finished</h2>
            <div className="mt-3 text-3xl font-bold text-emerald-600">
              {finishedTasks.length}
            </div>
            <p className="mt-1 text-sm text-slate-500">
              完了したタスクを確認する
            </p>
          </button>
        </section>

        <section className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="mr-auto text-lg font-semibold text-slate-900">
              Tasks
            </h2>

            <button
              onClick={() => openCreateModal("initial")}
              className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-medium text-white"
            >
              Create initial task
            </button>

            <button
              onClick={() => openCreateModal("added")}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700"
            >
              + Add Task
            </button>
          </div>

          {visibleTasks.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
              タスクを追加してください
            </div>
          ) : (
            <div className="space-y-3">
              {visibleTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  liveElapsedSeconds={task.actual_seconds}
                  active={task.id === activeTaskId}
                  onStart={() => startTask(task.id)}
                  onPause={pauseActiveTask}
                  onDone={() => completeTask(task.id)}
                  onStrategy={() => setStrategyTask(task)}
                  onEdit={() => openEditModal(task)}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      <TaskFormModal
        open={taskModalOpen}
        title={
          taskModalType === "initial"
            ? "Create initial task"
            : "Add unexpected task"
        }
        taskType={taskModalType}
        editingTask={editingTask}
        onClose={() => {
          setTaskModalOpen(false);
          setEditingTask(null);
        }}
        onCreate={addTask}
        onUpdate={updateTask}
      />

      <Modal
        open={!!strategyTask}
        title="Strategy memo"
        onClose={() => setStrategyTask(null)}
        footer={
          <button
            onClick={async () => {
              if (strategyTask) {
                await updateTask(strategyTask.id, {
                  strategy_memo: strategyTask.strategy_memo,
                });
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

      <Modal
        open={finishOpen}
        title="Finished Tasks"
        onClose={() => setFinishOpen(false)}
      >
        {finishedTasks.length === 0 ? (
          <p className="text-sm text-slate-500">完了タスクはまだありません。</p>
        ) : (
          <div className="space-y-2">
            {finishedTasks.map((task) => (
              <div
                key={task.id}
                className="rounded-2xl border border-slate-200 p-3"
              >
                <div className="font-medium text-slate-900">{task.title}</div>
                <div className="mt-1 text-sm text-slate-500">
                  目標 {task.estimated_minutes}m / 実績{" "}
                  {Math.round(task.actual_seconds / 60)}m
                </div>
              </div>
            ))}
          </div>
        )}
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