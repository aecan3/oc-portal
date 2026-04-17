"use client";

import Link from "next/link";
import { ClipboardList, Home, ShieldAlert, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createBrowserSupabaseClient } from "@/lib/supabase";
import { toast } from "sonner";

type PendingJoinTask = {
  id: string;
  user_id: string;
  property_id: string;
  status: string;
  created_at: string;
  properties: {
    address: string;
    plan_number: string;
  } | null;
};

type RequesterProfile = {
  id: string;
  email?: string | null;
};

export default function DashboardTasksPage() {
  const router = useRouter();
  const supabase = useMemo(() => {
    try {
      return createBrowserSupabaseClient();
    } catch {
      return null;
    }
  }, []);

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [isManager, setIsManager] = useState(false);
  const [pendingJoinTasks, setPendingJoinTasks] = useState<PendingJoinTask[]>([]);
  const [requesterById, setRequesterById] = useState<Record<string, RequesterProfile>>({});
  const [updatingRequestId, setUpdatingRequestId] = useState<string | null>(null);

  const fetchPendingTasks = useCallback(
    async (managedPropertyIds: string[]) => {
      if (!supabase) return;
      if (managedPropertyIds.length === 0) {
        setPendingJoinTasks([]);
        setRequesterById({});
        return;
      }

      const { data: joinData, error: joinError } = await supabase
        .from("join_requests")
        .select("id,user_id,property_id,status,created_at,properties!inner(address, plan_number)")
        .in("property_id", managedPropertyIds)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (joinError) {
        setErrorMessage(joinError.message);
        return;
      }

      const tasks = (joinData ?? []) as PendingJoinTask[];
      setPendingJoinTasks(tasks);

      const requesterIds = Array.from(new Set(tasks.map((task) => task.user_id).filter(Boolean)));
      if (requesterIds.length === 0) {
        setRequesterById({});
        return;
      }

      const { data: profileRows } = await supabase.from("profiles").select("id,email").in("id", requesterIds);
      const profileMap = ((profileRows ?? []) as RequesterProfile[]).reduce<Record<string, RequesterProfile>>(
        (acc, profile) => {
          acc[profile.id] = profile;
          return acc;
        },
        {},
      );
      setRequesterById(profileMap);
    },
    [supabase],
  );

  useEffect(() => {
    if (!supabase) {
      setErrorMessage("Supabase environment variables are missing.");
      setLoading(false);
      return;
    }

    let cancelled = false;

    const loadTasks = async () => {
      setLoading(true);
      setErrorMessage("");

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (cancelled) return;
      if (userError || !user) {
        setErrorMessage(userError?.message ?? "You must be signed in to view active tasks.");
        setLoading(false);
        return;
      }

      const { data: propertiesData, error: propertiesError } = await supabase
        .from("properties")
        .select("id,address,plan_number")
        .eq("manager_id", user.id)
        .order("created_at", { ascending: false });

      if (cancelled) return;
      if (propertiesError) {
        setErrorMessage(propertiesError.message);
        setLoading(false);
        return;
      }

      const managedPropertyIds = (propertiesData ?? []).map((property) => property.id);
      const managerView = managedPropertyIds.length > 0;
      setIsManager(managerView);

      if (!managerView) {
        setPendingJoinTasks([]);
        router.replace("/owner-dashboard");
        setLoading(false);
        return;
      }

      if (cancelled) return;
      await fetchPendingTasks(managedPropertyIds);
      if (cancelled) return;
      setLoading(false);
    };

    void loadTasks();

    return () => {
      cancelled = true;
    };
  }, [fetchPendingTasks, router, supabase]);

  const handleRequestAction = async (requestId: string, newStatus: "approved" | "rejected") => {
    if (!supabase) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    setUpdatingRequestId(requestId);
    setErrorMessage("");

    const { error } = await supabase.from("join_requests").update({ status: newStatus }).eq("id", requestId);
    if (error) {
      setErrorMessage(error.message);
      toast.error(error.message);
      setUpdatingRequestId(null);
      return;
    }

    if (newStatus === "approved") {
      toast.success("User approved. They now have access to the building portal.");
    } else {
      toast.success("Join request declined.");
    }

    const { data: managedProperties } = await supabase.from("properties").select("id").eq("manager_id", user.id);
    const managedPropertyIds = (managedProperties ?? []).map((property) => property.id);
    await fetchPendingTasks(managedPropertyIds);
    setUpdatingRequestId(null);
  };

  return (
    <main className="min-h-screen bg-[#F5F2EC] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-5xl space-y-6">
        <header className="space-y-2">
          <h1 className="flex items-center gap-2 text-3xl font-extrabold tracking-tight text-[#5C3B2E]">
            <ClipboardList className="h-7 w-7 text-[#8B5A3C]" />
            Active Tasks
          </h1>
          <p className="text-sm font-medium text-[#6F5A4D]">
            Manager task queue including join approvals and recurring governance reminders.
          </p>
        </header>

        {errorMessage ? <p className="text-sm font-medium text-red-600">{errorMessage}</p> : null}

        {loading ? (
          <Card className="border-[#E5D8C8] bg-white shadow-sm">
            <CardContent className="pt-6 text-sm font-medium text-slate-600">Loading active tasks...</CardContent>
          </Card>
        ) : isManager ? (
          <div className="space-y-4">
            <Card className="border-[#E5D8C8] bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-[#5C3B2E]">
                  <UserPlus className="h-5 w-5 text-[#8B5A3C]" />
                  Pending Join Requests
                </CardTitle>
                <CardDescription>
                  Review and action all owners waiting for portal access.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {pendingJoinTasks.length === 0 ? (
                  <p className="text-sm font-medium text-slate-600">No pending requests right now.</p>
                ) : (
                  pendingJoinTasks.map((task) => (
                    <div key={task.id} className="rounded-lg border border-[#EEE2D5] bg-[#FBF8F3] px-3 py-2.5">
                      <p className="text-sm font-semibold text-slate-900">
                        {requesterById[task.user_id]?.email ?? `User ID: ${task.user_id.slice(0, 8)}...`}
                      </p>
                      <p className="mt-1 text-sm font-medium text-slate-700">
                        {task.properties?.address ?? "Managed property"}
                      </p>
                      {task.properties?.plan_number ? (
                        <p className="mt-1 text-xs font-medium text-slate-600">
                          Plan Number: {task.properties.plan_number}
                        </p>
                      ) : null}
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button
                          type="button"
                          className="bg-emerald-600 text-white hover:bg-emerald-700"
                          disabled={updatingRequestId === task.id}
                          onClick={() => void handleRequestAction(task.id, "approved")}
                        >
                          Approve Access
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          disabled={updatingRequestId === task.id}
                          onClick={() => void handleRequestAction(task.id, "rejected")}
                        >
                          Decline
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card className="border-[#E5D8C8] bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[#5C3B2E]">
                <ShieldAlert className="h-5 w-5 text-[#8B5A3C]" />
                Owner View
              </CardTitle>
              <CardDescription>Task controls are available to your property secretary.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-medium text-slate-600">
                You currently do not have manager permissions, so active management tasks are hidden.
              </p>
            </CardContent>
          </Card>
        )}

        <Button asChild variant="outline">
          <Link href="/secretary-dashboard" className="inline-flex items-center gap-2">
            <Home className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
      </div>
    </main>
  );
}
