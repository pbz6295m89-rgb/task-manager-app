import type { DailyLog, Task } from "./types";

export function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function calcTaskScore(estimatedMinutes: number, actualSeconds: number) {
  const estimatedSeconds = Math.max(1, estimatedMinutes * 60);
  const ratio = (estimatedSeconds - actualSeconds) / estimatedSeconds;
  const score = 100 + ratio * 100;
  return clamp(Math.round(score), 0, 200);
}

export function calcDailyBaseScore(tasks: Task[]) {
  return tasks.reduce((sum, task) => {
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

export function getProgressRatio(estimatedMinutes: number, actualSeconds: number) {
  const estimatedSeconds = Math.max(1, estimatedMinutes * 60);
  return actualSeconds / estimatedSeconds;
}

export function getProgressTone(ratio: number) {
  if (ratio < 0.8) return "emerald";
  if (ratio <= 1) return "amber";
  return "rose";
}