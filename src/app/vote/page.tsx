"use client";

import Link from "next/link";
import { FileText } from "lucide-react";
import { useState } from "react";

type VoteChoice = "Approve" | "Reject" | "Abstain";

const formatTimestamp = (value: Date) =>
  new Intl.DateTimeFormat("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "Australia/Melbourne",
  }).format(value);

export default function VotePage() {
  const [recordedVote, setRecordedVote] = useState<VoteChoice | null>(null);
  const [recordedAt, setRecordedAt] = useState<Date | null>(null);

  const castVote = (choice: VoteChoice) => {
    setRecordedVote(choice);
    setRecordedAt(new Date());
  };

  return (
    <main className="min-h-[calc(100vh-3.5rem)] bg-slate-50 pb-14 font-sans text-slate-900">
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <Link
          href="/dashboard"
          className="inline-flex text-sm font-semibold text-indigo-600 underline decoration-indigo-600/30 underline-offset-4 transition hover:text-indigo-700"
        >
          Back to dashboard
        </Link>

        {/* 1) Header Section */}
        <section className="mt-6 rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
              Resolution 2026-01: Boundary Fence Repair
            </h1>
            <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-emerald-700">
              OPEN
            </span>
          </div>
          <p className="mt-4 rounded-xl border border-amber-200/90 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
            Voting closes: 22 May 2026 at 5:00 PM AEST (14-day statutory notice).
          </p>
        </section>

        {/* 2) Resolution Details */}
        <section className="mt-6 rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Resolution Details</h2>
          <p className="mt-4 text-sm font-medium leading-6 text-slate-700 sm:text-base">
            The timber boundary fence on the eastern property line was damaged in recent storms and requires immediate
            replacement.
          </p>
          <p className="mt-4 text-sm font-semibold text-slate-800">
            Estimated Timeline: <span className="font-medium text-slate-700">Works to take 3 days, commencing June 15th.</span>
          </p>
        </section>

        {/* 3) Financial Impact & Docs */}
        <section className="mt-6 rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Financial Impact &amp; Supporting Docs</h2>
          <div className="mt-4 space-y-2 text-sm sm:text-base">
            <p className="font-semibold text-slate-800">
              Total Project Cost: <span className="font-extrabold text-slate-900">$4,200.00</span>
            </p>
          </div>

          <div className="mt-4 rounded-xl border border-indigo-200 bg-indigo-50/80 px-4 py-3">
            <p className="text-sm font-semibold text-indigo-900">Your Share: $1,050.00 - Billed in Q3 Levy</p>
          </div>

          <div className="mt-5">
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-xl border-2 border-indigo-600 bg-white px-4 py-2.5 text-sm font-semibold text-indigo-600 shadow-sm transition hover:bg-indigo-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
            >
              <FileText className="size-4" aria-hidden />
              View Contractor Quote
            </button>
          </div>
        </section>

        {/* 4) CAV Compliance Box */}
        <section className="mt-6 rounded-xl border border-slate-200 bg-slate-100/80 px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Legal Context</p>
          <p className="mt-1 text-sm font-medium text-slate-700">
            This is an Ordinary Resolution under the Owners Corporations Act 2006. It requires a majority (&gt;50%) of total
            lot entitlements to pass.
          </p>
        </section>

        {/* 5) Voting Mechanism */}
        <section className="mt-6 rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Your Vote</h2>
          <p className="mt-3 text-sm font-semibold text-slate-700">Cast your vote based on your lot liability:</p>

          {recordedVote ? (
            <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-4">
              <p className="text-sm font-bold text-emerald-800">Vote Recorded: {recordedVote}</p>
              <p className="mt-1 text-xs font-medium text-emerald-700">
                Recorded at {recordedAt ? formatTimestamp(recordedAt) : "just now"}
              </p>
            </div>
          ) : (
            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <button
                type="button"
                onClick={() => castVote("Approve")}
                className="inline-flex min-h-[2.75rem] items-center justify-center rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
              >
                Approve
              </button>
              <button
                type="button"
                onClick={() => castVote("Reject")}
                className="inline-flex min-h-[2.75rem] items-center justify-center rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
              >
                Reject
              </button>
              <button
                type="button"
                onClick={() => castVote("Abstain")}
                className="inline-flex min-h-[2.75rem] items-center justify-center rounded-xl bg-slate-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"
              >
                Abstain
              </button>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
