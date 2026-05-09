// ============================================================
// NIKATO — lib/supabase/server.ts
// Server-side Supabase client (RSC + Route Handlers)
// Blueprint Section 05: Session Management Rules
// ============================================================

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@/types/database.types';

/**
 * Creates a Supabase server client for use in:
 *  - React Server Components
 *  - Next.js Route Handlers (app/api/**)
 *  - Server Actions
 *
 * Must be called inside a request context (not at module level).
 * Uses httpOnly cookie storage — JWT never in localStorage.
 */
export async function getSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              cookieStore.set(name, value, options as any)
            );
          } catch {
            // setAll called from Server Component — cookies are read-only
            // Middleware handles cookie refresh
          }
        },
      },
    }
  );
}

/**
 * Shorthand for getting the authenticated user in RSC.
 * Returns null if not authenticated.
 */
export async function getServerUser() {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/**
 * Shorthand for getting full profile from DB in RSC.
 */
export async function getServerProfile() {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return profile;
}
