"use client";

import { CheckCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createBrowserSupabaseClient } from "@/lib/supabase";

export default function JoinSuccessPage() {
  const router = useRouter();
  const supabase = useMemo(() => {
    try {
      return createBrowserSupabaseClient();
    } catch {
      return null;
    }
  }, []);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleReturnToLogin = async () => {
    if (isSigningOut) return;
    setIsSigningOut(true);

    if (supabase) {
      await supabase.auth.signOut();
    }

    router.replace("/login");
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10 sm:px-6">
      <Card className="w-full max-w-xl border-slate-200 bg-white shadow-sm">
        <CardHeader className="items-center text-center">
          <CheckCircle className="mb-6 h-20 w-20 text-green-500" />
          <CardTitle className="text-3xl font-extrabold tracking-tight text-slate-900">
            Request Sent Successfully!
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 text-center">
          <p className="text-sm font-medium leading-relaxed text-slate-600 sm:text-base">
            We have notified your Owners Corporation secretary. Once they review and approve your request, you will be
            able to log in and access your owner dashboard.
          </p>
          <Button type="button" className="w-full" onClick={() => void handleReturnToLogin()} disabled={isSigningOut}>
            {isSigningOut ? "Signing out..." : "Return to Login"}
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
