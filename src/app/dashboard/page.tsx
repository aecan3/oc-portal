"use client";

import Link from "next/link";
import { AlertCircle, ArrowDownRight, ArrowRight, ArrowUpRight, FileSignature, Users } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import OCBankFeedSnapshot, { type TransactionFeedRow } from "../components/OCBankFeedSnapshot";
import RecordsAccessCard from "./RecordsAccessCard";
import { Button } from "@/components/ui/button";
import { MOCK_TOTAL_BANK_BALANCE, MOCK_TRANSACTIONS } from "@/lib/mockFinancialData";
import { createBrowserSupabaseClient } from "@/lib/supabase";

type PropertyRecord = {
  id: string;
  address: string;
  plan_number: string;
  total_lots: number;
  total_bank_balance: number | null;
  manager_id: string | null;
  created_at: string;
};

type PendingRequest = {
  id: string;
  user_id: string;
  property_id: string;
  status: string;
  properties: {
    address: string;
    plan_number: string;
  } | null;
};

type UnitLevyStatus = {
  unitNumber: number;
  amountDue: number;
  dueDate: string;
  paid: boolean;
};

const VOTE_CLOSES_AT = new Date("2026-05-22T23:59:59+10:00");
const LEVY_DUE_DATE = "31 Oct 2025";
const LEVY_AMOUNT_PER_UNIT = 485;

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
  if (nowMs >= closeMs) return `Closed (${datePart})`;
  const daysRemaining = Math.ceil((closeMs - nowMs) / 86_400_000);
  if (daysRemaining <= 0) return `Closes today (${datePart})`;
  if (daysRemaining === 1) return `Closes in 1 day (${datePart})`;
  return `Closes in ${daysRemaining} days (${datePart})`;
}

