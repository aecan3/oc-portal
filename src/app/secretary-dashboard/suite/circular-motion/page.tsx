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

const STEPS = ["Step 1: Details", "Step 2: Review", "Step 3: Send"] as const;

export default function CircularMotionWizardPage() {
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

  const [motionTitle, setMotionTitle] = useState("");
  const [resolution, setResolution] = useState("");
  const [closingDate, setClosingDate] = useState("");
  const [otherPoints, setOtherPoints] = useState("");

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

  const onSendToOwners = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!supabase || !propertyId) return;

    setErrorMessage("");
    const trimmedTitle = motionTitle.trim();
    const trimmedResolution = resolution.trim();
    const trimmedClosing = closingDate.trim();

    if (!trimmedTitle || !trimmedResolution || !trimmedClosing) {
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
    const { error: insertError } = await supabase.from("motions").insert({
      property_id: propertyId,
      created_by: user.id,
      title: trimmedTitle,
      resolution: trimmedResolution,
      closing_date: new Date(trimmedClosing).toISOString(),
      other_points: otherPoints.trim() || null,
      status: "open",
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
    toast.success(`Motion sent. Notification placeholder prepared for ${ownerIds.length} owners.`);
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
            <CardTitle className="text-2xl font-bold tracking-tight">Initiate Circular Motion</CardTitle>
            <CardDescription>Consumer Affairs Victoria-aligned ballot drafting wizard.</CardDescription>
            <div className="mt-2 flex flex-wrap gap-2">
              {STEPS.map((step, index) => (
                <span
                  key={step}
                  className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                    index === 0 ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-600"
                  }`}
                >
                  {step}
                </span>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={onSendToOwners}>
              <div className="space-y-2">
                <Label htmlFor="motion-title">Motion Title</Label>
                <Input
                  id="motion-title"
                  placeholder="Roof Repair Approval"
                  value={motionTitle}
                  onChange={(event) => setMotionTitle(event.target.value)}
                  disabled={loading || submitting}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="resolution">The Resolution</Label>
                <textarea
                  id="resolution"
                  className="min-h-28 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                  placeholder="That the Owners Corporation approves..."
                  value={resolution}
                  onChange={(event) => setResolution(event.target.value)}
                  disabled={loading || submitting}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="closing-date">Closing Date</Label>
                <Input
                  id="closing-date"
                  type="datetime-local"
                  value={closingDate}
                  onChange={(event) => setClosingDate(event.target.value)}
                  disabled={loading || submitting}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="other-points">Any Other Points</Label>
                <textarea
                  id="other-points"
                  className="min-h-24 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                  placeholder="Additional context for owners..."
                  value={otherPoints}
                  onChange={(event) => setOtherPoints(event.target.value)}
                  disabled={loading || submitting}
                />
              </div>

              {errorMessage ? (
                <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{errorMessage}</p>
              ) : null}

              <Button type="submit" className="w-full bg-slate-900 text-white hover:bg-slate-800" disabled={loading || submitting}>
                {submitting ? "Sending..." : "Send to Owners"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
