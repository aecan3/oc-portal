"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { createBrowserSupabaseClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const STEPS = ["Step 1: Details", "Step 2: Agenda", "Step 3: Send"] as const;

const DEFAULT_AGENDA = `1. Minutes of last meeting
2. Financial report
3. Committee election`;

export default function AgmWizardPage() {
  const router = useRouter();
  const supabase = useMemo(() => {
    try {
      return createBrowserSupabaseClient();
    } catch {
      return null;
    }
  }, []);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [propertyId, setPropertyId] = useState<string | null>(null);

  const [meetingAt, setMeetingAt] = useState("");
  const [location, setLocation] = useState("");
  const [agendaItems, setAgendaItems] = useState(DEFAULT_AGENDA);
  const [managerReport, setManagerReport] = useState("");

  useEffect(() => {
    if (!supabase) {
      setErrorMessage("Supabase environment variables are missing.");
      setLoading(false);
      return;
    }

    let cancelled = false;
    const loadContext = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (cancelled) return;
      if (!user) {
        router.replace("/login");
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

      setPropertyId(property.id);
      setLoading(false);
    };

    void loadContext();
    return () => {
      cancelled = true;
    };
  }, [router, supabase]);

  const onInviteAll = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!supabase || !propertyId) return;

    const trimmedMeetingAt = meetingAt.trim();
    const trimmedLocation = location.trim();
    const trimmedAgenda = agendaItems.trim();

    if (!trimmedMeetingAt || !trimmedLocation || !trimmedAgenda) {
      setErrorMessage("Please complete all required fields.");
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.replace("/login");
      return;
    }

    setSubmitting(true);
    setErrorMessage("");
    const { error: insertError } = await supabase.from("agm_notices").insert({
      property_id: propertyId,
      created_by: user.id,
      meeting_at: new Date(trimmedMeetingAt).toISOString(),
      location: trimmedLocation,
      agenda_items: trimmedAgenda,
      manager_report: managerReport.trim() || null,
      status: "sent",
    });

    if (insertError) {
      setSubmitting(false);
      setErrorMessage(insertError.message);
      toast.error(insertError.message);
      return;
    }

    const { data: lots } = await supabase.from("lots").select("owner_id").eq("property_id", propertyId);
    const ownerIds = Array.from(new Set((lots ?? []).map((lot) => lot.owner_id).filter((id): id is string => Boolean(id))));

    setSubmitting(false);
    toast.success(`AGM notice logged. Invitation placeholder prepared for ${ownerIds.length} owners.`);
    router.replace("/secretary-dashboard/suite");
    router.refresh();
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 sm:px-6">
      <div className="mx-auto w-full max-w-3xl space-y-6">
        <Button asChild variant="outline" className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50">
          <Link href="/secretary-dashboard/suite" className="inline-flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Secretary Suite
          </Link>
        </Button>

        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-2xl font-bold tracking-tight">Begin AGM</CardTitle>
            <CardDescription>Notice of Annual General Meeting pro-forma.</CardDescription>
            <div className="mt-2 flex flex-wrap gap-2">
              {STEPS.map((step, index) => (
                <span
                  key={step}
                  className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                    index <= 1 ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-600"
                  }`}
                >
                  {step}
                </span>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={onInviteAll}>
              <div className="space-y-2">
                <Label htmlFor="meeting-at">Date &amp; Time of Meeting</Label>
                <Input
                  id="meeting-at"
                  type="datetime-local"
                  value={meetingAt}
                  onChange={(event) => setMeetingAt(event.target.value)}
                  required
                  disabled={loading || submitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location (Physical or Zoom link)</Label>
                <Input
                  id="location"
                  value={location}
                  onChange={(event) => setLocation(event.target.value)}
                  placeholder="Level 2 Meeting Room / https://zoom.us/..."
                  required
                  disabled={loading || submitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="agenda">Agenda Items</Label>
                <textarea
                  id="agenda"
                  className="min-h-28 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                  value={agendaItems}
                  onChange={(event) => setAgendaItems(event.target.value)}
                  disabled={loading || submitting}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="manager-report">Manager&apos;s Report</Label>
                <textarea
                  id="manager-report"
                  className="min-h-24 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                  value={managerReport}
                  onChange={(event) => setManagerReport(event.target.value)}
                  placeholder="Provide key updates for owners..."
                  disabled={loading || submitting}
                />
              </div>

              {errorMessage ? (
                <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{errorMessage}</p>
              ) : null}

              <Button type="submit" className="w-full bg-slate-900 text-white hover:bg-slate-800" disabled={loading || submitting}>
                {submitting ? "Preparing Invite..." : "Invite All"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
