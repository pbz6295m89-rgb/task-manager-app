"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { CalendarDays, LayoutDashboard, LogOut } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";

export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const userId = useAppStore((s) => s.userId);
  const userEmail = useAppStore((s) => s.userEmail);
  const loading = useAppStore((s) => s.loading);
  const initialized = useAppStore((s) => s.initialized);
  const init = useAppStore((s) => s.init);
  const signOut = useAppStore((s) => s.signOut);

  useEffect(() => {
    init();
  }, [init]);

  useEffect(() => {
    if (
      initialized &&
      !loading &&
      !userId &&
      pathname !== "/auth" &&
      pathname !== "/auth/callback"
    ) {
      router.replace("/auth");
    }
  }, [initialized, loading, userId, pathname, router]);

  if (!initialized || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-500">
        Loading...
      </div>
    );
  }

  if (!userId) return null;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div>
            <div className="text-xs text-slate-500">Signed in as</div>
            <div className="text-sm font-medium">{userEmail}</div>
          </div>

          <button
            onClick={async () => {
              await signOut();
              router.replace("/auth");
            }}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-24 pt-5">{children}</main>

      <nav className="fixed bottom-0 left-0 right-0 border-t border-slate-200 bg-white">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-2 px-2 py-2 text-sm">
          <Link
            href="/dashboard"
            className={`flex flex-col items-center gap-1 rounded-2xl px-3 py-2 ${
              pathname === "/dashboard"
                ? "bg-slate-900 text-white"
                : "text-slate-500"
            }`}
          >
            <LayoutDashboard className="h-4 w-4" />
            Today
          </Link>

          <Link
            href="/calendar"
            className={`flex flex-col items-center gap-1 rounded-2xl px-3 py-2 ${
              pathname === "/calendar"
                ? "bg-slate-900 text-white"
                : "text-slate-500"
            }`}
          >
            <CalendarDays className="h-4 w-4" />
            Calendar
          </Link>
        </div>
      </nav>
    </div>
  );
}