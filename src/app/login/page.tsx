"use client";

import Link from "next/link";
import { createBrowserSupabaseClient } from "@/lib/supabase";
import { roleHomePath, resolveUserRole } from "@/lib/userRole";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const supabase = useMemo(() => {
    try {
      return createBrowserSupabaseClient();
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    if (!supabase) {
      return;
    }

    const checkSession = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const role = await resolveUserRole(supabase, user.id);
        router.replace(roleHomePath(role));
      }
    };

    void checkSession();
  }, [router, supabase]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");

    if (!supabase) {
      setErrorMessage("Supabase environment variables are missing.");
      return;
    }

    setIsSubmitting(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setIsSubmitting(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    const {
      data: { user: authedUser },
    } = await supabase.auth.getUser();
    if (!authedUser) {
      setErrorMessage("Unable to resolve user session after sign in.");
      return;
    }

    const role = await resolveUserRole(supabase, authedUser.id);
    router.replace(roleHomePath(role));
    router.refresh();
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-12 font-sans text-slate-900">
      <div className="w-full max-w-md rounded-3xl border border-white/70 bg-white/90 p-8 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur sm:p-10">
        <div className="mb-8 space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Secure Access</p>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Welcome to OC Portal</h1>
          <p className="text-sm text-slate-600">Sign in to access your owner dashboard and live OC financial data.</p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-semibold text-slate-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#4F46E5] focus:ring-4 focus:ring-[#4F46E5]/10 sm:text-sm"
              placeholder="alex@example.com"
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-semibold text-slate-700">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#4F46E5] focus:ring-4 focus:ring-[#4F46E5]/10 sm:text-sm"
              placeholder="Enter your password"
              required
            />

            <button
              type="button"
              onClick={() =>
                router.push(
                  `/login/forgot-password?email=${encodeURIComponent(email)}`
                )
              }
              className="mt-1 w-fit text-left text-sm font-semibold text-[#4F46E5] transition hover:text-[#4338CA]"
            >
              Forgot password?
            </button>
          </div>

          {errorMessage ? (
            <div className="rounded-xl border border-[#8B4513]/20 bg-[#8B4513]/5 px-4 py-3 text-sm font-medium text-[#8B4513]">
              {errorMessage}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex w-full items-center justify-center rounded-xl bg-[#4F46E5] px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-[#4338CA] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? "Signing In..." : "Sign In"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600">
          New to OC Portal?{" "}
          <Link
            href="/signup"
            className="font-semibold text-[#4F46E5] underline decoration-[#4F46E5]/30 underline-offset-4 hover:text-[#4338CA]"
          >
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
