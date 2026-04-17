import Link from "next/link";

const formatMoney = (n: number) =>
  new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" }).format(n);

const MAINTENANCE_NOTICES = [
  {
    id: "1",
    title: "Upcoming: Driveway repair share",
    detail: "$500 due 1 Nov 2025",
    tone: "amber" as const,
  },
  {
    id: "2",
    title: "Lift modernisation levy",
    detail: "$1,200 instalment due 15 Dec 2025",
    tone: "slate" as const,
  },
];

const PAYMENT_HISTORY = [
  { id: "1", date: "2025-07-01", description: "Q2 levy — receipt #INV-24091", amount: 485.0, method: "BPAY" },
  { id: "2", date: "2025-04-02", description: "Q1 levy — receipt #INV-23802", amount: 485.0, method: "Direct debit" },
  { id: "3", date: "2025-01-05", description: "Q4 levy — receipt #INV-23544", amount: 470.0, method: "BPAY" },
  { id: "4", date: "2024-10-03", description: "Q3 levy — receipt #INV-23211", amount: 470.0, method: "Card" },
  { id: "5", date: "2024-07-08", description: "Special levy — insurance top-up", amount: 200.0, method: "BPAY" },
];

export default function MyAccountPage() {
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
          <h1 className="mt-6 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">My Levies &amp; Account</h1>
          <p className="mt-2 text-sm font-medium text-slate-600">Unit 4 — placeholder owner view for layout review.</p>
        </div>
      </div>

      <div className="mx-auto max-w-6xl space-y-8 px-4 pt-8 sm:px-6 lg:px-8">
        {/* Current status */}
        <section className="rounded-2xl border-2 border-indigo-200 bg-gradient-to-br from-indigo-50/90 to-white p-6 shadow-sm sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-700">Current status</p>
          <div className="mt-6 grid gap-8 sm:grid-cols-2">
            <div>
              <p className="text-sm font-semibold text-slate-600">Amount due</p>
              <p className="mt-2 text-4xl font-extrabold tabular-nums tracking-tight text-slate-900 sm:text-5xl">
                {formatMoney(485.0)}
              </p>
              <p className="mt-2 text-xs font-medium text-slate-500">Includes admin &amp; capital works components (illustrative).</p>
            </div>
            <div className="rounded-xl border border-indigo-100 bg-white/80 p-5">
              <p className="text-sm font-semibold text-slate-600">Next upcoming levy</p>
              <p className="mt-2 text-lg font-bold text-slate-900">Q1 2026 — Admin &amp; sinking</p>
              <p className="mt-1 text-sm font-medium text-slate-600">Due 15 Jan 2026</p>
              <p className="mt-3 text-sm font-semibold tabular-nums text-indigo-700">{formatMoney(485.0)} estimated</p>
            </div>
          </div>
        </section>

        {/* Direct debit */}
        <section className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Payments</p>
              <h2 className="mt-2 text-xl font-extrabold text-slate-900">Automate your payments</h2>
              <p className="mt-2 max-w-xl text-sm font-medium text-slate-600">
                Never miss a due date. Set up a direct debit from your nominated account and levies will be drawn on the schedule
                the OC publishes.
              </p>
            </div>
            <Link
              href="/direct-debit"
              className="inline-flex shrink-0 items-center justify-center rounded-xl bg-indigo-600 px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
            >
              Set up Direct Debit
            </Link>
          </div>
        </section>

        {/* Maintenance notices */}
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Maintenance notices</h2>
          <ul className="mt-4 space-y-3">
            {MAINTENANCE_NOTICES.map((n) => (
              <li
                key={n.id}
                className={
                  n.tone === "amber"
                    ? "rounded-xl border border-amber-200/90 bg-amber-50/90 px-4 py-4 sm:px-5"
                    : "rounded-xl border border-slate-200 bg-white px-4 py-4 sm:px-5"
                }
              >
                <p className={`text-sm font-bold ${n.tone === "amber" ? "text-amber-950" : "text-slate-900"}`}>{n.title}</p>
                <p className={`mt-1 text-sm font-semibold ${n.tone === "amber" ? "text-amber-900/90" : "text-slate-600"}`}>
                  {n.detail}
                </p>
              </li>
            ))}
          </ul>
        </section>

        {/* Payment history */}
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Payment history</h2>
          <p className="mt-1 text-sm font-medium text-slate-600">Past payments and receipts (placeholder).</p>

          <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <th className="whitespace-nowrap px-4 py-3">Date</th>
                    <th className="px-4 py-3">Description</th>
                    <th className="whitespace-nowrap px-4 py-3">Method</th>
                    <th className="whitespace-nowrap px-4 py-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {PAYMENT_HISTORY.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/80">
                      <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-600">{p.date}</td>
                      <td className="px-4 py-3 font-medium text-slate-900">{p.description}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-600">{p.method}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-right font-semibold tabular-nums text-emerald-600">
                        {formatMoney(p.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
