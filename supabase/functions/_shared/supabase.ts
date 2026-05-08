// supabase/functions/_shared/supabase.ts
// Supabase admin client for Edge Functions (bypasses RLS)

import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

let _adminClient: SupabaseClient | null = null;

/** Returns a Supabase client using the SERVICE_ROLE key (bypasses RLS). */
export function getAdminClient(): SupabaseClient {
  if (_adminClient) return _adminClient;

  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!url || !key) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }

  _adminClient = createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return _adminClient;
}

/** Returns a Supabase client scoped to the requesting user's JWT. */
export function getUserClient(authHeader: string | null): SupabaseClient {
  const url = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

  return createClient(url, anonKey, {
    global: {
      headers: { Authorization: authHeader ?? "" },
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
