import type { DailyLog, DailyReport, Task } from "./types";
import { calcDailyBaseScore, calcStreakBonus } from "./score";

export function createDraftReport(
  date: string,
  tasks: Task[],
  previousLogs: DailyLog[]
): DailyReport {
  const dayTasks = tasks.filter((task) => task.work_date === date);
  const initialTasks = dayTasks.filter((task) => task.task_type === "initial");

  const baseScore = calcDailyBaseScore(dayTasks);
  const streakBonus = calcStreakBonus(previousLogs, baseScore);
  const score = baseScore + streakBonus;

  return {
    date,
    base_score: baseScore,
    streak_bonus: streakBonus,
    score,
    total_estimated_minutes: initialTasks.reduce(
      (sum, task) => sum + task.estimated_minutes,
      0
    ),
    total_actual_seconds: dayTasks.reduce(
      (sum, task) => sum + task.actual_seconds,
      0
    ),
    overall_memo: "",
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

export function buildEstimatedCopyText(report: DailyReport) {
  const initialTasks = report.tasks.filter((task) => task.task_type === "initial");

  return [
    `Date: ${report.date}`,
    "",
    "Estimated Tasks:",
    ...initialTasks.map(
      (task) => `- ${task.title}: ${task.estimated_minutes} min`
    ),
    "",
    `Total Estimated: ${report.total_estimated_minutes} min`,
  ].join("\n");
}

export function buildResultCopyText(report: DailyReport) {
  const initialTasks = report.tasks.filter((task) => task.task_type === "initial");
  const addedTasks = report.tasks.filter((task) => task.task_type === "added");
  const unfinishedTasks = report.tasks.filter((task) => task.status !== "done");

  const lines: string[] = [];

  lines.push(`Date: ${report.date}`);
  lines.push(`Score: ${report.score}`);
  lines.push("");

  lines.push("Actual Results:");
  for (const task of initialTasks) {
    lines.push(
      `- ${task.title}: estimated ${task.estimated_minutes} min / actual ${Math.round(
        task.actual_seconds / 60
      )} min`
    );
  }

  if (addedTasks.length > 0) {
    lines.push("");
    lines.push("Added Tasks:");
    for (const task of addedTasks) {
      lines.push(
        `- ${task.title}: actual ${Math.round(task.actual_seconds / 60)} min`
      );
    }
  }

  if (unfinishedTasks.length > 0) {
    lines.push("");
    lines.push("Unfinished Tasks:");
    for (const task of unfinishedTasks) {
      lines.push(`- ${task.title}`);
      if (task.reason.trim()) lines.push(`  reason: ${task.reason}`);
    }
  }

  if (report.overall_memo.trim()) {
    lines.push("");
    lines.push("Other Reasons / Reflection:");
    lines.push(report.overall_memo);
  }

  return lines.join("\n");
}