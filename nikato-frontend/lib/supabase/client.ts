// lib/supabase/client.ts — Browser-side Supabase client (singleton)

import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/database.types';

let client: ReturnType<typeof createBrowserClient<Database>> | null = null;

export function getSupabaseBrowserClient() {
  if (client) return client;
  client = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
  return client;
}

// ✅ Lazy getter — NOT initialized at module level (avoids SSR/build crash)
// Usage: import { supabase } from '@/lib/supabase/client'
// Note: this is a getter, so it's called only when accessed
export const supabase = new Proxy({} as ReturnType<typeof createBrowserClient<Database>>, {
  get(_target, prop) {
    return getSupabaseBrowserClient()[prop as keyof ReturnType<typeof createBrowserClient<Database>>];
  }
});
