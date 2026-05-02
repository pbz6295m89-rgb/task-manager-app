import type { DailyLog, DailyReport, Task } from "./types";
import { calcDailyBaseScore, calcStreakBonus } from "./score";

export function createDraftReport(
  date: string,
  tasks: Task[],
  previousLogs: DailyLog[]
): DailyReport {
  const baseScore = calcDailyBaseScore(tasks);
  const streakBonus = calcStreakBonus(previousLogs, baseScore);
  const score = baseScore + streakBonus;

  return {
    date,
    base_score: baseScore,
    streak_bonus: streakBonus,
    score,
    total_estimated_minutes: tasks.reduce((sum, task) => sum + task.estimated_minutes, 0),
    total_actual_seconds: tasks.reduce((sum, task) => sum + task.actual_seconds, 0),
    overall_memo: "",
    tasks: tasks
      .slice()
      .sort((a, b) => a.priority - b.priority)
      .map((task) => ({
        task_id: task.id,
        title: task.title,
        estimated_minutes: task.estimated_minutes,
        actual_seconds: task.actual_seconds,
        status: task.status,
        reason: task.result_memo ?? "",
      })),
  };
}

export function buildDailyReportText(report: DailyReport) {
  const lines: string[] = [];
  lines.push(`Date: ${report.date}`);
  lines.push(`Score: ${report.score} (Base: ${report.base_score}, Bonus: ${report.streak_bonus})`);
  lines.push(`Total planned: ${report.total_estimated_minutes} min`);
  lines.push(`Total actual: ${Math.round(report.total_actual_seconds / 60)} min`);
  lines.push("");
  lines.push("Tasks:");

  for (const task of report.tasks) {
    lines.push(
      `- ${task.title} | planned ${task.estimated_minutes}m | actual ${Math.round(task.actual_seconds / 60)}m | ${task.status}`
    );
    if (task.reason.trim()) {
      lines.push(`  reason: ${task.reason}`);
    }
  }

  if (report.overall_memo.trim()) {
    lines.push("");
    lines.push("Reflection:");
    lines.push(report.overall_memo);
  }

  return lines.join("\n");
}