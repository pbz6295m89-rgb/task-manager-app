"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { differenceInSeconds, endOfMonth, format, startOfMonth } from "date-fns";
import { supabase } from "@/lib/supabase";
import { todayKey } from "@/lib/date";
import { createDraftReport } from "@/lib/report";
import type {
  CalendarEvent,
  CalendarEventInput,
  DailyLog,
  DailyReport,
  Project,
  ProjectInput,
  Task,
  TaskInput,
} from "@/lib/types";

type AppState = {
  userId: string | null;
  userEmail: string | null;
  initialized: boolean;
  loading: boolean;

  tasks: Task[];
  projects: Project[];
  logs: DailyLog[];
  calendarEvents: CalendarEvent[];

  activeTaskId: string | null;
  timerStartedAt: string | null;
  selectedDate: string;

  init: () => Promise<void>;
  refreshAll: () => Promise<void>;
  refreshMonth: (date: Date) => Promise<void>;

  addTask: (input: TaskInput) => Promise<void>;
  updateTask: (id: string, patch: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  saveStrategyMemo: (id: string, memo: string) => Promise<void>;

  addProject: (input: ProjectInput) => Promise<void>;

  startTask: (id: string) => Promise<void>;
  pauseActiveTask: () => Promise<void>;
  completeTask: (id: string) => Promise<void>;

  finishDay: () => Promise<string | null>;
  upsertDailyReport: (date: string, report: DailyReport) => Promise<void>;

  addCalendarEvent: (input: CalendarEventInput) => Promise<void>;
  updateCalendarEvent: (id: string, title: string) => Promise<void>;
  deleteCalendarEvent: (id: string) => Promise<void>;

  signOut: () => Promise<void>;
  setSelectedDate: (dateKey: string) => void;
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      userId: null,
      userEmail: null,
      initialized: false,
      loading: false,

      tasks: [],
      projects: [],
      logs: [],
      calendarEvents: [],

      activeTaskId: null,
      timerStartedAt: null,
      selectedDate: todayKey(),

      init: async () => {
        if (get().initialized) return;

        set({ loading: true });

        const { data, error } = await supabase.auth.getUser();
        if (error) console.error(error);

        const user = data.user;

        set({
          userId: user?.id ?? null,
          userEmail: user?.email ?? null,
        });

        if (user) {
          await get().refreshAll();
        }

        set({ initialized: true, loading: false });
      },

      refreshAll: async () => {
        const user = get().userId;
        if (!user) return;

        const [tasksRes, projectsRes, logsRes, eventsRes] = await Promise.all([
          supabase
            .from("tasks")
            .select("*")
            .eq("user_id", user)
            .order("priority", { ascending: true })
            .order("created_at", { ascending: true }),

          supabase
            .from("projects")
            .select("*")
            .eq("user_id", user)
            .order("created_at", { ascending: false }),

          supabase
            .from("daily_logs")
            .select("*")
            .eq("user_id", user)
            .order("log_date", { ascending: false })
            .limit(90),

          supabase
            .from("calendar_events")
            .select("*")
            .eq("user_id", user)
            .order("event_date", { ascending: true }),
        ]);

        if (tasksRes.data) set({ tasks: tasksRes.data as Task[] });
        if (projectsRes.data) set({ projects: projectsRes.data as Project[] });
        if (logsRes.data) set({ logs: logsRes.data as DailyLog[] });
        if (eventsRes.data) set({ calendarEvents: eventsRes.data as CalendarEvent[] });
      },

      refreshMonth: async (date: Date) => {
        const user = get().userId;
        if (!user) return;

        const from = format(startOfMonth(date), "yyyy-MM-dd");
        const to = format(endOfMonth(date), "yyyy-MM-dd");

        const [logsRes, eventsRes] = await Promise.all([
          supabase
            .from("daily_logs")
            .select("*")
            .eq("user_id", user)
            .gte("log_date", from)
            .lte("log_date", to)
            .order("log_date", { ascending: true }),

          supabase
            .from("calendar_events")
            .select("*")
            .eq("user_id", user)
            .gte("event_date", from)
            .lte("event_date", to)
            .order("event_date", { ascending: true }),
        ]);

        if (logsRes.data) set({ logs: logsRes.data as DailyLog[] });
        if (eventsRes.data) set({ calendarEvents: eventsRes.data as CalendarEvent[] });
      },

      addTask: async (input) => {
        const user = get().userId;
        if (!user) return;

        const { error } = await supabase.from("tasks").insert({
          user_id: user,
          project_id: null,
          title: input.title,
          estimated_minutes: input.estimated_minutes,
          actual_seconds: 0,
          priority: input.priority,
          weight: 1,
          strategy_memo: input.strategy_memo,
          result_memo: "",
          status: "todo",
          started_at: null,
          due_date: null,
          work_date: input.work_date,
          task_type: input.task_type,
          updated_at: new Date().toISOString(),
        });

        if (error) throw error;
        await get().refreshAll();
      },

      updateTask: async (id, patch) => {
        const { error } = await supabase
          .from("tasks")
          .update({
            ...patch,
            updated_at: new Date().toISOString(),
          })
          .eq("id", id);

        if (error) throw error;
        await get().refreshAll();
      },

      deleteTask: async (id) => {
        const { error } = await supabase.from("tasks").delete().eq("id", id);
        if (error) throw error;
        await get().refreshAll();
      },

      saveStrategyMemo: async (id, memo) => {
        await get().updateTask(id, { strategy_memo: memo });
      },

      addProject: async (input) => {
        const user = get().userId;
        if (!user) return;

        const { error } = await supabase.from("projects").insert({
          user_id: user,
          name: input.name,
          deadline: input.deadline,
        });

        if (error) throw error;
        await get().refreshAll();
      },

      startTask: async (id) => {
        const state = get();
        const task = state.tasks.find((t) => t.id === id);
        if (!task) return;

        if (state.activeTaskId && state.activeTaskId !== id) {
          await get().pauseActiveTask();
        }

        const now = new Date().toISOString();

        const { error } = await supabase
          .from("tasks")
          .update({
            status: "working",
            started_at: now,
            updated_at: now,
          })
          .eq("id", id);

        if (error) throw error;

        set({
          activeTaskId: id,
          timerStartedAt: now,
        });

        await get().refreshAll();
      },

      pauseActiveTask: async () => {
        const state = get();
        const id = state.activeTaskId;
        const startedAt = state.timerStartedAt;

        if (!id || !startedAt) return;

        const task = state.tasks.find((t) => t.id === id);
        if (!task) return;

        const liveSeconds =
          task.actual_seconds + differenceInSeconds(new Date(), new Date(startedAt));

        const now = new Date().toISOString();

        const { error } = await supabase
          .from("tasks")
          .update({
            actual_seconds: liveSeconds,
            status: "break",
            started_at: null,
            updated_at: now,
          })
          .eq("id", id);

        if (error) throw error;

        set({
          activeTaskId: null,
          timerStartedAt: null,
        });

        await get().refreshAll();
      },

      completeTask: async (id) => {
        const state = get();
        const task = state.tasks.find((t) => t.id === id);
        if (!task) return;

        let totalSeconds = task.actual_seconds;

        if (state.activeTaskId === id && state.timerStartedAt) {
          totalSeconds =
            task.actual_seconds +
            differenceInSeconds(new Date(), new Date(state.timerStartedAt));
        }

        const now = new Date().toISOString();

        const { error } = await supabase
          .from("tasks")
          .update({
            actual_seconds: totalSeconds,
            status: "done",
            started_at: null,
            updated_at: now,
          })
          .eq("id", id);

        if (error) throw error;

        if (state.activeTaskId === id) {
          set({
            activeTaskId: null,
            timerStartedAt: null,
          });
        }

        await get().refreshAll();
      },

      finishDay: async () => {
        const state = get();
        const user = state.userId;
        if (!user) return null;

        if (state.activeTaskId) {
          await get().pauseActiveTask();
        }

        await get().refreshAll();

        const today = todayKey();
        const currentTasks = get().tasks.filter((task) => task.work_date === today);
        const previousLogs = get().logs.filter((log) => log.log_date < today);

        const report = createDraftReport(today, currentTasks, previousLogs);

        await get().upsertDailyReport(today, report);

        set({ selectedDate: today });
        return today;
      },

      upsertDailyReport: async (date, report) => {
        const user = get().userId;
        if (!user) return;

        const { error } = await supabase.from("daily_logs").upsert(
          {
            user_id: user,
            log_date: date,
            score: report.score,
            report_json: report,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id,log_date" }
        );

        if (error) throw error;
        await get().refreshAll();
      },

      addCalendarEvent: async (input) => {
        const user = get().userId;
        if (!user) return;

        const { error } = await supabase.from("calendar_events").insert({
          user_id: user,
          event_date: input.event_date,
          title: input.title,
          updated_at: new Date().toISOString(),
        });

        if (error) throw error;
        await get().refreshAll();
      },

      updateCalendarEvent: async (id, title) => {
        const { error } = await supabase
          .from("calendar_events")
          .update({
            title,
            updated_at: new Date().toISOString(),
          })
          .eq("id", id);

        if (error) throw error;
        await get().refreshAll();
      },

      deleteCalendarEvent: async (id) => {
        const { error } = await supabase.from("calendar_events").delete().eq("id", id);
        if (error) throw error;
        await get().refreshAll();
      },

      signOut: async () => {
        await supabase.auth.signOut();

        set({
          userId: null,
          userEmail: null,
          tasks: [],
          projects: [],
          logs: [],
          calendarEvents: [],
          activeTaskId: null,
          timerStartedAt: null,
          initialized: false,
        });
      },

      setSelectedDate: (dateKey) => set({ selectedDate: dateKey }),
    }),
    {
      name: "task-app-ui",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        selectedDate: state.selectedDate,
      }),
    }
  )
);