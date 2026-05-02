"use client";

type Props = {
  estimatedMinutes: number;
  elapsedSeconds: number;
};

export function TaskProgressRing({ estimatedMinutes, elapsedSeconds }: Props) {
  const estimatedSeconds = Math.max(1, estimatedMinutes * 60);
  const ratio = elapsedSeconds / estimatedSeconds;
  const clamped = Math.min(ratio, 1.25);
  const degrees = clamped * 360;

  const color =
    ratio < 0.8 ? "#16a34a" : ratio <= 1 ? "#ca8a04" : "#dc2626";

  return (
    <div
      className="relative h-14 w-14 rounded-full"
      style={{
        background: `conic-gradient(${color} 0deg ${degrees}deg, #e5e7eb ${degrees}deg 360deg)`,
      }}
    >
      <div className="absolute inset-1 flex items-center justify-center rounded-full bg-white text-[10px] font-semibold text-slate-700">
        {Math.round(ratio * 100)}%
      </div>
    </div>
  );
}