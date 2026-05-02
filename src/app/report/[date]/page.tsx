"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import {
  buildEstimatedCopyText,
  buildResultCopyText,
  createDraftReport,
} from "@/lib/report";
import type { DailyReport } from "@/lib/types";
import { useAppStore } from "@/store/useAppStore";

export default function ReportPage() {
  const params = useParams<{ date: string }>();
  const date = params.date;

  const [report, setReport] = useState<DailyReport | null>(null);
  const [status, setStatus] = useState("");

  const tasks = useAppStore((s) => s.tasks);
  const logs = useAppStore((s) => s.logs);
  const refreshAll = useAppStore((s) => s.refreshAll);
  const upsertDailyReport = useAppStore((s) => s.upsertDailyReport);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  useEffect(() => {
    const existing = logs.find((log) => log.log_date === date);

    if (existing?.report_json) {
      setReport(existing.report_json);
      return;
    }

    const dayTasks = tasks.filter((task) => task.work_date === date);
    const previousLogs = logs.filter((log) => log.log_date < date);
    const draft = createDraftReport(date, dayTasks, previousLogs);
    setReport(draft);
  }, [date, tasks, logs]);

  useEffect(() => {
    if (!report) return;

    const timer = window.setTimeout(async () => {
      await upsertDailyReport(date, report);
      setStatus("Auto saved");
    }, 800);

    return () => window.clearTimeout(timer);
  }, [report, date, upsertDailyReport]);

  const initialTasks = useMemo(() => {
    return report?.tasks.filter((task) => task.task_type === "initial") ?? [];
  }, [report]);

  const addedTasks = useMemo(() => {
    return report?.tasks.filter((task) => task.task_type === "added") ?? [];
  }, [report]);

  const unfinishedTasks = useMemo(() => {
    return report?.tasks.filter((task) => task.status !== "done") ?? [];
  }, [report]);

  const copyEstimated = async () => {
    if (!report) return;
    await navigator.clipboard.writeText(buildEstimatedCopyText(report));
    setStatus("Estimated tasks copied");
  };

  const copyResult = async () => {
    if (!report) return;
    await navigator.clipboard.writeText(buildResultCopyText(report));
    setStatus("Result report copied");
  };

  const updateTaskReason = (taskId: string, reason: string) => {
    setReport((prev) => {
      if (!prev) return prev;

      return {
        ...prev,
        tasks: prev.tasks.map((task) =>
          task.task_id === taskId ? { ...task, reason } : task
        ),
      };
    });
  };

  if (!report) {
    return (
      <AppShell>
        <div className="rounded-3xl bg-white p-5 shadow-sm">Loading...</div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-5">
        <section className="rounded-3xl bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Daily report</p>
          <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-2xl font-bold text-slate-900">{date}</h1>

            <div className="rounded-2xl bg-emerald-50 px-4 py-2 text-right">
              <div className="text-xs text-emerald-700">Score</div>
              <div className="text-2xl font-bold text-emerald-700">
                {report.score}
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="text-xs text-slate-500">Estimated</div>
              <div className="mt-1 text-xl font-semibold text-slate-900">
                {report.total_estimated_minutes}m
              </div>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="text-xs text-slate-500">Actual</div>
              <div className="mt-1 text-xl font-semibold text-slate-900">
                {Math.round(report.total_actual_seconds / 60)}m
              </div>
            </div>
          </div>

          <p className="mt-3 text-sm text-slate-400">{status}</p>
        </section>

        <section className="rounded-3xl bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            Initial tasks
          </h2>

          <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200">
            <div className="grid grid-cols-3 bg-slate-50 px-4 py-2 text-xs font-medium text-slate-500">
              <div>Task</div>
              <div>Estimated</div>
              <div>Actual</div>
            </div>

            {initialTasks.map((task) => (
              <div
                key={task.task_id}
                className="grid grid-cols-3 border-t border-slate-200 px-4 py-3 text-sm"
              >
                <div className="truncate font-medium text-slate-900">
                  {task.title}
                </div>
                <div className="text-slate-600">{task.estimated_minutes}m</div>
                <div className="text-slate-600">
                  {Math.round(task.actual_seconds / 60)}m
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-3xl bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Added tasks</h2>

          {addedTasks.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">
              追加タスクはありません。
            </p>
          ) : (
            <div className="mt-4 space-y-2">
              {addedTasks.map((task) => (
                <div
                  key={task.task_id}
                  className="rounded-2xl border border-slate-200 p-3"
                >
                  <div className="font-medium text-slate-900">{task.title}</div>
                  <div className="mt-1 text-sm text-slate-500">
                    Actual {Math.round(task.actual_seconds / 60)}m
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-3xl bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            Unfinished tasks
          </h2>

          {unfinishedTasks.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">
              未着手・未完了タスクはありません。
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {unfinishedTasks.map((task) => (
                <div
                  key={task.task_id}
                  className="rounded-2xl border border-slate-200 p-3"
                >
                  <div className="font-medium text-slate-900">{task.title}</div>
                  <textarea
                    className="mt-3 min-h-24 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-900"
                    value={task.reason}
                    onChange={(e) =>
                      updateTaskReason(task.task_id, e.target.value)
                    }
                    placeholder="できなかった理由を書く"
                  />
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-3xl bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            Other reasons / reflection
          </h2>

          <textarea
            className="mt-4 min-h-32 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-900"
            value={report.overall_memo}
            onChange={(e) =>
              setReport((prev) =>
                prev ? { ...prev, overall_memo: e.target.value } : prev
              )
            }
            placeholder="予定通りにできなかった理由、今日の振り返り"
          />
        </section>

        <section className="rounded-3xl bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Copy</h2>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={copyEstimated}
              className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-medium text-white"
            >
              Copy estimated tasks
            </button>

            <button
              onClick={copyResult}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700"
            >
              Copy result report
            </button>
          </div>
        </section>
      </div>
    </AppShell>
  );
}