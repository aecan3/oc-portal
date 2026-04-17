import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import Link from "next/link";
import { MOCK_TOTAL_BANK_BALANCE, MOCK_TRANSACTIONS } from "@/lib/mockFinancialData";
import { getSupabaseProjectConfig } from "@/lib/supabase";
import { roleHomePath, resolveUserRole } from "@/lib/userRole";

type StatementRow = {
  date: string;
  description: string;
  credit: number | null;
  debit: number | null;
  running: number;
};

const formatMoney = (n: number) =>
  new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" }).format(n);

function rowsFromSharedTransactions(currentBalance: number): StatementRow[] {
  let running = currentBalance;
  return MOCK_TRANSACTIONS.map((tx) => {
    const credit = tx.type === "Credit" ? tx.amount : null;
    const debit = tx.type === "Debit" ? tx.amount : null;
    const row: StatementRow = {
      date: tx.transaction_date,
      description: tx.description,
      credit,
      debit,
      running,
    };
    if (credit != null) running -= credit;
    if (debit != null) running += debit;
    return row;
  });
}

export default async function BankStatementPage() {
  const currentBalance = MOCK_TOTAL_BANK_BALANCE;
  const computed = rowsFromSharedTransactions(currentBalance);
  let backHref = "/onboarding";

  const cookieStore = await cookies();
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
        setAll() {
          // Read-only page.
        },
      },
    });

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const role = await resolveUserRole(supabase, user.id);
      backHref = roleHomePath(role);
    }
  }

  return (
    <main className="min-h-[calc(100vh-3.5rem)] bg-slate-50 pb-12 font-sans text-slate-900">
      <div className="border-b border-slate-200/90 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
          <Link
            href={backHref}
            className="text-sm font-semibold text-indigo-600 underline decoration-indigo-600/30 underline-offset-4 hover:text-indigo-700"
          >
            ← Back to dashboard
          </Link>

          <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">OC Bank Account</h1>
              <div className="mt-4 flex flex-wrap gap-x-8 gap-y-3 text-sm">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">BSB</p>
                  <p className="mt-0.5 font-mono text-base font-semibold tracking-wide text-slate-900">063-123</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Account number</p>
                  <p className="mt-0.5 font-mono text-base font-semibold tracking-wide text-slate-900">1234 5678</p>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-6 py-4 lg:text-right">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Current balance</p>
              <p className="mt-1 text-3xl font-extrabold tabular-nums tracking-tight text-slate-900 sm:text-4xl">
                {formatMoney(currentBalance)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 pt-8 sm:px-6 lg:px-8">
        <p className="text-sm font-medium text-slate-600">
          Full transaction register aligned with dashboard snapshot.
        </p>

        <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm">
          <div className="overflow-x-auto w-full">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="whitespace-nowrap px-4 py-3">Date</th>
                  <th className="px-4 py-3">Description</th>
                  <th className="whitespace-nowrap px-4 py-3 text-right">Credit (In)</th>
                  <th className="whitespace-nowrap px-4 py-3 text-right">Debit (Out)</th>
                  <th className="whitespace-nowrap px-4 py-3 text-right">Running balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {computed.map((row, i) => (
                  <tr key={`${row.date}-${i}`} className="transition-colors hover:bg-slate-50/80">
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-600">{row.date}</td>
                    <td className="px-4 py-3 font-medium text-slate-900">{row.description}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-right font-semibold tabular-nums text-emerald-600">
                      {row.credit != null ? formatMoney(row.credit) : "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right font-semibold tabular-nums text-red-600">
                      {row.debit != null ? formatMoney(row.debit) : "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right font-bold tabular-nums text-slate-900">
                      {formatMoney(row.running)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}
