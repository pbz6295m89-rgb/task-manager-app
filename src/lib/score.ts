import type { DailyLog, Task } from "./types";

export function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function calcTaskScore(estimatedMinutes: number, actualSeconds: number) {
  const estimatedSeconds = Math.max(1, estimatedMinutes * 60);
  const diffRatio = (estimatedSeconds - actualSeconds) / estimatedSeconds;

  // 時間通りなら100
  // 早ければ割合分加算
  // 遅ければ割合分減算
  return clamp(Math.round(100 + diffRatio * 100), 0, 200);
}

export function calcDailyBaseScore(tasks: Task[]) {
  const initialTasks = tasks.filter((task) => task.task_type === "initial");

  return initialTasks.reduce((sum, task) => {
    return sum + calcTaskScore(task.estimated_minutes, task.actual_seconds);
  }, 0);
}

export function calcStreakBonus(previousLogs: DailyLog[], baseScore: number) {
  if (baseScore < 100) return 0;

  const sorted = [...previousLogs].sort((a, b) =>
    b.log_date.localeCompare(a.log_date)
  );

  let streak = 0;

  for (const log of sorted) {
    if (log.score >= 100) streak += 1;
    else break;
  }

  return streak * 20;
}