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
  const [defaultTaskTitle, setDefaultTaskTitle] = useState("");
  const [memoTask, setMemoTask] = useState<Task | null>(null);
  const [memoType, setMemoType] = useState<"strategy" | "question">("strategy");
  const [finishOpen, setFinishOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);

  const tasks = useAppStore((s) => s.tasks);
  const activeTaskId = useAppStore((s) => s.activeTaskId);
  const timerStartedAt = useAppStore((s) => s.timerStartedAt);

  const addTask = useAppStore((s) => s.addTask);
  const updateTask = useAppStore((s) => s.updateTask);
  const startTask = useAppStore((s) => s.startTask);
  const holdActiveTask = useAppStore((s) => s.holdActiveTask);
  const switchActiveTaskToTasks = useAppStore((s) => s.switchActiveTaskToTasks);
  const moveTaskToReview = useAppStore((s) => s.moveTaskToReview);
  const completeTask = useAppStore((s) => s.completeTask);
  const returnTaskToTodo = useAppStore((s) => s.returnTaskToTodo);
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
  const isActiveTimerRunning = !!activeTask && !!timerStartedAt;

  const visibleTasks = useMemo(() => {
    return liveTasks
      .filter((task) => task.status !== "done" && task.status !== "review")
      .sort(
        (a, b) =>
          a.priority - b.priority || a.created_at.localeCompare(b.created_at)
      );
  }, [liveTasks]);

  const reviewTasks = useMemo(() => {
    return liveTasks.filter((task) => task.status === "review");
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

  const openCreateModal = (type: TaskType, title = "") => {
    setEditingTask(null);
    setTaskModalType(type);
    setDefaultTaskTitle(title);
    setTaskModalOpen(true);
  };

  const openEditModal = (task: Task) => {
    setEditingTask(task);
    setTaskModalType(task.task_type);
    setDefaultTaskTitle("");
    setTaskModalOpen(true);
  };

  const openMemo = (task: Task, type: "strategy" | "question") => {
    setMemoTask(task);
    setMemoType(type);
  };

  const closeTaskModal = () => {
    setTaskModalOpen(false);
    setEditingTask(null);
    setDefaultTaskTitle("");
  };

  const createReturnTaskName = (task: Task) => {
    const base = task.title.replace(/_\d+$/, "");

    const sameBaseTasks = todayTasks.filter(
      (item) => item.title === base || item.title.startsWith(`${base}_`)
    );

    const numbers = sameBaseTasks
      .map((item) => {
        const match = item.title.match(/_(\d+)$/);
        return match ? Number(match[1]) : 0;
      })
      .filter((num) => !Number.isNaN(num));

    const nextNumber = Math.max(...numbers, 0) + 1;

    return `${base}_${nextNumber}`;
  };

  const handleReviewReturn = async (task: Task) => {
    const nextTitle = createReturnTaskName(task);
    await completeTask(task.id);
    setReviewOpen(false);
    openCreateModal("added", nextTitle);
  };

  return (
    <AppShell>
      <div className="space-y-5">
        <section className="rounded-3xl bg-white p-5 shadow-sm">
          <div>
            <p className="text-sm text-slate-500">今日</p>

            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                {today}
              </h1>

              <button
                onClick={async () => {
                  const date = await finishDay();
                  if (date) router.push(`/report/${date}`);
                }}
                className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition active:bg-emerald-600 active:scale-[0.98]"
              >
                本日の業務終了
              </button>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="text-xs text-slate-500">予測合計時間</div>
              <div className="mt-1 text-xl font-semibold text-slate-900">
                {totalEstimated}分
              </div>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="text-xs text-slate-500">実績合計時間</div>
              <div className="mt-1 text-xl font-semibold text-slate-900">
                {formatClock(totalActualSeconds)}
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-3 md:grid-cols-3">
          <div className="rounded-3xl bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900">作業中</h2>

            <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              {activeTask ? (
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="truncate text-base font-semibold text-slate-900">
                      {activeTask.title}
                    </div>

                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        isActiveTimerRunning
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {isActiveTimerRunning ? "作業中" : "保留中"}
                    </span>
                  </div>

                  <div className="text-2xl font-bold tracking-tight text-slate-900">
                    {formatClock(activeElapsed)}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={holdActiveTask}
                      className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-700 transition active:bg-amber-200 active:scale-[0.97]"
                    >
                      保留
                    </button>

                    <button
                      onClick={switchActiveTaskToTasks}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition active:bg-emerald-100 active:scale-[0.97]"
                    >
                      別タスク切替
                    </button>
                  </div>
                </div>
              ) : (
                <div className="py-4 text-sm text-slate-500">
                  実行するタスクを選び、スタートボタンを押してください
                </div>
              )}
            </div>
          </div>

          <button
            onClick={() => setReviewOpen(true)}
            className="rounded-3xl border border-amber-200 bg-amber-50 p-4 text-left shadow-sm transition active:bg-amber-100 active:scale-[0.98]"
          >
            <h2 className="text-sm font-semibold text-amber-800">社内確認中</h2>
            <div className="mt-3 text-3xl font-bold text-amber-700">
              {reviewTasks.length}
            </div>
            <p className="mt-1 text-sm text-amber-700">
              確認中のタスクを確認する
            </p>
          </button>

          <button
            onClick={() => setFinishOpen(true)}
            className="rounded-3xl border border-slate-200 bg-white p-4 text-left shadow-sm transition active:bg-emerald-50 active:scale-[0.98]"
          >
            <h2 className="text-sm font-semibold text-slate-900">
              完了タスク
            </h2>
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
              タスク
            </h2>

            <button
              onClick={() => openCreateModal("initial")}
              className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition active:bg-emerald-600 active:scale-[0.98]"
            >
              初期タスク作成
            </button>

            <button
              onClick={() => openCreateModal("added")}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition active:bg-emerald-100 active:scale-[0.98]"
            >
              + 追加タスク
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
                  onReview={() => moveTaskToReview(task.id)}
                  onDone={() => completeTask(task.id)}
                  onStrategy={() => openMemo(task, "strategy")}
                  onQuestion={() => openMemo(task, "question")}
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
          taskModalType === "initial" ? "初期タスク作成" : "追加タスク作成"
        }
        taskType={taskModalType}
        editingTask={editingTask}
        defaultTitle={defaultTaskTitle}
        existingTasks={todayTasks}
        onClose={closeTaskModal}
        onCreate={addTask}
        onUpdate={updateTask}
      />

      <MemoModal
        task={memoTask}
        type={memoType}
        onClose={() => setMemoTask(null)}
        onSave={updateTask}
      />

      <Modal
        open={reviewOpen}
        title="社内確認中"
        onClose={() => setReviewOpen(false)}
      >
        <div className="max-h-[65vh] overflow-y-auto pr-1">
          {reviewTasks.length === 0 ? (
            <p className="text-sm text-slate-500">確認中のタスクはありません。</p>
          ) : (
            <div className="space-y-2">
              {reviewTasks.map((task) => (
                <div
                  key={task.id}
                  className="rounded-2xl border border-slate-200 p-3"
                >
                  <div className="font-medium text-slate-900">{task.title}</div>

                  <div className="mt-1 text-sm text-slate-500">
                    目標 {task.estimated_minutes}分 / 実績{" "}
                    {Math.round(task.actual_seconds / 60)}分
                  </div>

                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => handleReviewReturn(task)}
                      className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition active:bg-emerald-100 active:scale-[0.97]"
                    >
                      戻す
                    </button>

                    <button
                      onClick={() => completeTask(task.id)}
                      className="rounded-xl bg-emerald-600 px-3 py-2 text-sm font-medium text-white transition active:bg-emerald-700 active:scale-[0.97]"
                    >
                      完了
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>

      <Modal
        open={finishOpen}
        title="完了タスク"
        onClose={() => setFinishOpen(false)}
      >
        <div className="max-h-[65vh] overflow-y-auto pr-1">
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
                    目標 {task.estimated_minutes}分 / 実績{" "}
                    {Math.round(task.actual_seconds / 60)}分
                  </div>

                  <button
                    onClick={() => returnTaskToTodo(task.id)}
                    className="mt-3 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition active:bg-emerald-100 active:scale-[0.97]"
                  >
                    戻す
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>
    </AppShell>
  );
}

function MemoModal({
  task,
  type,
  onClose,
  onSave,
}: {
  task: Task | null;
  type: "strategy" | "question";
  onClose: () => void;
  onSave: (id: string, patch: Partial<Task>) => Promise<void>;
}) {
  const [value, setValue] = useState("");

  useEffect(() => {
    if (!task) return;
    setValue(type === "strategy" ? task.strategy_memo : task.question_memo);
  }, [task, type]);

  if (!task) return null;

  const title = type === "strategy" ? "戦略メモ" : "質問したいこと";

  return (
    <Modal
      open={!!task}
      title={title}
      onClose={onClose}
      footer={
        <button
          onClick={async () => {
            await onSave(task.id, {
              [type === "strategy" ? "strategy_memo" : "question_memo"]: value,
            });

            onClose();
          }}
          className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition active:bg-emerald-600 active:scale-[0.98]"
        >
          保存
        </button>
      }
    >
      <textarea
        className="min-h-40 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-900"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={
          type === "strategy"
            ? "進め方、使う資料、注意点を書く"
            : "わからないこと、質問したいことを書く"
        }
      />
    </Modal>
  );
}