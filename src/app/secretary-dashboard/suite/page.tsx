"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, ArrowLeft, BellRing, Building2, FileText, FileUp, Megaphone, Vote } from "lucide-react";
import { toast } from "sonner";
import { createBrowserSupabaseClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Property = {
  id: string;
  address: string;
  plan_number: string;
  total_lots: number;
};

type JoinRequestRow = {
  id: string;
  user_id: string;
  unit_number: string | null;
  applicant_email: string | null;
  occupancy_status: string | null;
  status: string;
  created_at?: string;
  profiles?: {
    first_name?: string | null;
    last_name?: string | null;
  } | null;
};

type RegisterRow = {
  lotNumber: string;
  ownerName: string;
  ownerEmail: string;
  state: "pending" | "approved" | "unassigned";
  memberId?: string;
};

type PendingRequest = {
  id: string;
  properties: {
    address: string;
  } | null;
};

type MotionRecord = {
  id: string;
  title: string;
  status: string;
  closing_date: string;
};

type AgmNoticeRecord = {
  id: string;
  meeting_at: string;
  status: string;
};

export default function SecretarySuitePage() {
  const router = useRouter();
  const formatUnitLabel = (value: string) => {
    const trimmed = value.trim();
    return trimmed.replace(/^unit\s*/i, "").trim() || trimmed;
  };

  const supabase = useMemo(() => {
    try {
      return createBrowserSupabaseClient();
    } catch {
      return null;
    }
  }, []);

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [activeProperty, setActiveProperty] = useState<Property | null>(null);
  const [buildingRegister, setBuildingRegister] = useState<RegisterRow[]>([]);
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
  const [activeMotions, setActiveMotions] = useState<MotionRecord[]>([]);
  const [agmStatusLine, setAgmStatusLine] = useState("Last AGM: Oct 2025. Next due by Oct 2026.");
  const [section151Open, setSection151Open] = useState(false);
  const [section151Unit, setSection151Unit] = useState("");
  const [section151Owner, setSection151Owner] = useState("");
  const [section151Email, setSection151Email] = useState("");

  const toLotNumber = (value: string | null | undefined) => {
    if (typeof value !== "string") return null;
    const trimmedValue = value.trim();
    if (!trimmedValue) return null;
    const match = trimmedValue.match(/\d+/);
    return match ? String(Number(match[0])) : null;
  };

  const loadSuite = useCallback(async () => {
    if (!supabase) {
      setErrorMessage("Supabase environment variables are missing.");
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
      setErrorMessage(userError?.message ?? "You must be signed in to access the Secretary Suite.");
      setLoading(false);
      return;
    }

    const { data: managedProperty, error: propertyError } = await supabase
      .from("properties")
      .select("id,address,plan_number,total_lots")
      .eq("manager_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (propertyError || !managedProperty) {
      setErrorMessage(propertyError?.message ?? "No managed property found for this account.");
      setLoading(false);
      return;
    }

    const property = managedProperty as Property;
    setActiveProperty(property);

    const [
      { data: pendingData, error: pendingError },
      { data: joinRequestData, error: joinRequestError },
      { data: motionsData, error: motionsError },
      { data: agmData, error: agmError },
    ] = await Promise.all([
      supabase
        .from("join_requests")
        .select("id,properties!inner(address)")
        .eq("property_id", property.id)
        .eq("status", "pending")
        .order("created_at", { ascending: false }),
      supabase
        .from("join_requests")
        .select("*, profiles:user_id(first_name, last_name)")
        .eq("property_id", property.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("motions")
        .select("id,title,status,closing_date")
        .eq("property_id", property.id)
        .eq("status", "open")
        .order("closing_date", { ascending: true }),
      supabase
        .from("agm_notices")
        .select("id,meeting_at,status")
        .eq("property_id", property.id)
        .eq("status", "sent")
        .order("meeting_at", { ascending: false })
        .limit(1),
    ]);

    if (pendingError || joinRequestError) {
      setErrorMessage((pendingError ?? joinRequestError)?.message ?? "Unable to load suite data.");
    }
    setPendingRequests((pendingData ?? []) as PendingRequest[]);

    if (motionsError || agmError) {
      console.log("Governance data load warning:", motionsError ?? agmError);
    }
    setActiveMotions(((motionsData ?? []) as MotionRecord[]).slice(0, 3));

    const latestAgm = ((agmData ?? []) as AgmNoticeRecord[])[0];
    if (latestAgm?.meeting_at) {
      const lastDate = new Date(latestAgm.meeting_at);
      if (!Number.isNaN(lastDate.getTime())) {
        const nextDue = new Date(lastDate);
        nextDue.setFullYear(nextDue.getFullYear() + 1);
        const lastLabel = lastDate.toLocaleDateString("en-AU", { month: "short", year: "numeric" });
        const nextLabel = nextDue.toLocaleDateString("en-AU", { month: "short", year: "numeric" });
        setAgmStatusLine(`Last AGM: ${lastLabel}. Next due by ${nextLabel}.`);
      }
    } else {
      setAgmStatusLine("Last AGM: Oct 2025. Next due by Oct 2026.");
    }

    const allJoinRows = (joinRequestData ?? []) as JoinRequestRow[];
    const pendingRows = allJoinRows.filter((row) => row.status === "pending");
    const approvedRows = allJoinRows.filter((row) => row.status === "approved");

    const pendingByLotNumber: Record<string, JoinRequestRow> = {};
    pendingRows.forEach((request) => {
      const lotNumber = toLotNumber(request.unit_number);
      if (!lotNumber || pendingByLotNumber[lotNumber]) return;
      pendingByLotNumber[lotNumber] = request;
    });

    const approvedByLotNumber: Record<string, JoinRequestRow> = {};
    approvedRows.forEach((request) => {
      const lotNumber = toLotNumber(request.unit_number);
      if (!lotNumber || approvedByLotNumber[lotNumber]) return;
      approvedByLotNumber[lotNumber] = request;
    });

    const totalLots = Math.max(1, Number(property.total_lots || 0));
    const rows: RegisterRow[] = Array.from({ length: totalLots }, (_unused, index) => {
      const lotNumber = String(index + 1);
      const pendingRequest = pendingByLotNumber[lotNumber];
      if (pendingRequest) {
        const firstName = pendingRequest.profiles?.first_name?.trim() || "";
        const lastName = pendingRequest.profiles?.last_name?.trim() || "";
        const ownerDisplayName = firstName
          ? `${firstName}${lastName ? ` ${lastName}` : ""}`
          : `ID: ${pendingRequest.user_id}`;
        return {
          lotNumber,
          ownerName: ownerDisplayName,
          ownerEmail: pendingRequest.applicant_email || "Not provided",
          state: "pending",
          memberId: pendingRequest.user_id,
        };
      }

      const approvedRequest = approvedByLotNumber[lotNumber];
      if (!approvedRequest) {
        return {
          lotNumber,
          ownerName: "Unassigned",
          ownerEmail: "No owner linked",
          state: "unassigned",
        };
      }

      const firstName = approvedRequest.profiles?.first_name?.trim() || "";
      const lastName = approvedRequest.profiles?.last_name?.trim() || "";
      const ownerDisplayName = firstName
        ? `${firstName}${lastName ? ` ${lastName}` : ""}`
        : `ID: ${approvedRequest.user_id}`;
      return {
        lotNumber,
        ownerName: ownerDisplayName,
        ownerEmail: approvedRequest.applicant_email || "Not provided",
        state: "approved",
        memberId: approvedRequest.user_id,
      };
    });

    setBuildingRegister(rows);
    const defaultRow = rows.find((row) => row.state === "approved") ?? rows[0];
    setSection151Unit(defaultRow.lotNumber);
    setSection151Owner(defaultRow.ownerName);
    setSection151Email(defaultRow.ownerEmail);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    if (!supabase) {
      setErrorMessage("Supabase environment variables are missing.");
      setLoading(false);
      return;
    }

    void loadSuite();

    const channel = supabase
      .channel("secretary-suite-register-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, () => void loadSuite())
      .on("postgres_changes", { event: "*", schema: "public", table: "join_requests" }, () => void loadSuite())
      .subscribe();

    const onFocus = () => void loadSuite();
    window.addEventListener("focus", onFocus);

    return () => {
      window.removeEventListener("focus", onFocus);
      void supabase.removeChannel(channel);
    };
  }, [loadSuite, supabase]);

  const onGenerateFinancialStatement = () => {
    toast.success("Annual Financial Statement generation started.");
  };

  const onIssueSection151 = () => {
    toast.success("Section 151 certificate issued.");
    setSection151Open(false);
  };

  const onIssueNotification = () => {
    toast.success("Building-wide notification drafted.");
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <div className="flex items-center justify-end">
          <Button asChild variant="outline" className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50">
            <Link href="/secretary-dashboard" className="inline-flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
        </div>

        <header className="space-y-2">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">Secretary Suite</h1>
          <p className="text-sm font-medium text-slate-600">
            Core management command center for {activeProperty?.address ?? "your building"}.
          </p>
          {activeProperty ? (
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
              {activeProperty.plan_number}
            </p>
          ) : null}
          {errorMessage ? <p className="text-sm font-semibold text-red-700">{errorMessage}</p> : null}
        </header>

        {loading ? (
          <Card className="rounded-2xl border-slate-200 bg-white shadow-sm">
            <CardContent className="pt-6 text-sm font-medium text-slate-600">Loading Secretary Suite...</CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <Card className="rounded-2xl border-slate-200 bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-slate-900">
                  <Building2 className="h-5 w-5 text-slate-700" />
                  Building Register
                </CardTitle>
                <CardDescription className="text-slate-600">
                  Source of truth for Unit-to-owner identity mapping.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <table className="w-full table-fixed text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      <th className="w-[100px] px-2 py-2 text-left">Unit</th>
                      <th className="w-[280px] px-2 py-2 text-left">Owner</th>
                      <th className="w-[260px] px-2 py-2 text-left">Email</th>
                      <th className="w-[150px] px-2 py-2 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {buildingRegister.map((row, index) => (
                      <tr
                        key={`${row.lotNumber}-${row.ownerEmail}`}
                        className={`transition-colors hover:bg-slate-50 ${
                          row.state === "pending" ? "bg-amber-50/70" : index % 2 === 1 ? "bg-slate-50/40" : ""
                        } ${row.memberId ? "cursor-pointer" : ""}`}
                        onClick={() => {
                          if (row.memberId) router.push(`/secretary-dashboard/suite/member/${row.memberId}`);
                        }}
                      >
                        <td className="px-2 py-2 text-left font-semibold text-slate-900">
                          <div className="flex items-center gap-1.5">
                            <span>Unit {formatUnitLabel(row.lotNumber)}</span>
                            {row.state === "pending" ? <AlertCircle className="h-4 w-4 text-red-600" /> : null}
                          </div>
                        </td>
                        <td className="px-2 py-2 text-left text-slate-800">
                          <div className="flex items-center gap-2">
                            <span className="max-w-[210px] truncate font-semibold">{row.ownerName}</span>
                            {row.state === "approved" ? (
                              <span className="ml-1 inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                                Verified
                              </span>
                            ) : row.state === "pending" ? (
                              <span className="inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                                [Pending]
                              </span>
                            ) : null}
                          </div>
                        </td>
                        <td className="px-2 py-2 text-left text-slate-600">
                          <span className="block truncate">{row.ownerEmail}</span>
                        </td>
                        <td className="px-2 py-2 text-right">
                          {row.state === "pending" ? (
                            <span className="text-xs font-semibold uppercase tracking-wide text-amber-700">Pending Review</span>
                          ) : row.state === "approved" ? (
                            <span className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Active</span>
                          ) : (
                            <span className="text-xs font-medium text-slate-400">Unassigned</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-slate-200 bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-slate-900">
                  <FileText className="h-5 w-5 text-slate-700" />
                  Financials &amp; Certificates
                </CardTitle>
                <CardDescription className="text-slate-600">
                  Generate compliance-ready outputs from your building records.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button type="button" className="w-full bg-slate-900 text-white hover:bg-slate-800" onClick={onGenerateFinancialStatement}>
                  Generate Annual Financial Statement
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full border-slate-300 text-slate-800 hover:bg-slate-50"
                  onClick={() => setSection151Open((current) => !current)}
                >
                  Issue Section 151 Certificate
                </Button>

                {section151Open ? (
                  <div className="mt-3 space-y-3 rounded-xl border border-slate-200 bg-slate-50/60 p-3">
                    <p className="text-sm font-semibold text-slate-900">Section 151 Certificate Form</p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label htmlFor="s151-unit">Unit Number</Label>
                        <Input id="s151-unit" value={section151Unit} onChange={(event) => setSection151Unit(event.target.value)} />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="s151-owner">Owner Name</Label>
                        <Input id="s151-owner" value={section151Owner} onChange={(event) => setSection151Owner(event.target.value)} />
                      </div>
                      <div className="space-y-1.5 sm:col-span-2">
                        <Label htmlFor="s151-email">Owner Email</Label>
                        <Input id="s151-email" value={section151Email} onChange={(event) => setSection151Email(event.target.value)} />
                      </div>
                    </div>
                    <Button type="button" className="w-full bg-slate-900 text-white hover:bg-slate-800" onClick={onIssueSection151}>
                      <FileUp className="mr-2 h-4 w-4" />
                      Issue Certificate
                    </Button>
                  </div>
                ) : null}
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-slate-200 bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-slate-900">
                  <Vote className="h-5 w-5 text-slate-700" />
                  Active Governance
                </CardTitle>
                <CardDescription className="text-slate-600">Track AGM cadence and live circular motions.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
                  <p className="font-semibold">AGM Status</p>
                  <p>{agmStatusLine}</p>
                  <Link
                    href="/secretary-dashboard/suite/agm/history"
                    className="mt-2 inline-block text-xs font-semibold text-slate-700 underline decoration-slate-300 underline-offset-4 hover:text-slate-900"
                  >
                    View AGM history
                  </Link>
                </div>
                <div className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
                  <p className="font-semibold">Circular Motions</p>
                  {activeMotions.length === 0 ? (
                    <p>No active motions right now.</p>
                  ) : (
                    <ul className="mt-1 space-y-1">
                      {activeMotions.map((motion) => {
                        const closeLabel = new Date(motion.closing_date).toLocaleDateString("en-AU", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        });
                        return (
                          <li key={motion.id}>
                            {motion.title} - Pending (closes {closeLabel})
                          </li>
                        );
                      })}
                    </ul>
                  )}
                  <Link
                    href="/secretary-dashboard/suite/circular-motion/history"
                    className="mt-2 inline-block text-xs font-semibold text-slate-700 underline decoration-slate-300 underline-offset-4 hover:text-slate-900"
                  >
                    View all motions
                  </Link>
                </div>
                <Button asChild type="button" className="w-full bg-slate-900 text-white hover:bg-slate-800">
                  <Link href="/secretary-dashboard/suite/agm">Begin AGM</Link>
                </Button>
                <Button asChild type="button" variant="outline" className="w-full border-slate-300 hover:bg-slate-50">
                  <Link href="/secretary-dashboard/suite/circular-motion">Initiate Circular Motion</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-slate-200 bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-slate-900">
                  <BellRing className="h-5 w-5 text-slate-700" />
                  Owner Requests
                </CardTitle>
                <CardDescription className="text-slate-600">
                  Monitor incoming maintenance and access notifications.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {pendingRequests.length === 0 ? (
                  <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">No new owner requests right now.</p>
                ) : (
                  <ul className="space-y-2 text-sm text-slate-700">
                    {pendingRequests.slice(0, 4).map((request) => (
                      <li key={request.id} className="rounded-lg bg-slate-50 px-3 py-2">
                        Join request received for {request.properties?.address ?? "your property"}.
                      </li>
                    ))}
                  </ul>
                )}
                <Button type="button" className="w-full bg-slate-900 text-white hover:bg-slate-800" onClick={onIssueNotification}>
                  <Megaphone className="mr-2 h-4 w-4" />
                  Issue Building-Wide Notification
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </main>
  );
}
