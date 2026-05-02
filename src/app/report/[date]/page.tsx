"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { Modal } from "@/components/Modal";
import {
  buildEstimatedCopyText,
  buildResultCopyText,
  createDraftReport,
  reportStatusLabel,
} from "@/lib/report";
import type { DailyReport } from "@/lib/types";
import { useAppStore } from "@/store/useAppStore";

type ImageTableRow = string[];

async function copyTableImageToClipboard({
  title,
  headers,
  rows,
  footer,
}: {
  title: string;
  headers: string[];
  rows: ImageTableRow[];
  footer?: string[];
}) {
  const scale = 2;

  const columnWidths = headers.map((header, index) => {
    const maxTextLength = Math.max(
      header.length,
      ...rows.map((row) => String(row[index] ?? "").length)
    );

    return Math.max(130, Math.min(280, maxTextLength * 16));
  });

  const paddingX = 32;
  const paddingY = 28;
  const titleHeight = 44;
  const rowHeight = 46;
  const headerHeight = 46;
  const footerHeight =
    footer && footer.length > 0 ? footer.length * 34 + 24 : 0;

  const tableWidth = columnWidths.reduce((sum, width) => sum + width, 0);
  const width = tableWidth + paddingX * 2;
  const height =
    paddingY * 2 +
    titleHeight +
    headerHeight +
    rows.length * rowHeight +
    footerHeight;

  const canvas = document.createElement("canvas");
  canvas.width = width * scale;
  canvas.height = height * scale;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not supported.");

  ctx.scale(scale, scale);

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = "#0f172a";
  ctx.font = "bold 16px Arial, sans-serif";

  const maxTitleWidth = width - paddingX * 2;
  const titleText =
    ctx.measureText(title).width > maxTitleWidth
      ? clipText(ctx, title, maxTitleWidth)
      : title;

  ctx.fillText(titleText, paddingX, paddingY + 22);

  let y = paddingY + titleHeight;

  ctx.fillStyle = "#f1f5f9";
  ctx.fillRect(paddingX, y, tableWidth, headerHeight);

  ctx.strokeStyle = "#cbd5e1";
  ctx.lineWidth = 1;

  let x = paddingX;

  ctx.font = "bold 14px Arial, sans-serif";
  ctx.fillStyle = "#334155";

  headers.forEach((header, index) => {
    ctx.strokeRect(x, y, columnWidths[index], headerHeight);
    ctx.fillText(header, x + 12, y + 28);
    x += columnWidths[index];
  });

  y += headerHeight;
  ctx.font = "14px Arial, sans-serif";

  rows.forEach((row, rowIndex) => {
    x = paddingX;

    ctx.fillStyle = rowIndex % 2 === 0 ? "#ffffff" : "#f8fafc";
    ctx.fillRect(paddingX, y, tableWidth, rowHeight);

    row.forEach((cell, index) => {
      ctx.strokeStyle = "#e2e8f0";
      ctx.strokeRect(x, y, columnWidths[index], rowHeight);

      ctx.fillStyle = "#0f172a";

      const text = String(cell ?? "");
      const maxWidth = columnWidths[index] - 24;
      const clipped =
        ctx.measureText(text).width > maxWidth
          ? clipText(ctx, text, maxWidth)
          : text;

      ctx.fillText(clipped, x + 12, y + 29);
      x += columnWidths[index];
    });

    y += rowHeight;
  });

  if (footer && footer.length > 0) {
    y += 20;
    ctx.font = "14px Arial, sans-serif";
    ctx.fillStyle = "#334155";

    footer.forEach((line) => {
      ctx.fillText(line, paddingX, y);
      y += 30;
    });
  }

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/png")
  );

  if (!blob) throw new Error("Failed to create image.");

  await navigator.clipboard.write([
    new ClipboardItem({
      "image/png": blob,
    }),
  ]);
}

function clipText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
) {
  let clipped = text;

  while (
    ctx.measureText(`${clipped}...`).width > maxWidth &&
    clipped.length > 0
  ) {
    clipped = clipped.slice(0, -1);
  }

  return `${clipped}...`;
}

