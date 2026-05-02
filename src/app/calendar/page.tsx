"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { CalendarGrid } from "@/components/CalendarGrid";
import { Modal } from "@/components/Modal";
import { monthLabel } from "@/lib/date";
import type { CalendarEvent } from "@/lib/types";
import { useAppStore } from "@/store/useAppStore";

export default function CalendarPage() {
  const [monthDate, setMonthDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);

  const refreshMonth = useAppStore((s) => s.refreshMonth);
  const logs = useAppStore((s) => s.logs);
  const tasks = useAppStore((s) => s.tasks);
  const events = useAppStore((s) => s.calendarEvents);
  const addCalendarEvent = useAppStore((s) => s.addCalendarEvent);
  const updateCalendarEvent = useAppStore((s) => s.updateCalendarEvent);
  const deleteCalendarEvent = useAppStore((s) => s.deleteCalendarEvent);

  useEffect(() => {
    refreshMonth(monthDate);
  }, [monthDate, refreshMonth]);

  const label = useMemo(() => monthLabel(monthDate), [monthDate]);

  const selectedEvents = useMemo(() => {
    if (!selectedDate) return [];
    return events.filter((event) => event.event_date === selectedDate);
  }, [events, selectedDate]);

  const selectedTasks = useMemo(() => {
    if (!selectedDate) return [];
    return tasks.filter((task) => task.work_date === selectedDate);
  }, [tasks, selectedDate]);

  const saveEvent = async () => {
    if (!selectedDate || !title.trim()) return;

    if (editingEvent) {
      await updateCalendarEvent(editingEvent.id, title.trim());
    } else {
      await addCalendarEvent({
        event_date: selectedDate,
        title: title.trim(),
      });
    }

    setTitle("");
    setEditingEvent(null);
  };

  return (
    <AppShell>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500">Calendar</p>
            <h1 className="text-2xl font-bold text-slate-900">{label}</h1>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() =>
                setMonthDate(
                  new Date(monthDate.getFullYear(), monthDate.getMonth() - 1, 1)
                )
              }
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700"
            >
              Prev
            </button>

            <button
              onClick={() =>
                setMonthDate(
                  new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 1)
                )
              }
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700"
            >
              Next
            </button>
          </div>
        </div>

        <CalendarGrid
          monthDate={monthDate}
          logs={logs}
          tasks={tasks}
          events={events}
          onDayClick={(dateKey) => {
            setSelectedDate(dateKey);
            setTitle("");
            setEditingEvent(null);
          }}
        />
      </div>

      <Modal
        open={!!selectedDate}
        title={selectedDate ?? ""}
        onClose={() => {
          setSelectedDate(null);
          setTitle("");
          setEditingEvent(null);
        }}
      >
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Add / Edit schedule
            </label>

            <div className="flex gap-2">
              <input
                className="min-w-0 flex-1 rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-900"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="予定タイトル"
              />

              <button
                onClick={saveEvent}
                className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-medium text-white"
              >
                {editingEvent ? "Update" : "Add"}
              </button>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-900">Schedules</h3>

            {selectedEvents.length === 0 ? (
              <p className="mt-2 text-sm text-slate-500">予定はありません。</p>
            ) : (
              <div className="mt-2 space-y-2">
                {selectedEvents.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 p-3"
                  >
                    <div className="truncate text-sm text-slate-700">
                      {event.title}
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingEvent(event);
                          setTitle(event.title);
                        }}
                        className="text-xs text-slate-500"
                      >
                        Edit
                      </button>

                      <button
                        onClick={() => deleteCalendarEvent(event.id)}
                        className="text-xs text-rose-500"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-900">Tasks</h3>

            {selectedTasks.length === 0 ? (
              <p className="mt-2 text-sm text-slate-500">タスクはありません。</p>
            ) : (
              <div className="mt-2 space-y-2">
                {selectedTasks.map((task) => (
                  <div
                    key={task.id}
                    className="rounded-2xl border border-slate-200 p-3"
                  >
                    <div className="truncate text-sm font-medium text-slate-900">
                      {task.title}
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      {task.task_type === "initial" ? "Initial" : "Added"} /{" "}
                      {task.estimated_minutes}m
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {selectedDate ? (
            <Link
              href={`/report/${selectedDate}`}
              className="block rounded-2xl bg-slate-900 px-4 py-3 text-center text-sm font-medium text-white"
            >
              View Report
            </Link>
          ) : null}
        </div>
      </Modal>
    </AppShell>
  );
}