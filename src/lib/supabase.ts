import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

/**
 * Reads `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
 * Trims whitespace (a common cause of "Failed to fetch" / invalid host errors).
 * Ensures the project URL uses HTTPS.
 */
export function getSupabaseProjectConfig(): { url: string; anonKey: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? "";

  if (!url || !anonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. Add them to .env.local and restart the dev server."
    );
  }

  if (!/^https:\/\//i.test(url)) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL must start with https:// (Supabase project URLs are always HTTPS)."
    );
  }

  try {
    // Throws if malformed
    new URL(url);
  } catch {
    throw new Error(`NEXT_PUBLIC_SUPABASE_URL is not a valid URL: ${url.slice(0, 80)}`);
  }

  return { url, anonKey };
}

/**
 * Browser / client components: single place to create the Supabase client with validated env.
 * Prevents silent `undefined` URL/key which surfaces as generic TypeError / Failed to fetch.
 */
export function createBrowserSupabaseClient(): SupabaseClient<Database> {
  const { url, anonKey } = getSupabaseProjectConfig();
  return createBrowserClient<Database>(url, anonKey);
}
