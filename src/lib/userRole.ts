import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

export type AppUserRole = "manager" | "owner" | "unknown";

export async function resolveUserRole(supabase: SupabaseClient<Database>, userId: string): Promise<AppUserRole> {
  const { data: managedProperty, error: managerError } = await supabase
    .from("properties")
    .select("id")
    .eq("manager_id", userId)
    .limit(1)
    .maybeSingle();

  if (managerError) {
    throw managerError;
  }
  if (managedProperty?.id) {
    return "manager";
  }

  const { data: approvedJoin, error: ownerError } = await supabase
    .from("join_requests")
    .select("id")
    .eq("user_id", userId)
    .eq("status", "approved")
    .limit(1)
    .maybeSingle();

  if (ownerError) {
    throw ownerError;
  }
  if (approvedJoin?.id) {
    return "owner";
  }

  return "unknown";
}

export function roleHomePath(role: AppUserRole): string {
  if (role === "manager") return "/secretary-dashboard";
  if (role === "owner") return "/owner-dashboard";
  return "/onboarding";
}