export default function SecretaryDashboardPage() {
  const router = useRouter();
  const supabase = useMemo(() => {
    try {
      return createBrowserSupabaseClient();
    } catch {
      return null;
    }
  }, []);

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [activeProperty, setActiveProperty] = useState<PropertyRecord | null>({
    id: "mock-property",
    address: "8 Castles Road, Bentleigh VIC 3204",
    plan_number: "PS932358G",
    total_lots: 3,
    total_bank_balance: MOCK_TOTAL_BANK_BALANCE,
    manager_id: null,
    created_at: "2025-10-14T00:00:00Z",
  });
  const [transactions] = useState<TransactionFeedRow[]>(MOCK_TRANSACTIONS);
  const [isManager, setIsManager] = useState(false);
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);

  const fetchPendingRequests = useCallback(
    async (managedPropertyIds: string[]) => {
      if (!supabase) return;
      if (managedPropertyIds.length === 0) {
        setPendingRequests([]);
        return;
      }

      const { data: pendingData, error: requestsError } = await supabase
        .from("join_requests")
        .select("id,user_id,status,property_id,properties!inner(address, plan_number)")
        .in("property_id", managedPropertyIds)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (requestsError) {
        setErrorMessage(requestsError.message);
        return;
      }

      const pendingRows = (pendingData ?? []) as PendingRequest[];
      setPendingRequests(pendingRows);
    },
    [supabase],
  );

  useEffect(() => {
    if (!supabase) {
      setErrorMessage("Supabase environment variables are missing.");
      setLoading(false);
      return;
    }

    let cancelled = false;

    const loadDashboard = async () => {
      setLoading(true);
      setErrorMessage("");

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (cancelled) return;
      if (userError || !user) {
        setErrorMessage(userError?.message ?? "You must be signed in to view this dashboard.");
        setLoading(false);
        return;
      }

      const { data: managedProperties, error: propertiesError } = await supabase
        .from("properties")
        .select("id,address,plan_number,total_lots,total_bank_balance,manager_id,created_at")
        .eq("manager_id", user.id)
        .order("created_at", { ascending: false });

      if (cancelled) return;
      if (propertiesError) {
        setErrorMessage(propertiesError.message);
        setLoading(false);
        return;
      }

      const managerView = Boolean(managedProperties?.[0]);
      const managedPropertyIds = (managedProperties ?? []).map((property) => property.id);
      setIsManager(managerView);
      setActiveProperty(
        ((managedProperties?.[0] as PropertyRecord | undefined) ?? {
          id: "mock-property",
          address: "8 Castles Road, Bentleigh VIC 3204",
          plan_number: "PS932358G",
          total_lots: 3,
          total_bank_balance: MOCK_TOTAL_BANK_BALANCE,
          manager_id: user.id,
          created_at: "2025-10-14T00:00:00Z",
        }) as PropertyRecord,
      );

      if (managerView) {
        await fetchPendingRequests(managedPropertyIds);
        if (cancelled) return;
      } else {
        setPendingRequests([]);
        router.replace("/owner-dashboard");
        return;
      }

      setLoading(false);
    };

    void loadDashboard();

    return () => {
      cancelled = true;
    };
  }, [fetchPendingRequests, router, supabase]);

  const voteUrgencyLine = voteDeadlineSummary(new Date());
  const totalBankBalance = MOCK_TOTAL_BANK_BALANCE;
  const hasLiveBalance = true;
  const hasPendingRequests = pendingRequests.length > 0;
  const levyStatuses: UnitLevyStatus[] =
    isManager && activeProperty
      ? Array.from({ length: activeProperty?.total_lots ?? 0 }, (_unused, idx) => {
          const unitNumber = idx + 1;
          const hasPayment = MOCK_TRANSACTIONS.some(
            (tx) => tx.type === "Credit" && tx.description.includes(`Q1 Levy — Unit ${unitNumber}`),
          );
          return {
            unitNumber,
            amountDue: LEVY_AMOUNT_PER_UNIT,
            dueDate: LEVY_DUE_DATE,
            paid: hasPayment,
          };
        })
      : [];

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <main className="mx-auto w-full max-w-6xl px-6 py-8 sm:px-10 lg:px-12">
        {errorMessage ? <p className="mb-6 text-sm font-medium text-red-600">{errorMessage}</p> : null}

        <section className="mb-8 grid grid-cols-1 gap-6 xl:grid-cols-2">
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

            {isManager && activeProperty ? (
              <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Levy Status by Unit</p>
                <p className="mt-1 text-xs font-medium text-slate-600">
                  {activeProperty?.address ?? "—"} - {activeProperty?.plan_number ?? "—"}
                </p>
                <ul className="mt-3 space-y-2 text-sm">
                  {levyStatuses.map((status) => (
                    <li
                      key={status.unitNumber}
                      className="flex flex-col gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <span className="font-semibold text-slate-800">Unit {status.unitNumber}</span>
                      <span className="text-xs font-medium text-slate-600">Due {status.dueDate}</span>
                      <span className="font-semibold text-slate-800">${status.amountDue.toFixed(2)}</span>
                      <span
                        className={`inline-flex w-fit rounded-full px-2 py-0.5 text-xs font-semibold ${
                          status.paid ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {status.paid ? "Paid" : "Unpaid"}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </article>

          <OCBankFeedSnapshot
            transactions={transactions}
            hasLiveBalance={hasLiveBalance}
            totalBankBalance={totalBankBalance}
          />
        </section>

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {isManager ? (
            <article className="rounded-2xl border border-white/60 bg-white/80 p-6 shadow-sm backdrop-blur">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Secretary Hub</p>
              <h2 className="mt-4 text-2xl font-extrabold text-slate-900">Action Items</h2>
              <p className="mt-2 text-sm font-semibold text-slate-700">Manage building requests and governance tasks.</p>

              <div className="mt-4">
                {loading ? (
                  <div className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-600">Loading pending actions...</div>
                ) : !hasPendingRequests ? (
                  <div className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-600">
                    No pending requests. Your building is up to date.
                  </div>
                ) : (
                  <ul className="divide-y divide-slate-200">
                    {pendingRequests.slice(0, 4).map((request) => (
                      <li key={request.id} className="flex items-center gap-2 py-2 text-sm font-medium text-slate-800">
                        <Users className="h-4 w-4 shrink-0 text-slate-500" />
                        <span>New Member Request: {request.properties?.address ?? "Assigned Property"}</span>
                        <AlertCircle className="ml-auto h-4 w-4 shrink-0 text-red-600" />
                      </li>
                    ))}
                    <li className="flex items-center gap-2 py-2 text-sm font-medium text-slate-800">
                      <FileSignature className="h-4 w-4 shrink-0 text-slate-500" />
                      <span>New Section 151 Certificate Request</span>
                    </li>
                  </ul>
                )}
              </div>

              <Button asChild className="mt-5 inline-flex w-full items-center justify-center gap-2 bg-slate-900 text-white hover:bg-slate-800">
                <Link href="/secretary-dashboard/suite">
                  Open Secretary Suite
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </article>
          ) : (
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
                className="mt-6 inline-flex items-center justify-center rounded-lg bg-[#4F46E5] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#4338CA]"
              >
                Vote
              </Link>
            </article>
          )}

          <RecordsAccessCard />

          <article className="rounded-2xl border border-white/60 bg-white/80 p-6 shadow-sm backdrop-blur">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Live Feed</p>
            <h2 className="mt-4 text-2xl font-extrabold text-slate-900">Recent Activity</h2>
            <ul className="mt-4 space-y-4 text-sm text-slate-700">
              {MOCK_TRANSACTIONS.slice(0, 3).map((tx) => (
                <li key={tx.id} className="flex items-start justify-between rounded-lg border border-slate-200 bg-white px-4 py-3">
                  <span>{tx.description}</span>
                  <span
                    className={`ml-3 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                      tx.type === "Credit" ? "bg-[#2DD4BF]/20 text-[#0F766E]" : "bg-red-100 text-red-700"
                    }`}
                  >
                    {tx.type === "Credit" ? "+" : "-"}${tx.amount.toFixed(2)}
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
