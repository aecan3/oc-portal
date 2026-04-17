"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, PlusCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createBrowserSupabaseClient } from "@/lib/supabase";

export default function OnboardingPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const supabase = useMemo(() => {
    try {
      return createBrowserSupabaseClient();
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    if (!supabase) {
      router.replace("/login");
      return;
    }

    let cancelled = false;
    const enforceProfileSetup = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (cancelled) return;
      if (!user) {
        router.replace("/login");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("first_name,last_name,mobile_number,home_address,occupancy_status")
        .eq("id", user.id)
        .maybeSingle();

      const hasCompleteProfile = Boolean(
        profile &&
          profile.first_name?.trim() &&
          profile.last_name?.trim() &&
          profile.mobile_number?.trim() &&
          profile.home_address?.trim() &&
          profile.occupancy_status?.trim(),
      );

      if (!hasCompleteProfile) {
        router.replace("/signup/profile");
        return;
      }

      setReady(true);
    };

    void enforceProfileSetup();

    return () => {
      cancelled = true;
    };
  }, [router, supabase]);

  if (!ready) {
    return (
      <main className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center bg-slate-50 px-4 py-10 sm:px-6">
        <p className="text-sm font-semibold text-slate-600">Loading onboarding...</p>
      </main>
    );
  }

  return (
    <main className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center bg-slate-50 px-4 py-10 sm:px-6">
      <div className="w-full max-w-4xl">
        <h1 className="text-center text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
          Welcome to OC Portal. What would you like to do?
        </h1>

        <div className="mt-8 flex flex-col gap-4 md:flex-row">
          <Link href="/join-oc" className="flex-1">
            <Card className="h-full border-slate-200 bg-white transition hover:border-indigo-300 hover:shadow-md">
              <CardHeader>
                <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-indigo-700">
                  <Building2 className="h-5 w-5" />
                </div>
                <CardTitle className="text-xl">Join Existing Owners Corporation</CardTitle>
                <CardDescription>
                  Search for your property and connect with your existing committee.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm font-semibold text-indigo-700">Continue</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/setup-oc" className="flex-1">
            <Card className="h-full border-slate-200 bg-white transition hover:border-indigo-300 hover:shadow-md">
              <CardHeader>
                <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-indigo-700">
                  <PlusCircle className="h-5 w-5" />
                </div>
                <CardTitle className="text-xl">Register New Owners Corporation</CardTitle>
                <CardDescription>
                  Set up a new portal for your property as the Secretary.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm font-semibold text-indigo-700">Continue</p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </main>
  );
}
