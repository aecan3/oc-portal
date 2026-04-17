"use client";

import { Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createBrowserSupabaseClient } from "@/lib/supabase";

type PropertySearchRow = {
  id: string;
  address: string;
  plan_number: string;
};

export default function JoinOCPage() {
  const supabase = useMemo(() => {
    try {
      return createBrowserSupabaseClient();
    } catch {
      return null;
    }
  }, []);

  const [userId, setUserId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [properties, setProperties] = useState<PropertySearchRow[]>([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [submittingPropertyId, setSubmittingPropertyId] = useState<string | null>(null);
  const [pendingRequestedPropertyIds, setPendingRequestedPropertyIds] = useState<Set<string>>(new Set());
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!supabase) return;

    const loadCurrentUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUserId(user?.id ?? null);
    };

    void loadCurrentUser();
  }, [supabase]);

  useEffect(() => {
    if (!supabase || !userId) return;

    const loadPendingRequests = async () => {
      const { data, error } = await supabase
        .from("join_requests")
        .select("property_id")
        .eq("user_id", userId)
        .eq("status", "pending");

      if (error) {
        setErrorMessage(error.message);
        return;
      }

      setPendingRequestedPropertyIds(new Set((data ?? []).map((row) => row.property_id)));
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
        .select("id,address,plan_number")
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

    setSubmittingPropertyId(propertyId);
    setErrorMessage("");

    const { error } = await supabase.from("join_requests").insert({
      user_id: userId,
      property_id: propertyId,
      status: "pending",
    });

    setSubmittingPropertyId(null);

    if (error) {
      setErrorMessage(error.message);
      alert(error.message);
      return;
    }

    setPendingRequestedPropertyIds((prev) => new Set(prev).add(propertyId));
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
              const alreadyPending = pendingRequestedPropertyIds.has(property.id);
              const isSubmitting = submittingPropertyId === property.id;

              return (
                <Card key={property.id} className="border-slate-200 bg-white shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg">{property.address}</CardTitle>
                    <CardDescription>Plan Number: {property.plan_number}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button
                      type="button"
                      disabled={alreadyPending || isSubmitting}
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
