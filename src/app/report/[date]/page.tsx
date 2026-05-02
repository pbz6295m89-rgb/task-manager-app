"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/lib/supabase";
import type { DailyLog, DailyReport } from "@/lib/types";
import { buildDailyReportText } from "@/lib/report";
import { formatClock } from "@/lib/date";

export default function ReportPage() {
  const params = useParams<{ date: string }>();
  const date = params.date;

  const [log, setLog] = useState<DailyLog | null>(null);
  const [report, setReport] = useState<DailyReport | null>(null);
  const [recipient, setRecipient] = useState("");
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("daily_logs")
        .select("*")
        .eq("log_date", date)
        .maybeSingle();

      if (data) {
        const typed = data as DailyLog;
        setLog(typed);
        setReport(typed.report_json);
      }
    };

    load();
  }, [date]);

  const reportText = useMemo(() => {
    if (!report) return "";
    return buildDailyReportText(report);
  }, [report]);

  const save = async () => {
    if (!report) return;
    setSaving(true);
    setStatus("");

    const { error } = await supabase
      .from("daily_logs")
      .update({
        report_json: report,
        score: report.score,
        updated_at: new Date().toISOString(),
      })
      .eq("log_date", date);

    if (error) {
      setStatus(error.message);
      setSaving(false);
      return;
    }

    for (const task of report.tasks) {
      await supabase
        .from("tasks")
        .update({
          result_memo: task.reason,
          updated_at: new Date().toISOString(),
        })
        .eq("id", task.task_id);
    }

    setStatus("Saved.");
    setSaving(false);
  };

  const copy = async () => {
    if (!reportText) return;
    await navigator.clipboard.writeText(reportText);
    setStatus("Copied to clipboard.");
  };

  const sendEmail = async () => {
    if (!reportText || !recipient.trim()) {
      setStatus("Enter recipient email.");
      return;
    }

    setSaving(true);
    setStatus("");

    const res = await fetch("/api/send-report", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: recipient.trim(),
        subject: `Daily report ${date}`,
        text: reportText,
      }),
    });

    const data = await res.json();
    setStatus(data.message ?? (res.ok ? "Email sent." : "Failed to send email."));
    setSaving(false);
  };

  return (
    <AppShell>
      <div className="space-y-5">
        <div className="rounded-3xl bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Daily report</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">{date}</h1>

          {report ? (
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="text-xs text-slate-500">Score</div>
                <div className="mt-1 text-2xl font-bold text-emerald-600">{report.score}</div>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="text-xs text-slate-500">Actual total</div>
                <div className="mt-1 text-2xl font-bold text-slate-900">
                  {formatClock(report.total_actual_seconds)}
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-4 text-slate-500">No report yet.</div>
          )}
        </div>

        {report ? (
          <div className="space-y-3">
            {report.tasks.map((task, index) => (
              <div key={task.task_id} className="rounded-3xl bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-sm font-semibold text-slate-900">
                      {index + 1}. {task.title}
                    </div>
                    <div className="mt-1 text-sm text-slate-500">
                      Plan {task.estimated_minutes}m / Actual {Math.round(task.actual_seconds / 60)}m / {task.status}
                    </div>
                  </div>
                </div>

                <textarea
                  className="mt-4 min-h-28 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-900"
                  value={task.reason}
                  onChange={(e) => {
                    setReport((prev) => {
                      if (!prev) return prev;
                      return {
                        ...prev,
                        tasks: prev.tasks.map((item) =>
                          item.task_id === task.task_id ? { ...item, reason: e.target.value } : item
                        ),
                      };
                    });
                  }}
                  placeholder="できなかった理由、差が出た理由を書く"
                />
              </div>
            ))}

            <div className="rounded-3xl bg-white p-5 shadow-sm">
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Reflection memo
              </label>
              <textarea
                className="min-h-28 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-900"
                value={report.overall_memo}
                onChange={(e) =>
                  setReport((prev) => (prev ? { ...prev, overall_memo: e.target.value } : prev))
                }
                placeholder="今日の振り返り"
              />
            </div>

            <div className="rounded-3xl bg-white p-5 shadow-sm">
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Send report by email
              </label>
              <input
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-900"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="boss@example.com"
              />

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  onClick={save}
                  disabled={saving}
                  className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-medium text-white disabled:opacity-50"
                >
                  Save
                </button>

                <button
                  onClick={copy}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700"
                >
                  Copy
                </button>

                <button
                  onClick={sendEmail}
                  disabled={saving}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 disabled:opacity-50"
                >
                  Send Email
                </button>
              </div>

              {status ? <p className="mt-3 text-sm text-slate-500">{status}</p> : null}
            </div>
          </div>
        ) : null}

        {log && !report ? (
          <div className="rounded-3xl bg-white p-5 shadow-sm">
            <div className="text-sm text-slate-500">Found log, but report JSON is empty.</div>
          </div>
        ) : null}
      </div>
    </AppShell>
  );
}