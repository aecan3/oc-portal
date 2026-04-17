import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import OCBankFeedSnapshot, { type TransactionFeedRow } from "../components/OCBankFeedSnapshot";
import { MOCK_TOTAL_BANK_BALANCE, MOCK_TRANSACTIONS } from "@/lib/mockFinancialData";
import { getSupabaseProjectConfig } from "@/lib/supabase";
import RecordsAccessCard from "./RecordsAccessCard";

/** Placeholder close (Melbourne) until resolutions are loaded from the database. */
const VOTE_CLOSES_AT = new Date("2026-05-22T23:59:59+10:00");

function formatResolutionCloseDate(d: Date) {
  return d.toLocaleDateString("en-AU", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Australia/Melbourne",
  });
}

function voteDeadlineSummary(now: Date) {
  const closeMs = VOTE_CLOSES_AT.getTime();
  const nowMs = now.getTime();
  const datePart = formatResolutionCloseDate(VOTE_CLOSES_AT);
  if (nowMs >= closeMs) {
    return `Closed (${datePart})`;
  }
  const daysRemaining = Math.ceil((closeMs - nowMs) / 86_400_000);
  if (daysRemaining <= 0) {
    return `Closes today (${datePart})`;
  }
  if (daysRemaining === 1) {
    return `Closes in 1 day (${datePart})`;
  }
  return `Closes in ${daysRemaining} days (${datePart})`;
}

export default async function DashboardView() {
  const cookieStore = await cookies();

  let totalBankBalance: number | null = MOCK_TOTAL_BANK_BALANCE;
  let transactions: TransactionFeedRow[] = MOCK_TRANSACTIONS;

  let supabaseConfig: ReturnType<typeof getSupabaseProjectConfig> | null = null;
  try {
    supabaseConfig = getSupabaseProjectConfig();
  } catch {
    supabaseConfig = null;
  }

  if (supabaseConfig) {
    const supabase = createServerClient(supabaseConfig.url, supabaseConfig.anonKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet, _headers) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Server Components cannot mutate cookies during render.
          }
        },
      },
    });

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      console.log("Supabase auth.getUser error:", userError);
    }

    if (!user) {
      redirect("/login");
    }

  }

  const hasLiveBalance = totalBankBalance !== null;
  const voteUrgencyLine = voteDeadlineSummary(new Date());
  const recentActivity = MOCK_TRANSACTIONS.slice(0, 3);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <main className="mx-auto w-full max-w-6xl px-6 py-8 sm:px-10 lg:px-12">
        {!hasLiveBalance ? (
          <div className="mb-6">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#2DD4BF]/40 bg-[#2DD4BF]/10 px-3 py-1 text-xs font-semibold text-[#0F766E]">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#2DD4BF] opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#2DD4BF]" />
              </span>
              Syncing with Supabase
            </span>
          </div>
        ) : null}

        <section className="mb-8 grid grid-cols-1 gap-6 xl:grid-cols-2">
          <div className="space-y-6">
            <article className="self-start rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm sm:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Next Levy Due</p>
              <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">Balance Due: $485.00</h1>
              <p className="mt-2 text-sm font-medium text-slate-600">Your next levy is due in 7 days.</p>

              <div className="mt-4 flex w-full flex-col gap-3 md:w-auto md:flex-row">
                  <Link
                    href="/payment"
                    className="inline-flex min-h-[2.75rem] w-full items-center justify-center rounded-xl bg-[#4F46E5] px-5 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#4338CA] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4F46E5] focus-visible:ring-offset-2 md:w-auto md:min-w-[10rem]"
                  >
                    Pay Levy
                  </Link>
                  <Link
                    href="/direct-debit"
                    className="inline-flex min-h-[2.75rem] w-full items-center justify-center rounded-xl border-2 border-indigo-600 bg-white px-5 py-3.5 text-sm font-semibold text-indigo-600 shadow-sm transition hover:bg-indigo-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 md:w-auto md:min-w-[10rem]"
                  >
                    Set up Direct Debit
                  </Link>
              </div>
              <Link
                href="/my-account"
                className="mt-4 text-center text-sm font-semibold text-indigo-600 underline decoration-indigo-600/35 underline-offset-4 transition hover:text-indigo-700 sm:text-left"
              >
                View My Account &amp; History
              </Link>
            </article>

            <article className="rounded-2xl border border-white/60 bg-white/80 p-6 shadow-sm backdrop-blur">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Voting</p>
              <h2 className="mt-4 text-2xl font-extrabold text-slate-900">1 Active Resolution</h2>
              <p className="mt-2 text-sm font-semibold text-amber-900">{voteUrgencyLine}</p>
              <p className="mt-2 text-base font-semibold text-slate-800">Fence Repair</p>
              <p className="mt-2 inline-flex rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600">
                Ordinary Resolution (Requires 50% majority)
              </p>
              <Link
                href="/vote"
                className="mt-6 inline-flex items-center justify-center rounded-lg bg-[#4F46E5] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#4338CA] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4F46E5] focus-visible:ring-offset-2"
              >
                Vote
              </Link>
            </article>
          </div>

          <OCBankFeedSnapshot
            transactions={transactions}
            hasLiveBalance={hasLiveBalance}
            totalBankBalance={totalBankBalance}
          />
        </section>

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <RecordsAccessCard />

          <article className="rounded-2xl border border-white/60 bg-white/80 p-6 shadow-sm backdrop-blur">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Live Feed</p>
            <h2 className="mt-4 text-2xl font-extrabold text-slate-900">Recent Activity</h2>
            <ul className="mt-4 space-y-4 text-sm text-slate-700">
              {recentActivity.map((tx) => (
                <li key={tx.id} className="flex items-start justify-between rounded-lg border border-slate-200 bg-white px-4 py-3">
                  <span>{tx.description}</span>
                  <span
                    className={`ml-3 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                      tx.type === "Credit" ? "bg-[#2DD4BF]/20 text-[#0F766E]" : "bg-red-100 text-red-700"
                    }`}
                  >
                    {tx.type === "Credit" ? "+" : "-"}
                    ${tx.amount.toFixed(2)}
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-4 rounded-lg border border-[#8B4513]/30 bg-[#8B4513]/10 px-4 py-3 text-xs font-semibold text-[#8B4513]">
              Urgent: Quarterly levy cutoff in 2 days.
            </div>
          </article>
        </section>
      </main>
    </div>
  );
}
