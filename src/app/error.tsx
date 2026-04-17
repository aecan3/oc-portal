"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 px-6 font-sans text-slate-900">
      <p className="text-lg font-semibold">Something went wrong</p>
      <p className="max-w-md text-center text-sm text-slate-600">{error.message}</p>
      <button
        type="button"
        onClick={() => reset()}
        className="rounded-xl bg-[#4F46E5] px-4 py-2 text-sm font-semibold text-white hover:bg-[#4338CA]"
      >
        Try again
      </button>
    </div>
  );
}
