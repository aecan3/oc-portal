import Link from "next/link";

type StatementRow = {
  date: string;
  description: string;
  credit: number | null;
  debit: number | null;
};

const PLACEHOLDER_ROWS: StatementRow[] = [
  { date: "2025-09-30", description: "Balance brought forward", credit: 18256.4, debit: null },
  { date: "2025-10-02", description: "Q1 levy — Unit 4", credit: 485.0, debit: null },
  { date: "2025-10-03", description: "Electricity — common property", credit: null, debit: 312.4 },
  { date: "2025-10-05", description: "Lift service — monthly", credit: null, debit: 890.0 },
  { date: "2025-10-07", description: "Q1 levy — Unit 1", credit: 485.0, debit: null },
  { date: "2025-10-09", description: "Water — quarter", credit: null, debit: 228.15 },
  { date: "2025-10-12", description: "Lobby repaint — progress", credit: null, debit: 2400.0 },
  { date: "2025-10-14", description: "Special levy — fire compliance", credit: 1200.0, debit: null },
  { date: "2025-10-16", description: "Gardening contract", credit: null, debit: 440.0 },
  { date: "2025-10-18", description: "Gas — common areas", credit: null, debit: 156.8 },
  { date: "2025-10-20", description: "Q1 levy — Unit 7", credit: 485.0, debit: null },
  { date: "2025-10-22", description: "Insurance — OC policy", credit: null, debit: 1840.0 },
  { date: "2025-10-24", description: "Interest earned", credit: 12.35, debit: null },
  { date: "2025-10-26", description: "Strata manager fees — October", credit: null, debit: 660.0 },
  { date: "2025-10-28", description: "Q1 levy — Unit 2", credit: 485.0, debit: null },
];

const formatMoney = (n: number) =>
  new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" }).format(n);

function rowsWithRunningBalance(rows: StatementRow[]) {
  let running = 0;
  return rows.map((r) => {
    if (r.credit != null) running += r.credit;
    if (r.debit != null) running -= r.debit;
    return { ...r, running };
  });
}

export default function BankStatementPage() {
  const computed = rowsWithRunningBalance(PLACEHOLDER_ROWS);
  const currentBalance = computed.length > 0 ? computed[computed.length - 1].running : 0;

  return (
    <main className="min-h-[calc(100vh-3.5rem)] bg-slate-50 pb-12 font-sans text-slate-900">
      <div className="border-b border-slate-200/90 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
          <Link
            href="/"
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
          Full transaction register (placeholder data for layout review).
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
