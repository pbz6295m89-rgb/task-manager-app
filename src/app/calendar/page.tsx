"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { CalendarGrid } from "@/components/CalendarGrid";
import { Modal } from "@/components/Modal";
import { monthLabel } from "@/lib/date";
import type { CalendarEvent } from "@/lib/types";
import { useAppStore } from "@/store/useAppStore";

export default function CalendarPage() {
  const router = useRouter();

  const [monthDate, setMonthDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [reportLoading, setReportLoading] = useState(false);

  const refreshMonth = useAppStore((s) => s.refreshMonth);
  const logs = useAppStore((s) => s.logs);
  const events = useAppStore((s) => s.calendarEvents);
  const addCalendarEvent = useAppStore((s) => s.addCalendarEvent);
  const updateCalendarEvent = useAppStore((s) => s.updateCalendarEvent);
  const deleteCalendarEvent = useAppStore((s) => s.deleteCalendarEvent);
  const prepareDailyReport = useAppStore((s) => s.prepareDailyReport);

  useEffect(() => {
    refreshMonth(monthDate);
  }, [monthDate, refreshMonth]);

  const label = useMemo(() => monthLabel(monthDate), [monthDate]);

  const selectedEvents = useMemo(() => {
    if (!selectedDate) return [];
    return events.filter((event) => event.event_date === selectedDate);
  }, [events, selectedDate]);

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

  const openReport = async () => {
    if (!selectedDate) return;

    setReportLoading(true);

    const date = await prepareDailyReport(selectedDate);

    setReportLoading(false);

    if (date) {
      router.push(`/report/${date}`);
    }
  };

  return (
    <AppShell>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500">カレンダー</p>
            <h1 className="text-2xl font-bold text-slate-900">{label}</h1>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() =>
                setMonthDate(
                  new Date(monthDate.getFullYear(), monthDate.getMonth() - 1, 1)
                )
              }
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition active:bg-emerald-100"
            >
              前月
            </button>

            <button
              onClick={() =>
                setMonthDate(
                  new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 1)
                )
              }
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition active:bg-emerald-100"
            >
              次月
            </button>
          </div>
        </div>

        <CalendarGrid
          monthDate={monthDate}
          logs={logs}
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
              予定を追加・編集
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
                className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition active:bg-emerald-600 active:scale-[0.98]"
              >
                {editingEvent ? "更新" : "追加"}
              </button>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-900">予定</h3>

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
                        className="text-xs text-slate-500 active:text-emerald-600"
                      >
                        編集
                      </button>

                      <button
                        onClick={() => deleteCalendarEvent(event.id)}
                        className="text-xs text-rose-500 active:text-rose-700"
                      >
                        削除
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={openReport}
            disabled={reportLoading}
            className="block w-full rounded-2xl bg-slate-900 px-4 py-3 text-center text-sm font-medium text-white transition active:bg-emerald-600 active:scale-[0.98] disabled:opacity-50"
          >
            {reportLoading ? "レポート作成中..." : "レポートを見る"}
          </button>
        </div>
      </Modal>
    </AppShell>
  );
}