"use client";

import Link from "next/link";
import { createBrowserSupabaseClient } from "@/lib/supabase";
import { roleHomePath, resolveUserRole } from "@/lib/userRole";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";

export default function SignUpPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const supabase = useMemo(() => {
    try {
      return createBrowserSupabaseClient();
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    if (!supabase) return;

    const checkSession = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const role = await resolveUserRole(supabase, user.id);
        if (role === "unknown") {
          router.replace("/signup/profile");
        } else {
          router.replace(roleHomePath(role));
        }
      }
    };

    void checkSession();
  }, [router, supabase]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!supabase) {
      setErrorMessage("Supabase environment variables are missing.");
      return;
    }

    setIsSubmitting(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    setIsSubmitting(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    if (data.session) {
      const {
        data: { user: authedUser },
      } = await supabase.auth.getUser();
      if (!authedUser) {
        setErrorMessage("Unable to resolve user session after sign up.");
        return;
      }
      router.push("/signup/profile");
      router.refresh();
      return;
    }

    setSuccessMessage(
      "Check your email to confirm your account before signing in. If email confirmation is disabled, you can sign in now.",
    );
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-12 font-sans text-slate-900">
      <div className="w-full max-w-md rounded-3xl border border-white/70 bg-white/90 p-8 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur sm:p-10">
        <div className="mb-8 space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Create account</p>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Join OC Portal</h1>
          <p className="text-sm text-slate-600">Sign up to access your owner dashboard and OC records.</p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label htmlFor="signup-email" className="text-sm font-semibold text-slate-700">
              Email
            </label>
            <input
              id="signup-email"
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
            <label htmlFor="signup-password" className="text-sm font-semibold text-slate-700">
              Password
            </label>
            <input
              id="signup-password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#4F46E5] focus:ring-4 focus:ring-[#4F46E5]/10 sm:text-sm"
              placeholder="Choose a strong password"
              required
              minLength={6}
            />
          </div>

          {errorMessage ? (
            <div className="rounded-xl border border-[#8B4513]/20 bg-[#8B4513]/5 px-4 py-3 text-sm font-medium text-[#8B4513]">
              {errorMessage}
            </div>
          ) : null}

          {successMessage ? (
            <div className="rounded-xl border border-[#2DD4BF]/30 bg-[#2DD4BF]/10 px-4 py-3 text-sm font-medium text-[#0F766E]">
              {successMessage}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex w-full items-center justify-center rounded-xl bg-[#4F46E5] px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-[#4338CA] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? "Creating account…" : "Sign Up"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-[#4F46E5] underline decoration-[#4F46E5]/30 underline-offset-4 hover:text-[#4338CA]">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
