"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { createBrowserSupabaseClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type AgmRecord = {
  id: string;
  meeting_at: string;
  location: string;
  agenda_items: string;
  status: string;
  created_at: string;
};

export default function AgmHistoryPage() {
  const supabase = useMemo(() => {
    try {
      return createBrowserSupabaseClient();
    } catch {
      return null;
    }
  }, []);

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [agmNotices, setAgmNotices] = useState<AgmRecord[]>([]);

  useEffect(() => {
    if (!supabase) {
      setErrorMessage("Supabase environment variables are missing.");
      setLoading(false);
      return;
    }

    let cancelled = false;
    const loadAgmHistory = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (cancelled) return;
      if (!user) {
        setErrorMessage("You must be signed in to view AGM history.");
        setLoading(false);
        return;
      }

      const { data: property } = await supabase
        .from("properties")
        .select("id")
        .eq("manager_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!property?.id) {
        setErrorMessage("No managed property found.");
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("agm_notices")
        .select("id,meeting_at,location,agenda_items,status,created_at")
        .eq("property_id", property.id)
        .order("meeting_at", { ascending: false });

      if (cancelled) return;
      if (error) {
        setErrorMessage(error.message);
      } else {
        setAgmNotices((data ?? []) as AgmRecord[]);
      }
      setLoading(false);
    };

    void loadAgmHistory();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 sm:px-6">
      <div className="mx-auto w-full max-w-4xl space-y-5">
        <Button asChild variant="outline" className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50">
          <Link href="/secretary-dashboard/suite" className="inline-flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Secretary Suite
          </Link>
        </Button>

        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle>AGM History</CardTitle>
            <CardDescription>All AGM notices issued for this building.</CardDescription>
          </CardHeader>
          <CardContent>
            {errorMessage ? <p className="text-sm font-semibold text-red-700">{errorMessage}</p> : null}
            {loading ? (
              <p className="text-sm text-slate-600">Loading AGM notices...</p>
            ) : agmNotices.length === 0 ? (
              <p className="text-sm text-slate-600">No AGM notices have been recorded yet.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {agmNotices.map((agm) => (
                  <li key={agm.id} className="py-3">
                    <p className="font-semibold text-slate-900">
                      Meeting on {new Date(agm.meeting_at).toLocaleDateString("en-AU")} at{" "}
                      {new Date(agm.meeting_at).toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">{agm.location}</p>
                    <p className="mt-1 text-xs font-medium uppercase tracking-wide text-slate-500">Status: {agm.status}</p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
