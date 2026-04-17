import Link from "next/link";
import { cn } from "@/lib/utils";

export type TransactionFeedRow = {
  id: string;
  transaction_date: string;
  description: string;
  amount: number;
  category: string;
  type: string;
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
  }).format(Math.abs(value));

function formatRowDate(isoDate: string) {
  const d = new Date(`${isoDate}T12:00:00`);
  if (!Number.isFinite(d.getTime())) return "—";
  return new Intl.DateTimeFormat("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(d);
}

type Props = {
  transactions: TransactionFeedRow[];
  hasLiveBalance: boolean;
  totalBankBalance: number | null;
};

export default function OCBankFeedSnapshot({ transactions, hasLiveBalance, totalBankBalance }: Props) {
  const displayTotal = formatCurrency(hasLiveBalance && totalBankBalance != null ? totalBankBalance : 14778.6);

  return (
    <section className="mb-8 rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm sm:p-8">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Financial transparency</p>
      <h2 className="mt-2 text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl">OC Bank Feed Snapshot</h2>

      <div className="mt-6 border-b border-slate-100 pb-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total Bank Balance</p>
        <p className="mt-1 text-4xl font-extrabold tracking-tight text-slate-900 tabular-nums sm:text-5xl">{displayTotal}</p>
        {!hasLiveBalance ? (
          <p className="mt-2 text-xs font-semibold text-amber-800">Illustrative total — connect live balance in Supabase.</p>
        ) : null}
      </div>

      {transactions.length === 0 ? (
        <p className="mt-6 text-sm font-medium text-slate-500">
          No recent transactions yet. Ledger entries will appear here for all owners.
        </p>
      ) : (
        <ul className="mt-6 divide-y divide-slate-100">
          {transactions.map((t) => {
            const isCredit = t.type === "Credit";
            const safeAmt = Number.isFinite(t.amount) ? t.amount : 0;
            return (
              <li key={t.id} className="flex flex-col gap-1 py-4 first:pt-0 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{formatRowDate(t.transaction_date)}</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">{t.description}</p>
                </div>
                <p
                  className={cn(
                    "shrink-0 text-right text-base font-bold tabular-nums tracking-tight sm:text-lg",
                    isCredit ? "text-emerald-600" : "text-red-600",
                  )}
                >
                  {isCredit ? `+${formatCurrency(safeAmt)}` : `−${formatCurrency(safeAmt)}`}
                </p>
              </li>
            );
          })}
        </ul>
      )}

      <div className="mt-6 border-t border-slate-100 pt-6">
        <Link
          href="/bank"
          className="inline-flex w-full items-center justify-center rounded-xl border-2 border-indigo-600 bg-white px-4 py-3 text-sm font-semibold text-indigo-600 transition hover:bg-indigo-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 sm:w-auto"
        >
          View Full Bank Statement
        </Link>
      </div>
    </section>
  );
}
