"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createBrowserSupabaseClient } from "@/lib/supabase";
import { roleHomePath, resolveUserRole } from "@/lib/userRole";

type ProfileRow = {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  mobile_number?: string | null;
  home_address?: string | null;
  full_name?: string | null;
};

export default function MyAccountPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sendingReset, setSendingReset] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [homeAddress, setHomeAddress] = useState("");
  const [propertyAddress, setPropertyAddress] = useState("Not linked yet");
  const [unitNumber, setUnitNumber] = useState("Not assigned");

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

    const loadPage = async () => {
      setLoading(true);
      setErrorMessage("");

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (cancelled) return;
      if (userError || !user) {
        setErrorMessage(userError?.message ?? "You must be signed in to view account settings.");
        setLoading(false);
        return;
      }

      setUserId(user.id);
      setEmail(user.email ?? "");

      const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
      if (!cancelled && profile && typeof profile === "object") {
        const row = profile as ProfileRow;
        const resolvedFirst = row.first_name || row.full_name?.split(" ")[0] || row.full_name || "";
        const resolvedLast =
          row.last_name || (row.full_name?.split(" ").slice(1).join(" ").trim() ? row.full_name.split(" ").slice(1).join(" ").trim() : "");
        setFirstName(resolvedFirst);
        setLastName(resolvedLast);
        setMobileNumber(row.mobile_number || "");
        setHomeAddress(row.home_address || "");
      }

      let role = "unknown";
      try {
        role = await resolveUserRole(supabase, user.id);
      } catch {
        role = "unknown";
      }

      if (role === "manager") {
        const { data: managedProperty } = await supabase
          .from("properties")
          .select("id,address")
          .eq("manager_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (!cancelled && managedProperty) {
          setPropertyAddress(managedProperty.address || "Not linked yet");
          setUnitNumber("Secretary / Manager");
        }
      } else {
        const { data: approvedJoin } = await supabase
          .from("join_requests")
          .select("property_id")
          .eq("user_id", user.id)
          .eq("status", "approved")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (approvedJoin?.property_id) {
          const [{ data: property }, { data: lot }] = await Promise.all([
            supabase.from("properties").select("address").eq("id", approvedJoin.property_id).maybeSingle(),
            supabase
              .from("lots")
              .select("lot_number")
              .eq("property_id", approvedJoin.property_id)
              .eq("owner_id", user.id)
              .limit(1)
              .maybeSingle(),
          ]);

          if (!cancelled) {
            setPropertyAddress(property?.address || "Not linked yet");
            setUnitNumber(lot?.lot_number || "Not assigned");
          }
        }
      }

      setLoading(false);
    };

    void loadPage();

    return () => {
      cancelled = true;
    };
  }, [supabase]);

  const onSaveChanges = async () => {
    if (!supabase || !userId) return;
    setSaving(true);
    setErrorMessage("");

    const fullName = `${firstName} ${lastName}`.trim();
    const { error } = await supabase.from("profiles").upsert(
      {
        id: userId,
        first_name: firstName || null,
        last_name: lastName || null,
        mobile_number: mobileNumber || null,
        home_address: homeAddress || null,
        full_name: fullName || null,
      },
      { onConflict: "id" },
    );

    setSaving(false);
    if (error) {
      setErrorMessage(error.message);
      toast.error(error.message);
      return;
    }

    toast.success("Account settings updated.");
    router.refresh();
  };

  const onResetPassword = async () => {
    if (!supabase || !email) return;
    setSendingReset(true);
    setErrorMessage("");

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    });

    setSendingReset(false);
    if (error) {
      setErrorMessage(error.message);
      toast.error(error.message);
      return;
    }

    toast.success("Reset link sent. Check your inbox.");
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 font-sans text-slate-900 sm:px-6">
      <div className="mx-auto w-full max-w-3xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">My Account</h1>
          <p className="mt-1 text-sm font-medium text-slate-600">Update your profile details and security settings.</p>
        </div>

        {errorMessage ? (
          <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{errorMessage}</p>
        ) : null}

        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>Personal Details</CardTitle>
              <CardDescription>Keep your user profile details up to date.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="first-name">First Name</Label>
                <Input
                  id="first-name"
                  value={firstName}
                  onChange={(event) => setFirstName(event.target.value)}
                  placeholder="Alex"
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last-name">Last Name</Label>
                <Input
                  id="last-name"
                  value={lastName}
                  onChange={(event) => setLastName(event.target.value)}
                  placeholder="Smith"
                  disabled={loading}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" value={email} readOnly disabled />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="mobile-number">Mobile Number</Label>
                <Input
                  id="mobile-number"
                  value={mobileNumber}
                  onChange={(event) => setMobileNumber(event.target.value)}
                  placeholder="+61 4xx xxx xxx"
                  disabled={loading}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Residential Address (for investors/off-site owners)</CardTitle>
              <CardDescription>Store your off-site postal address for notices and records.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Label htmlFor="home-address">Home Address</Label>
              <Input
                id="home-address"
                value={homeAddress}
                onChange={(event) => setHomeAddress(event.target.value)}
                placeholder="12 Collins St, Melbourne VIC 3000"
                disabled={loading}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Property Info</CardTitle>
              <CardDescription>Your currently linked property and unit.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="unit-number">Unit Number</Label>
                <Input id="unit-number" value={unitNumber} readOnly disabled />
              </div>
              <div className="space-y-2">
                <Label htmlFor="property-address">Property Address</Label>
                <Input id="property-address" value={propertyAddress} readOnly disabled />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Security</CardTitle>
              <CardDescription>Send yourself a secure password reset link.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button type="button" variant="outline" onClick={() => void onResetPassword()} disabled={loading || sendingReset}>
                {sendingReset ? "Sending reset link..." : "Reset Password"}
              </Button>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button type="button" onClick={() => void onSaveChanges()} disabled={loading || saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
