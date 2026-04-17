"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createBrowserSupabaseClient } from "@/lib/supabase";

type ProfileRow = {
  first_name?: string | null;
  last_name?: string | null;
  mobile_number?: string | null;
  home_address?: string | null;
  occupancy_status?: string | null;
};

export default function SignupProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [homeAddress, setHomeAddress] = useState("");
  const [propertyStatus, setPropertyStatus] = useState("");

  const supabase = useMemo(() => {
    try {
      return createBrowserSupabaseClient();
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    if (!supabase) {
      setErrorMessage("Supabase environment variables are missing.");
      setLoading(false);
      return;
    }

    let cancelled = false;

    const preload = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (cancelled) return;
      if (!user) {
        router.replace("/signup");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("first_name,last_name,mobile_number,home_address,occupancy_status")
        .eq("id", user.id)
        .maybeSingle();

      if (!cancelled && profile) {
        const row = profile as ProfileRow;
        setFirstName(row.first_name || "");
        setLastName(row.last_name || "");
        setMobileNumber(row.mobile_number || "");
        setHomeAddress(row.home_address || "");
        setPropertyStatus(row.occupancy_status || "");
      }
      setLoading(false);
    };

    void preload();

    return () => {
      cancelled = true;
    };
  }, [router, supabase]);

  const onContinue = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");
    if (!supabase) {
      setErrorMessage("Supabase environment variables are missing.");
      return;
    }

    const trimmedFirstName = firstName.trim();
    const trimmedLastName = lastName.trim();
    const trimmedMobileNumber = mobileNumber.trim();
    const trimmedHomeAddress = homeAddress.trim();
    const trimmedPropertyStatus = propertyStatus.trim();

    if (!trimmedFirstName || !trimmedLastName || !trimmedMobileNumber || !trimmedHomeAddress || !trimmedPropertyStatus) {
      setErrorMessage("All fields are required.");
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.replace("/signup");
      return;
    }

    setSubmitting(true);
    const fullName = `${trimmedFirstName} ${trimmedLastName}`.trim();
    const { error } = await supabase.from("profiles").upsert(
      {
        id: user.id,
        first_name: trimmedFirstName,
        last_name: trimmedLastName,
        mobile_number: trimmedMobileNumber,
        home_address: trimmedHomeAddress,
        occupancy_status: trimmedPropertyStatus,
        full_name: fullName || null,
      },
      { onConflict: "id" },
    );
    setSubmitting(false);

    if (error) {
      setErrorMessage(error.message);
      toast.error(error.message);
      return;
    }

    toast.success("Profile saved. Continue to onboarding.");
    router.replace("/onboarding");
    router.refresh();
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10 sm:px-6">
      <Card className="w-full max-w-xl border-slate-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-2xl font-bold tracking-tight">Tell us about yourself</CardTitle>
          <CardDescription>This information helps your Owners Corporation identify you.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={onContinue}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="first-name">First Name</Label>
                <Input
                  id="first-name"
                  value={firstName}
                  onChange={(event) => setFirstName(event.target.value)}
                  placeholder="Alex"
                  required
                  disabled={loading || submitting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last-name">Last Name</Label>
                <Input
                  id="last-name"
                  value={lastName}
                  onChange={(event) => setLastName(event.target.value)}
                  placeholder="Smith"
                  required
                  disabled={loading || submitting}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="mobile-number">Mobile Number</Label>
              <Input
                id="mobile-number"
                value={mobileNumber}
                onChange={(event) => setMobileNumber(event.target.value)}
                placeholder="+61 4xx xxx xxx"
                required
                disabled={loading || submitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="home-address">Current Residential Address</Label>
              <Input
                id="home-address"
                value={homeAddress}
                onChange={(event) => setHomeAddress(event.target.value)}
                placeholder="12 Collins St, Melbourne VIC 3000"
                required
                disabled={loading || submitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="property-status">Occupancy Status</Label>
              <select
                id="property-status"
                value={propertyStatus}
                onChange={(event) => setPropertyStatus(event.target.value)}
                className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                required
                disabled={loading || submitting}
              >
                <option value="">Select status</option>
                <option value="Owner Occupied">Owner Occupied</option>
                <option value="Investment Property">Investment Property</option>
                <option value="Holiday Home">Holiday Home</option>
              </select>
            </div>

            {errorMessage ? (
              <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{errorMessage}</p>
            ) : null}

            <Button type="submit" className="w-full" disabled={loading || submitting}>
              {submitting ? "Saving..." : "Continue"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
