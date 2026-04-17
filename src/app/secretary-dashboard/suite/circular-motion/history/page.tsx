"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { createBrowserSupabaseClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type MotionRecord = {
  id: string;
  title: string;
  status: string;
  closing_date: string;
  created_at: string;
};

export default function CircularMotionHistoryPage() {
  const supabase = useMemo(() => {
    try {
      return createBrowserSupabaseClient();
    } catch {
      return null;
    }
  }, []);

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [motions, setMotions] = useState<MotionRecord[]>([]);

  useEffect(() => {
    if (!supabase) {
      setErrorMessage("Supabase environment variables are missing.");
      setLoading(false);
      return;
    }

    let cancelled = false;
    const loadMotions = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (cancelled) return;
      if (!user) {
        setErrorMessage("You must be signed in to view motions.");
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
        .from("motions")
        .select("id,title,status,closing_date,created_at")
        .eq("property_id", property.id)
        .order("created_at", { ascending: false });

      if (cancelled) return;
      if (error) {
        setErrorMessage(error.message);
      } else {
        setMotions((data ?? []) as MotionRecord[]);
      }
      setLoading(false);
    };

    void loadMotions();
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
            <CardTitle>Circular Motion History</CardTitle>
            <CardDescription>All motions created for this building.</CardDescription>
          </CardHeader>
          <CardContent>
            {errorMessage ? <p className="text-sm font-semibold text-red-700">{errorMessage}</p> : null}
            {loading ? (
              <p className="text-sm text-slate-600">Loading motions...</p>
            ) : motions.length === 0 ? (
              <p className="text-sm text-slate-600">No motions have been created yet.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {motions.map((motion) => (
                  <li key={motion.id} className="py-3">
                    <p className="font-semibold text-slate-900">{motion.title}</p>
                    <p className="mt-1 text-xs font-medium uppercase tracking-wide text-slate-500">
                      Status: {motion.status}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      Closes {new Date(motion.closing_date).toLocaleDateString("en-AU")}
                    </p>
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
