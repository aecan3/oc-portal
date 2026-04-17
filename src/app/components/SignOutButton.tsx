"use client";

import { createBrowserSupabaseClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

export default function SignOutButton() {
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const supabase = useMemo(() => {
    try {
      return createBrowserSupabaseClient();
    } catch {
      return null;
    }
  }, []);

  const onSignOut = async () => {
    if (!supabase || isSigningOut) return;

    setIsSigningOut(true);

    const { error } = await supabase.auth.signOut();
    if (error) {
      // Intentionally log so it shows in the terminal for debugging.
      console.log("Supabase signOut error:", error);
    }

    router.replace("/login");
    router.refresh();
  };

  return (
    <button
      type="button"
      onClick={() => void onSignOut()}
      disabled={!supabase || isSigningOut}
      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-transparent px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4F46E5]/20"
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className="text-slate-600"
      >
        <path
          d="M10 16.5V17.5C10 18.6046 10.8954 19.5 12 19.5H18C19.1046 19.5 20 18.6046 20 17.5V6.5C20 5.39543 19.1046 4.5 18 4.5H12C10.8954 4.5 10 5.39543 10 6.5V7.5"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <path
          d="M15 12H3"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <path
          d="M6 9L3 12L6 15"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {isSigningOut ? "Signing out" : "Sign Out"}
    </button>
  );
}

