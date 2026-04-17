"use client";

import { createBrowserSupabaseClient } from "@/lib/supabase";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

export default function ForgotPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailFromQuery = searchParams.get("email") ?? "";

  const supabase = useMemo(() => {
    try {
      return createBrowserSupabaseClient();
    } catch {
      return null;
    }
  }, []);

  const [resetEmail, setResetEmail] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    setResetEmail(emailFromQuery);
  }, [emailFromQuery]);

  const onSendResetLink = async () => {
    setErrorMessage("");
    setSuccessMessage("");

    if (!supabase) {
      setErrorMessage("Supabase environment variables are missing.");
      return;
    }

    const trimmed = resetEmail.trim();
    if (!trimmed) {
      setErrorMessage("Please enter your email.");
      return;
    }

    setIsSending(true);

    const { error } = await supabase.auth.resetPasswordForEmail(trimmed, {
      redirectTo: `${window.location.origin}/login`,
    });

    setIsSending(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setSuccessMessage("Reset link sent. Check your inbox.");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-12 font-sans text-slate-900">
      <div className="w-full max-w-md rounded-3xl border border-white/70 bg-white/90 p-8 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur sm:p-10">
        <div className="mb-8 space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
            Password Reset
          </p>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
            Forgot your password?
          </h1>
          <p className="text-sm text-slate-600">
            Enter your email and we’ll send a reset link.
          </p>
        </div>

        <div className="space-y-5">
          <div className="space-y-2">
            <label htmlFor="reset-email" className="text-sm font-semibold text-slate-700">
              Email
            </label>
            <input
              id="reset-email"
              type="email"
              autoComplete="email"
              value={resetEmail}
              onChange={(event) => setResetEmail(event.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#4F46E5] focus:ring-4 focus:ring-[#4F46E5]/10"
              placeholder="alex@example.com"
              required
            />
          </div>

          {errorMessage ? (
            <div className="rounded-xl border border-[#8B4513]/20 bg-[#8B4513]/5 px-4 py-3 text-sm font-medium text-[#8B4513]">
              {errorMessage}
            </div>
          ) : null}

          {successMessage ? (
            <div className="rounded-xl border border-[#2DD4BF]/40 bg-[#2DD4BF]/10 px-4 py-3 text-sm font-semibold text-[#0F766E]">
              {successMessage}
            </div>
          ) : null}

          <button
            type="button"
            onClick={() => void onSendResetLink()}
            disabled={isSending}
            className="inline-flex w-full items-center justify-center rounded-xl bg-[#4F46E5] px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-[#4338CA] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSending ? "Sending..." : "Send Reset Link"}
          </button>

          <button
            type="button"
            onClick={() => router.replace("/login")}
            className="inline-flex w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
          >
            Back to Sign In
          </button>
        </div>
      </div>
    </div>
  );
}
