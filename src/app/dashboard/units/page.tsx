import Link from "next/link";
import { Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function DashboardUnitsPage() {
  return (
    <main className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center bg-[#F5F2EC] px-4 py-10 sm:px-6">
      <Card className="w-full max-w-xl border-[#E5D8C8] bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[#5C3B2E]">
            <Users className="h-5 w-5 text-[#8B5A3C]" />
            Unit Management
          </CardTitle>
          <CardDescription>Assign owners to lots and manage occupancy.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm font-medium text-slate-600">
            This route is active and ready for the detailed unit assignment workflow.
          </p>
          <Button asChild className="mt-4">
            <Link href="/dashboard">Back to Dashboard</Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
