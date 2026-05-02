"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [message, setMessage] = useState("Signing you in...");

  useEffect(() => {
    const run = async () => {
      const url = new URL(window.location.href);
      const code = url.searchParams.get("code");

      if (!code) {
        setMessage("Missing code.");
        return;
      }

      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        setMessage(error.message);
        return;
      }

      router.replace("/dashboard");
    };

    run();
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="rounded-3xl border border-slate-200 bg-white px-6 py-8 text-slate-600 shadow-sm">
        {message}
      </div>
    </main>
  );
}