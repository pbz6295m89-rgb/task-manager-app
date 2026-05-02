import {
  addDays,
  endOfMonth,
  format,
  startOfMonth,
  startOfWeek,
} from "date-fns";

export function todayKey(date = new Date()) {
  return format(date, "yyyy-MM-dd");
}

export function formatClock(seconds: number) {
  const safe = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const secs = safe % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs.toString().padStart(2, "0")}s`;
  }
  return `${minutes}m ${secs.toString().padStart(2, "0")}s`;
}

export function formatShortMinutes(seconds: number) {
  return `${Math.round(seconds / 60)}m`;
}

export function monthLabel(date: Date) {
  return format(date, "MMMM yyyy");
}

export function buildMonthGrid(date: Date) {
  const start = startOfWeek(startOfMonth(date), { weekStartsOn: 0 });
  const end = startOfWeek(endOfMonth(date), { weekStartsOn: 0 });

  const days: Date[] = [];
  let current = start;

  while (current <= end || days.length < 42) {
    days.push(current);
    current = addDays(current, 1);
  }

  return days;
}