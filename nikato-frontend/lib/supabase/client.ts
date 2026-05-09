// ============================================================
// NIKATO — lib/supabase/client.ts
// Browser-side Supabase client (singleton)
// Blueprint Section 05: Session Management Rules
// ============================================================

import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/database.types';

let client: ReturnType<typeof createBrowserClient<Database>> | null = null;

/**
 * Returns a singleton Supabase browser client.
 * Initialized once per browser session — never re-created.
 * JWT stored in httpOnly cookie (never localStorage).
 */
export function getSupabaseBrowserClient() {
  if (client) return client;

  client = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        // Handled by SSR package — uses secure httpOnly cookies
      },
    }
  );

  return client;
}

// Convenience alias used throughout frontend hooks
export const supabase = getSupabaseBrowserClient();
