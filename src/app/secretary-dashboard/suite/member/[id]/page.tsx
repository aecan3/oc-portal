"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { createBrowserSupabaseClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type ProfileRecord = {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  mobile_number?: string | null;
  occupancy_status?: string | null;
};

type JoinRequestRecord = {
  id: string;
  user_id: string;
  unit_number: string | null;
  applicant_email: string | null;
  status: string;
  created_at: string;
};

export default function SecretarySuiteMemberPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  // URL param here is expected to be the member user id (join_requests.user_id), not join_requests.id.
  const memberUserId = Array.isArray(params?.id) ? params.id[0] : params?.id;

  const supabase = useMemo(() => {
    try {
      return createBrowserSupabaseClient();
    } catch {
      return null;
    }
  }, []);

  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [profile, setProfile] = useState<ProfileRecord | null>(null);
  const [request, setRequest] = useState<JoinRequestRecord | null>(null);

  const loadMember = useCallback(async () => {
    if (!supabase || !memberUserId) {
      setErrorMessage("Unable to load member details.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setErrorMessage("");

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      setErrorMessage(userError?.message ?? "You must be signed in to view this member.");
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

    const { data: requestData, error: requestError } = await supabase
      .from("join_requests")
      .select("id,user_id,unit_number,applicant_email,status,created_at")
      .eq("property_id", property.id)
      .eq("user_id", memberUserId)
      .order("created_at", { ascending: false });

    if (requestError) {
      setErrorMessage(requestError.message);
      setLoading(false);
      return;
    }

    const allRequests = (requestData ?? []) as JoinRequestRecord[];
    const prioritized =
      allRequests.find((row) => row.status === "pending") ||
      allRequests.find((row) => row.status === "approved") ||
      allRequests[0] ||
      null;
    if (!prioritized) {
      setProfile(null);
      setRequest(null);
      setLoading(false);
      return;
    }

    // Logical join via join_requests.user_id -> profiles.id
    const { data: profileData, error: profileError } = await supabase
      .schema("public")
      .from("profiles")
      .select("id,first_name,last_name,mobile_number,occupancy_status")
      .eq("id", prioritized.user_id)
      .maybeSingle();

    if (profileError) console.log("Member profile fetch warning:", profileError);
    console.log("Fetched Profile Details:", profileData);

    setProfile((profileData ?? null) as ProfileRecord | null);
    setRequest(prioritized);
    setLoading(false);
  }, [memberUserId, supabase]);

  useEffect(() => {
    void loadMember();
  }, [loadMember]);

  const onRequestAction = async (nextStatus: "approved" | "rejected") => {
    if (!supabase || !request) return;
    setUpdating(true);

    const { error } = await supabase.from("join_requests").update({ status: nextStatus }).eq("id", request.id);
    setUpdating(false);
    if (error) {
      toast.error(error.message);
      return;
    }

    if (nextStatus === "approved") {
      toast.success("Member access approved.");
    } else {
      toast.success("Member access revoked.");
    }
    await loadMember();
    router.refresh();
  };

  const fullName =
    [profile?.first_name, profile?.last_name].filter(Boolean).join(" ").trim() ||
    request?.applicant_email ||
    "Member";

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 sm:px-6">
      <div className="mx-auto w-full max-w-3xl space-y-5">
        <Link
          href="/secretary-dashboard/suite"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 underline decoration-slate-300 underline-offset-4 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Building Register
        </Link>

        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-2xl font-bold tracking-tight">{loading ? "Loading member..." : fullName}</CardTitle>
            <CardDescription>Secretary member detail and access control center.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {errorMessage ? (
              <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{errorMessage}</p>
            ) : null}

            <div className="grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm sm:grid-cols-2">
              <p>
                <span className="font-semibold text-slate-900">First Name: </span>
                <span>{profile?.first_name || "Not provided"}</span>
              </p>
              <p>
                <span className="font-semibold text-slate-900">Last Name: </span>
                <span>{profile?.last_name || "Not provided"}</span>
              </p>
              <p>
                <span className="font-semibold text-slate-900">Mobile: </span>
                <span>{profile?.mobile_number || "Not provided"}</span>
              </p>
              <p>
                <span className="font-semibold text-slate-900">Email: </span>
                <span>{request?.applicant_email || "Not provided"}</span>
              </p>
              <p>
                <span className="font-semibold text-slate-900">Unit Number: </span>
                <span>{request?.unit_number || "Not provided"}</span>
              </p>
              <p>
                <span className="font-semibold text-slate-900">Occupancy Status: </span>
                <span>{profile?.occupancy_status || "Not provided"}</span>
              </p>
              <p>
                <span className="font-semibold text-slate-900">Status: </span>
                <span className="uppercase tracking-wide">{request?.status || "Not provided"}</span>
              </p>
            </div>

            {request?.status === "pending" ? (
              <div className="grid gap-2 sm:grid-cols-2">
                <Button type="button" className="h-11 bg-slate-900 text-white hover:bg-slate-800" onClick={() => void onRequestAction("approved")} disabled={updating}>
                  Approve Access
                </Button>
                <Button type="button" variant="outline" className="h-11 border-red-300 text-red-700 hover:bg-red-50" onClick={() => void onRequestAction("rejected")} disabled={updating}>
                  Decline Request
                </Button>
              </div>
            ) : request?.status === "approved" ? (
              <div className="space-y-3">
                <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                  Verified Member
                </span>
                <Button type="button" variant="outline" className="h-11 border-red-300 text-red-700 hover:bg-red-50" onClick={() => void onRequestAction("rejected")} disabled={updating}>
                  Revoke Access
                </Button>
              </div>
            ) : (
              <p className="text-sm text-slate-600">No pending or approved join request found for this member in your building.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
