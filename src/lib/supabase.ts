import { createClient } from "@supabase/supabase-js";

/**
 * Server-only Supabase client.
 *
 * This uses the service-role key, which bypasses row-level security, so it
 * must never be imported into a client component. Neither env var carries the
 * NEXT_PUBLIC_ prefix, so Next will refuse to inline them into browser
 * bundles — that is the safety net.
 */
export function supabaseAdmin() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Supabase is not configured. Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to .env.local.",
    );
  }

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
