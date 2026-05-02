import type { ScoreDetail, Task } from "./types";

export function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function calcInitialDoneTaskScore(task: Task) {
  const estimatedSeconds = Math.max(1, task.estimated_minutes * 60);
  const diffSeconds = estimatedSeconds - task.actual_seconds;
  const diffRatio = diffSeconds / estimatedSeconds;

  return Math.round(100 + 100 * diffRatio);
}

export function calcDailyScoreDetails(tasks: Task[]) {
  const details: ScoreDetail[] = [];
  const dayTasks = tasks;

  const allTasksDone =
    dayTasks.length > 0 && dayTasks.every((task) => task.status === "done");

  if (allTasksDone) {
    details.push({
      label: "Perfect Day",
      points: 500,
      reason: "全てのタスクが完了したため +500",
    });
  }

  for (const task of dayTasks) {
    if (task.status === "todo") {
      details.push({
        label: task.title,
        points: -150,
        reason: "未着手タスクのため -150",
      });
      continue;
    }

    if (task.status !== "done" && task.actual_seconds > 0) {
      details.push({
        label: task.title,
        points: -80,
        reason: "着手したが完了していないため -80",
      });
      continue;
    }

    if (task.status !== "done") continue;

    if (task.task_type === "added") {
      details.push({
        label: task.title,
        points: 80,
        reason: "追加タスクを完了したため +80",
      });
      continue;
    }

    const estimatedSeconds = Math.max(1, task.estimated_minutes * 60);
    const diffSeconds = estimatedSeconds - task.actual_seconds;
    const diffMinutes = Math.round(Math.abs(diffSeconds) / 60);
    const points = calcInitialDoneTaskScore(task);

    if (diffSeconds === 0) {
      details.push({
        label: task.title,
        points,
        reason: "予定時間通りに完了したため +100",
      });
    } else if (diffSeconds > 0) {
      details.push({
        label: task.title,
        points,
        reason: `予定より${diffMinutes}分早く完了。100 + 100 × (${diffMinutes}/${task.estimated_minutes})`,
      });
    } else {
      details.push({
        label: task.title,
        points,
        reason: `予定より${diffMinutes}分超過。100 - 100 × (${diffMinutes}/${task.estimated_minutes})`,
      });
    }
  }

  const score = details.reduce((sum, detail) => sum + detail.points, 0);

  return {
    score,
    details,
  };
}