"use client";

import { Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createBrowserSupabaseClient } from "@/lib/supabase";

type PropertySearchRow = {
  id: string;
  address: string;
  plan_number: string;
  total_lots: number;
};

export default function JoinOCPage() {
  const router = useRouter();
  const supabase = useMemo(() => {
    try {
      return createBrowserSupabaseClient();
    } catch {
      return null;
    }
  }, []);

  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [properties, setProperties] = useState<PropertySearchRow[]>([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [submittingPropertyId, setSubmittingPropertyId] = useState<string | null>(null);
  const [pendingRequestedUnitKeys, setPendingRequestedUnitKeys] = useState<Set<string>>(new Set());
  const [selectedUnitByProperty, setSelectedUnitByProperty] = useState<Record<string, string>>({});
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!supabase) return;

    const loadCurrentUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUserId(user?.id ?? null);
      setUserEmail(user?.email ?? null);
    };

    void loadCurrentUser();
  }, [supabase]);

  useEffect(() => {
    if (!supabase || !userId) return;

    const loadPendingRequests = async () => {
      const { data, error } = await supabase
        .from("join_requests")
        .select("property_id,unit_number")
        .eq("user_id", userId)
        .eq("status", "pending");

      if (error) {
        setErrorMessage(error.message);
        return;
      }

      setPendingRequestedUnitKeys(
        new Set((data ?? []).map((row) => `${row.property_id}|${String(row.unit_number ?? "").trim()}`)),
      );
    };

    void loadPendingRequests();
  }, [supabase, userId]);

  useEffect(() => {
    if (!supabase) return;

    const trimmed = searchTerm.trim();
    if (!trimmed) {
      setProperties([]);
      setLoadingSearch(false);
      return;
    }

    let cancelled = false;
    setLoadingSearch(true);

    const runSearch = async () => {
      const { data, error } = await supabase
        .from("properties")
        .select("id,address,plan_number,total_lots")
        .ilike("address", `%${trimmed}%`)
        .order("address", { ascending: true })
        .limit(20);

      if (cancelled) return;

      setLoadingSearch(false);
      if (error) {
        setErrorMessage(error.message);
        return;
      }

      setErrorMessage("");
      setProperties((data ?? []) as PropertySearchRow[]);
    };

    void runSearch();

    return () => {
      cancelled = true;
    };
  }, [searchTerm, supabase]);

  const handleRequestToJoin = async (propertyId: string) => {
    if (!supabase) {
      const message = "Supabase environment variables are missing.";
      setErrorMessage(message);
      alert(message);
      return;
    }
    if (!userId) {
      const message = "You must be signed in to request access to a property.";
      setErrorMessage(message);
      alert(message);
      return;
    }
    const selectedUnit = selectedUnitByProperty[propertyId];
    if (!selectedUnit) {
      const message = "Please select your Unit Number before submitting.";
      setErrorMessage(message);
      return;
    }

    const { data: profile } = await supabase
      .from("profiles" as "profiles")
      .select("occupancy_status")
      .eq("id", userId)
      .maybeSingle();
    const typedProfile = (profile as { occupancy_status?: string | null } | null);
    const selectedOccupancyStatus = typedProfile?.occupancy_status?.trim();
    if (!selectedOccupancyStatus) {
      const message = "Please complete your profile occupancy status before requesting to join.";
      setErrorMessage(message);
      return;
    }

    const {
      data: { user: submitUser },
    } = await supabase.auth.getUser();
    const applicantEmail = submitUser?.email ?? userEmail;
    if (!applicantEmail) {
      const message = "Unable to determine your account email for this request.";
      setErrorMessage(message);
      return;
    }

    setSubmittingPropertyId(propertyId);
    setErrorMessage("");

    const { error } = await supabase.from("join_requests").insert({
      user_id: userId,
      property_id: propertyId,
      unit_number: selectedUnit,
      occupancy_status: selectedOccupancyStatus,
      applicant_email: applicantEmail,
      status: "pending",
    });

    setSubmittingPropertyId(null);

    if (error) {
      setErrorMessage(error.message);
      alert(error.message);
      return;
    }

    router.push("/join-success");
  };

  return (
    <main className="min-h-[calc(100vh-3.5rem)] bg-slate-50 px-4 py-10 sm:px-6">
      <div className="mx-auto w-full max-w-4xl">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Join Existing Owners Corporation</h1>
        <p className="mt-2 text-sm font-medium text-slate-600">
          Search for your property and send a request to join the existing committee workspace.
        </p>

        <div className="relative mt-6">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <Input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search for your property address..."
            className="h-12 pl-10 text-base"
          />
        </div>

        {errorMessage ? <p className="mt-4 text-sm font-medium text-red-600">{errorMessage}</p> : null}

        <div className="mt-6 space-y-4">
          {loadingSearch ? (
            <p className="text-sm font-medium text-slate-600">Searching properties...</p>
          ) : searchTerm.trim() && properties.length === 0 ? (
            <p className="text-sm font-medium text-slate-600">No matching properties found.</p>
          ) : (
            properties.map((property) => {
              const selectedUnit = selectedUnitByProperty[property.id] ?? "";
              const pendingKey = `${property.id}|${selectedUnit}`;
              const alreadyPending = selectedUnit ? pendingRequestedUnitKeys.has(pendingKey) : false;
              const isSubmitting = submittingPropertyId === property.id;
              const unitOptions = Array.from({ length: Math.max(1, property.total_lots || 0) }, (_unused, index) => String(index + 1));

              return (
                <Card key={property.id} className="border-slate-200 bg-white shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg">{property.address}</CardTitle>
                    <CardDescription>Plan Number: {property.plan_number}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                      <label
                        htmlFor={`unit-select-${property.id}`}
                        className="text-sm font-semibold text-slate-700"
                      >
                        Select your Unit Number
                      </label>
                      <select
                        id={`unit-select-${property.id}`}
                        value={selectedUnit}
                        onChange={(event) =>
                          setSelectedUnitByProperty((current) => ({
                            ...current,
                            [property.id]: event.target.value,
                          }))
                        }
                        className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                      >
                        <option value="">Select a unit</option>
                        {unitOptions.map((unit) => (
                          <option key={`${property.id}-${unit}`} value={unit}>
                            Unit {unit}
                          </option>
                        ))}
                      </select>
                    </div>
                    <Button
                      type="button"
                      disabled={!selectedUnit || alreadyPending || isSubmitting}
                      onClick={() => void handleRequestToJoin(property.id)}
                    >
                      {alreadyPending ? "Request Pending" : isSubmitting ? "Submitting..." : "Request to Join"}
                    </Button>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </main>
  );
}
