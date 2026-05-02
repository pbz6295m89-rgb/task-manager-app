export type TaskStatus = "todo" | "working" | "break" | "done";

export type Project = {
  id: string;
  user_id: string;
  name: string;
  deadline: string | null;
  created_at: string;
};

export type Task = {
  id: string;
  user_id: string;
  project_id: string | null;
  title: string;
  estimated_minutes: number;
  actual_seconds: number;
  priority: 1 | 2 | 3;
  weight: number;
  strategy_memo: string;
  result_memo: string;
  status: TaskStatus;
  started_at: string | null;
  due_date: string | null;
  created_at: string;
  updated_at: string;
};

export type TaskInput = {
  title: string;
  estimated_minutes: number;
  priority: 1 | 2 | 3;
  weight: number;
  project_id: string | null;
  due_date: string | null;
  strategy_memo: string;
};

export type ProjectInput = {
  name: string;
  deadline: string | null;
};

export type DailyReportTask = {
  task_id: string;
  title: string;
  estimated_minutes: number;
  actual_seconds: number;
  status: TaskStatus;
  reason: string;
};

export type DailyReport = {
  date: string;
  base_score: number;
  streak_bonus: number;
  score: number;
  total_estimated_minutes: number;
  total_actual_seconds: number;
  overall_memo: string;
  tasks: DailyReportTask[];
};

export type DailyLog = {
  id: string;
  user_id: string;
  log_date: string;
  score: number;
  report_json: DailyReport | null;
  created_at: string;
  updated_at: string;
};