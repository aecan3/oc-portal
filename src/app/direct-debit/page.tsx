import Link from "next/link";

export default function DirectDebitPage() {
  return (
    <main className="mx-auto max-w-lg px-4 py-10 pb-16 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Set up Direct Debit</h1>

      <div className="mt-6 rounded-xl border border-indigo-100 bg-indigo-50/60 px-4 py-3 text-sm font-medium text-slate-700">
        Direct debits are automatically processed <span className="font-semibold text-slate-900">3 days before</span> each levy
        due date, so funds clear on time without manual payment.
      </div>

      <div className="mt-8 rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm sm:p-8">
        <form className="space-y-5">
          <div>
            <label htmlFor="account-name" className="block text-sm font-semibold text-slate-700">
              Account Name
            </label>
            <input
              id="account-name"
              name="accountName"
              type="text"
              autoComplete="name"
              placeholder="As shown on your bank account"
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
          <div>
            <label htmlFor="bsb" className="block text-sm font-semibold text-slate-700">
              BSB (6 digits)
            </label>
            <input
              id="bsb"
              name="bsb"
              type="text"
              inputMode="numeric"
              autoComplete="off"
              placeholder="000000"
              maxLength={6}
              pattern="[0-9]{6}"
              title="Enter a 6-digit BSB"
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
          <div>
            <label htmlFor="account-number" className="block text-sm font-semibold text-slate-700">
              Account Number
            </label>
            <input
              id="account-number"
              name="accountNumber"
              type="text"
              inputMode="numeric"
              autoComplete="off"
              placeholder="Your account number"
              maxLength={16}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div className="pt-2">
            <button
              type="button"
              className="w-full rounded-xl bg-indigo-600 px-5 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
            >
              Authorize Mandate
            </button>
            <div className="mt-4 text-center">
              <Link
                href="/dashboard"
                className="text-sm font-semibold text-slate-600 underline decoration-slate-400/50 underline-offset-4 transition hover:text-slate-900"
              >
                Cancel
              </Link>
            </div>
          </div>
        </form>
      </div>
    </main>
  );
}
