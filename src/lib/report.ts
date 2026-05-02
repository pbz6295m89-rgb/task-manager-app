import type { DailyLog, DailyReport, Task } from "./types";
import { calcDailyScoreDetails } from "./score";

export function createDraftReport(
  date: string,
  tasks: Task[],
  previousLogs: DailyLog[]
): DailyReport {
  void previousLogs;

  const dayTasks = tasks.filter((task) => task.work_date === date);
  const initialTasks = dayTasks.filter((task) => task.task_type === "initial");

  const scoreResult = calcDailyScoreDetails(dayTasks);

  return {
    date,
    base_score: scoreResult.score,
    score: scoreResult.score,
    total_estimated_minutes: initialTasks.reduce(
      (sum, task) => sum + task.estimated_minutes,
      0
    ),
    total_actual_seconds: dayTasks.reduce(
      (sum, task) => sum + task.actual_seconds,
      0
    ),
    overall_memo: "",
    score_details: scoreResult.details,
    tasks: dayTasks
      .slice()
      .sort((a, b) => {
        if (a.task_type !== b.task_type) {
          return a.task_type === "initial" ? -1 : 1;
        }
        return a.priority - b.priority;
      })
      .map((task) => ({
        task_id: task.id,
        title: task.title,
        estimated_minutes: task.estimated_minutes,
        actual_seconds: task.actual_seconds,
        status: task.status,
        task_type: task.task_type,
        reason: task.result_memo ?? "",
      })),
  };
}

export function reportStatusLabel(status: string, actualSeconds = 0) {
  if (status === "done") return "完了";
  if (status === "working") return "作業中";
  if (actualSeconds >= 60) return "進行中";
  return "未着手";
}

export function buildEstimatedCopyText(report: DailyReport) {
  const initialTasks = report.tasks.filter(
    (task) => task.task_type === "initial"
  );

  return [
    `日付: ${report.date}`,
    "",
    "初期タスク名:",
    ...initialTasks.map(
      (task) => `- ${task.title}: 予測時間 ${task.estimated_minutes}分`
    ),
    "",
    `合計予測時間: ${report.total_estimated_minutes}分`,
  ].join("\n");
}

export function buildResultCopyText(report: DailyReport) {
  const initialTasks = report.tasks.filter(
    (task) => task.task_type === "initial"
  );

  const addedTasks = report.tasks.filter((task) => task.task_type === "added");

  const lines: string[] = [];

  lines.push(`日付: ${report.date}`);
  lines.push("");

  lines.push("初期タスク名:");
  if (initialTasks.length === 0) {
    lines.push("- なし");
  } else {
    for (const task of initialTasks) {
      lines.push(
        `- ${task.title}: 予測時間 ${task.estimated_minutes}分 / 実績時間 ${Math.round(
          task.actual_seconds / 60
        )}分 / ${reportStatusLabel(task.status, task.actual_seconds)}`
      );

      if (task.reason.trim()) {
        lines.push(`  進捗報告: ${task.reason}`);
      }
    }
  }

  if (addedTasks.length > 0) {
    lines.push("");
    lines.push("追加タスク:");

    for (const task of addedTasks) {
      lines.push(
        `- ${task.title}: 実績時間 ${Math.round(
          task.actual_seconds / 60
        )}分 / ${reportStatusLabel(task.status, task.actual_seconds)}`
      );

      if (task.reason.trim()) {
        lines.push(`  進捗報告: ${task.reason}`);
      }
    }
  }

  lines.push("");
  lines.push(`合計実績時間: ${Math.round(report.total_actual_seconds / 60)}分`);

  lines.push("");
  lines.push("コメント:");
  lines.push(report.overall_memo.trim() ? report.overall_memo : "");

  return lines.join("\n");
}