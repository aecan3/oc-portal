import Link from "next/link";

export default function PaymentPage() {
  return (
    <main className="mx-auto max-w-lg px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">Pay levy</h1>
      <p className="mt-3 text-sm font-medium text-slate-600">Payment flow coming next.</p>
      <Link
        href="/dashboard"
        className="mt-8 inline-flex text-sm font-semibold text-indigo-600 underline decoration-indigo-600/30 underline-offset-4 hover:text-indigo-700"
      >
        Back to dashboard
      </Link>
    </main>
  );
}
