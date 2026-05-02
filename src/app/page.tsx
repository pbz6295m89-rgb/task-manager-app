import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-medium text-slate-500">Time management, but gamified.</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
          Task Time App
        </h1>
        <p className="mt-4 leading-7 text-slate-600">
          タスクを追加し、1つだけタイマーを動かし、業務終了でレポート化して、カレンダーで振り返る。
        </p>

        <div className="mt-8 grid gap-3">
          <Link
            href="/auth"
            className="rounded-2xl bg-slate-900 px-4 py-3 text-center text-sm font-medium text-white"
          >
            Sign in
          </Link>
          <Link
            href="/dashboard"
            className="rounded-2xl border border-slate-200 px-4 py-3 text-center text-sm font-medium text-slate-700"
          >
            Open app
          </Link>
        </div>
      </div>
    </main>
  );
}