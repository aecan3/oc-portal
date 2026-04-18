import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Building2, FileStack, ShieldCheck, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "OC Portal — Owners Corporation made simple",
  description:
    "A secure portal for owners corporations: levies, documents, voting, and transparent building finances in one place.",
};

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <header className="border-b border-slate-200/80 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4 sm:px-10 lg:px-12">
          <Link href="/" className="text-lg font-bold tracking-tight text-indigo-600 transition hover:text-indigo-700">
            OC Portal
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <Button variant="ghost" asChild className="text-slate-700">
              <Link href="/login">Sign in</Link>
            </Button>
            <Button asChild className="bg-indigo-600 hover:bg-indigo-700">
              <Link href="/signup">Create account</Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        <section className="border-b border-slate-200/80 bg-gradient-to-b from-white to-slate-50 px-6 py-16 sm:px-10 sm:py-20 lg:px-12 lg:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Owners Corporation Portal</p>
            <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
              Your building, organised in one place
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-slate-600 sm:text-xl">
              OC Portal helps committees and lot owners run levies, keep records straight, and stay across governance —
              without digging through email threads or spreadsheets.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
              <Button size="lg" asChild className="min-w-[12rem] bg-indigo-600 hover:bg-indigo-700">
                <Link href="/signup" className="inline-flex items-center gap-2">
                  Get started
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="min-w-[12rem] border-slate-300">
                <Link href="/login">Sign in</Link>
              </Button>
            </div>
            <p className="mt-6 text-sm text-slate-500">
              Already invited to a building?{" "}
              <Link href="/signup" className="font-semibold text-indigo-600 underline-offset-4 hover:underline">
                Join your OC
              </Link>
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-16 sm:px-10 lg:px-12 lg:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Who we are</h2>
            <p className="mt-4 text-base leading-relaxed text-slate-600 sm:text-lg">
              We build tools for Australian owners corporations: secretaries, committees, and lot owners who need a
              single, trustworthy place to manage money, records, and decisions. Our focus is clarity, security, and
              fewer admin headaches — so you can spend time on the building, not the paperwork.
            </p>
          </div>

          <div className="mt-14">
            <h2 className="text-center text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">What we do</h2>
            <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <li className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
                  <Wallet className="h-5 w-5" aria-hidden />
                </div>
                <h3 className="mt-4 text-lg font-bold text-slate-900">Levies &amp; payments</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  See what&apos;s due, pay levies, and understand your OC&apos;s cash position with a clear financial
                  snapshot.
                </p>
              </li>
              <li className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
                  <FileStack className="h-5 w-5" aria-hidden />
                </div>
                <h3 className="mt-4 text-lg font-bold text-slate-900">Documents &amp; records</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  Store and find minutes, certificates, insurance, and building files in a shared library — organised by
                  category, not by inbox.
                </p>
              </li>
              <li className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
                  <ShieldCheck className="h-5 w-5" aria-hidden />
                </div>
                <h3 className="mt-4 text-lg font-bold text-slate-900">Governance &amp; voting</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  Run motions and resolutions with clear deadlines and visibility for owners, so decisions are traceable
                  and fair.
                </p>
              </li>
              <li className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
                  <Building2 className="h-5 w-5" aria-hidden />
                </div>
                <h3 className="mt-4 text-lg font-bold text-slate-900">Built for your OC</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  Committee tools for secretaries and a dedicated experience for owners — roles stay separated and
                  appropriate to strata responsibilities.
                </p>
              </li>
            </ul>
          </div>
        </section>

        <section className="border-t border-slate-200 bg-white px-6 py-14 sm:px-10 lg:px-12">
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 rounded-2xl border border-indigo-200/60 bg-indigo-50/80 px-8 py-10 text-center sm:flex-row sm:text-left">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 sm:text-2xl">Ready to open your portal?</h2>
              <p className="mt-2 text-sm text-slate-600 sm:text-base">
                Sign in to access your dashboard, or create an account to get started.
              </p>
            </div>
            <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
              <Button asChild className="bg-indigo-600 hover:bg-indigo-700">
                <Link href="/login">Sign in</Link>
              </Button>
              <Button variant="outline" asChild className="border-indigo-300 bg-white">
                <Link href="/signup">Create account</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-slate-50 px-6 py-8 sm:px-10 lg:px-12">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-sm text-slate-500 sm:flex-row">
          <p>&copy; {new Date().getFullYear()} OC Portal. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/login" className="font-medium text-slate-600 hover:text-indigo-600">
              Sign in
            </Link>
            <Link href="/signup" className="font-medium text-slate-600 hover:text-indigo-600">
              Create account
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