export default function ReportPage() {
  const params = useParams<{ date: string }>();
  const date = params.date;

  const [report, setReport] = useState<DailyReport | null>(null);
  const [status, setStatus] = useState("");
  const [scoreOpen, setScoreOpen] = useState(false);

  const tasks = useAppStore((s) => s.tasks);
  const logs = useAppStore((s) => s.logs);
  const refreshAll = useAppStore((s) => s.refreshAll);
  const upsertDailyReport = useAppStore((s) => s.upsertDailyReport);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  useEffect(() => {
    const existing = logs.find((log) => log.log_date === date);

    const dayTasks = tasks.filter((task) => task.work_date === date);
    const previousLogs = logs.filter((log) => log.log_date < date);
    const draft = createDraftReport(date, dayTasks, previousLogs);

    if (existing?.report_json) {
      setReport({
        ...draft,
        overall_memo: existing.report_json.overall_memo ?? "",
        tasks: draft.tasks.map((task) => {
          const saved = existing.report_json?.tasks.find(
            (item) => item.task_id === task.task_id
          );

          return {
            ...task,
            reason: saved?.reason ?? task.reason,
          };
        }),
      });
      return;
    }

    setReport(draft);
  }, [date, tasks, logs]);

  useEffect(() => {
    if (!report) return;

    const timer = window.setTimeout(async () => {
      await upsertDailyReport(date, report);
      setStatus("自動保存済み");
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

    const initialTasksForCopy = report.tasks.filter(
      (task) => task.task_type === "initial"
    );

    const rows = initialTasksForCopy.map((task) => [
      task.title,
      `${task.estimated_minutes}分`,
    ]);

    try {
      await copyTableImageToClipboard({
        title: `予定タスク（${report.date}）`,
        headers: ["初期タスク名", "予測時間"],
        rows,
        footer: [`合計予測時間: ${report.total_estimated_minutes}分`],
      });

      setStatus("予定タスクの表画像をコピーしました");
    } catch {
      await navigator.clipboard.writeText(buildEstimatedCopyText(report));
      setStatus("画像コピーに失敗したため、テキストでコピーしました");
    }
  };

  const copyResult = async () => {
    if (!report) return;

    const initialTasksForCopy = report.tasks.filter(
      (task) => task.task_type === "initial"
    );
    const addedTasksForCopy = report.tasks.filter(
      (task) => task.task_type === "added"
    );

    const rows: string[][] = [];

    initialTasksForCopy.forEach((task) => {
      rows.push([
        "初期タスク名",
        task.title,
        `${task.estimated_minutes}分`,
        `${Math.round(task.actual_seconds / 60)}分`,
        reportStatusLabel(task.status, task.actual_seconds),
        task.reason || "",
      ]);
    });

    addedTasksForCopy.forEach((task) => {
      rows.push([
        "追加タスク",
        task.title,
        "-",
        `${Math.round(task.actual_seconds / 60)}分`,
        reportStatusLabel(task.status, task.actual_seconds),
        task.reason || "",
      ]);
    });

    try {
      await copyTableImageToClipboard({
        title: `業務実績レポート（${report.date}）`,
        headers: [
          "区分",
          "タスク名",
          "予測時間",
          "実績時間",
          "ステータス",
          "進捗報告",
        ],
        rows,
        footer: [
          `合計実績時間: ${Math.round(report.total_actual_seconds / 60)}分`,
          report.overall_memo.trim()
            ? `コメント: ${report.overall_memo}`
            : "コメント: ",
        ],
      });

      setStatus("実績レポートの表画像をコピーしました");
    } catch {
      await navigator.clipboard.writeText(buildResultCopyText(report));
      setStatus("画像コピーに失敗したため、テキストでコピーしました");
    }
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
        <div className="rounded-3xl bg-white p-5 shadow-sm">読み込み中...</div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-5">
        <section className="rounded-3xl bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">日次レポート</p>

          <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-2xl font-bold text-slate-900">{date}</h1>

            <button
              onClick={() => setScoreOpen(true)}
              className="rounded-2xl bg-emerald-50 px-4 py-2 text-right transition active:scale-[0.98] active:bg-emerald-100"
            >
              <div className="text-xs text-emerald-700">スコア</div>
              <div className="text-2xl font-bold text-emerald-700">
                {report.score}
              </div>
            </button>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="text-xs text-slate-500">予測時間</div>
              <div className="mt-1 text-xl font-semibold text-slate-900">
                {report.total_estimated_minutes}分
              </div>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="text-xs text-slate-500">実績時間</div>
              <div className="mt-1 text-xl font-semibold text-slate-900">
                {Math.round(report.total_actual_seconds / 60)}分
              </div>
            </div>
          </div>

          <p className="mt-3 text-sm text-slate-400">{status}</p>
        </section>

        <section className="rounded-3xl bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">初期タスク</h2>

          <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200">
            <div className="grid grid-cols-4 bg-slate-50 px-4 py-2 text-xs font-medium text-slate-500">
              <div>タスク名</div>
              <div>予測時間</div>
              <div>実績時間</div>
              <div>ステータス</div>
            </div>

            {initialTasks.map((task) => (
              <div
                key={task.task_id}
                className="grid grid-cols-4 border-t border-slate-200 px-4 py-3 text-sm"
              >
                <div className="truncate font-medium text-slate-900">
                  {task.title}
                </div>

                <div className="text-slate-600">{task.estimated_minutes}分</div>

                <div className="text-slate-600">
                  {Math.round(task.actual_seconds / 60)}分
                </div>

                <div
                  className={
                    task.status === "done"
                      ? "font-medium text-emerald-600"
                      : task.actual_seconds >= 60
                        ? "font-medium text-amber-600"
                        : "font-medium text-slate-500"
                  }
                >
                  {reportStatusLabel(task.status, task.actual_seconds)}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-3xl bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">追加タスク</h2>

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
                    実績時間 {Math.round(task.actual_seconds / 60)}分 /{" "}
                    {reportStatusLabel(task.status, task.actual_seconds)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-3xl bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            進行中タスク
          </h2>

          {unfinishedTasks.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">
              進行中のタスクはありません。
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {unfinishedTasks.map((task) => (
                <div
                  key={task.task_id}
                  className="rounded-2xl border border-slate-200 p-3"
                >
                  <div className="font-medium text-slate-900">
                    {task.title} /{" "}
                    {reportStatusLabel(task.status, task.actual_seconds)}
                  </div>

                  <textarea
                    className="mt-3 min-h-24 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-900"
                    value={task.reason}
                    onChange={(e) =>
                      updateTaskReason(task.task_id, e.target.value)
                    }
                    placeholder="進捗を報告する"
                  />
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-3xl bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">コメント</h2>

          <textarea
            className="mt-4 min-h-32 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-900"
            value={report.overall_memo}
            onChange={(e) =>
              setReport((prev) =>
                prev ? { ...prev, overall_memo: e.target.value } : prev
              )
            }
            placeholder="今日の振り返り"
          />
        </section>

        <section className="rounded-3xl bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">コピー</h2>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={copyEstimated}
              className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition active:scale-[0.98] active:bg-emerald-600"
            >
              予定タスクを表画像でコピー
            </button>

            <button
              onClick={copyResult}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition active:scale-[0.98] active:bg-emerald-100"
            >
              実績レポートを表画像でコピー
            </button>
          </div>
        </section>
      </div>

      <Modal
        open={scoreOpen}
        title="スコア詳細"
        onClose={() => setScoreOpen(false)}
      >
        <div className="max-h-[70vh] space-y-5 overflow-y-auto pr-1">
          <section className="rounded-2xl bg-slate-50 p-4">
            <h3 className="text-sm font-semibold text-slate-900">
              スコアルール
            </h3>

            <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
              <li>・全てのタスクが終わった日：+500 Perfect Day</li>
              <li>・未着手タスク：-150</li>
              <li>・着手したが放置：-80</li>
              <li>・予定時間超え：超えた割合に応じて減点</li>
              <li>・追加タスク完了：+80</li>
              <li>・予定より早く完了：早く終わった割合に応じて加点</li>
            </ul>
          </section>

          <section>
            <h3 className="text-sm font-semibold text-slate-900">
              算出過程
            </h3>

            <div className="mt-3 space-y-2">
              {report.score_details.length === 0 ? (
                <p className="text-sm text-slate-500">
                  スコア計算対象のタスクがありません。
                </p>
              ) : (
                report.score_details.map((detail, index) => (
                  <div
                    key={`${detail.label}-${index}`}
                    className="rounded-2xl border border-slate-200 p-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="truncate font-medium text-slate-900">
                        {detail.label}
                      </div>

                      <div
                        className={`font-bold ${
                          detail.points >= 0
                            ? "text-emerald-600"
                            : "text-rose-600"
                        }`}
                      >
                        {detail.points >= 0 ? "+" : ""}
                        {detail.points}
                      </div>
                    </div>

                    <p className="mt-1 text-sm text-slate-500">
                      {detail.reason}
                    </p>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </Modal>
    </AppShell>
  );
}