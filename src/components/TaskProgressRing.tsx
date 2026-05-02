"use client";

import { formatClock } from "@/lib/date";

type Props = {
  estimatedMinutes: number;
  elapsedSeconds: number;
};

export function TaskProgressRing({ estimatedMinutes, elapsedSeconds }: Props) {
  const estimatedSeconds = Math.max(1, estimatedMinutes * 60);
  const remainingSeconds = estimatedSeconds - elapsedSeconds;
  const isOver = remainingSeconds < 0;

  const ratio = Math.min(Math.abs(remainingSeconds) / estimatedSeconds, 1);
  const degrees = ratio * 360;

  const background = isOver
    ? `conic-gradient(#dc2626 0deg ${degrees}deg, #e5e7eb ${degrees}deg 360deg)`
    : `conic-gradient(#16a34a 0deg ${degrees}deg, #e5e7eb ${degrees}deg 360deg)`;

  return (
    <div
      className="relative h-16 w-16 rounded-full shrink-0"
      style={{ background }}
    >
      <div className="absolute inset-1 flex flex-col items-center justify-center rounded-full bg-white px-1 text-center">
        <div
          className={`text-[10px] font-semibold ${
            isOver ? "text-rose-600" : "text-emerald-600"
          }`}
        >
          {isOver ? "Over" : "Left"}
        </div>
        <div className="text-[10px] font-bold text-slate-800">
          {formatClock(Math.abs(remainingSeconds))}
        </div>
      </div>
    </div>
  );
}