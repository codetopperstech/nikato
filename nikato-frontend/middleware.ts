// ============================================================
// NIKATO — middleware.ts
// Auth guard + role-based portal routing
// Blueprint Section 05: Auth Flow
// ============================================================

import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            req.cookies.set(name, value);
            res.cookies.set(name, value, {
              ...options,
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'strict',
            });
          });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = req.nextUrl.pathname;

  // ── Unauthenticated redirect ──────────────────────────────
  if (!user) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('redirect', path);
    return NextResponse.redirect(loginUrl);
  }

  // ── Extract role from JWT custom claim ────────────────────
  const role = user.app_metadata?.user_role as string | undefined;

  // ── Role-based portal protection ─────────────────────────
  if (path.startsWith('/shop') && role !== 'shop_owner') {
    return NextResponse.redirect(new URL('/unauthorized', req.url));
  }

  if (path.startsWith('/delivery') && role !== 'delivery') {
    return NextResponse.redirect(new URL('/unauthorized', req.url));
  }

  if (path.startsWith('/admin') && role !== 'admin') {
    return NextResponse.redirect(new URL('/unauthorized', req.url));
  }

  return res;
}

export const config = {
  matcher: [
    '/shop/:path*',
    '/delivery/:path*',
    '/admin/:path*',
    // Customer routes that require auth
    '/cart',
    '/checkout/:path*',
    '/orders/:path*',
    '/profile/:path*',
    '/notifications',
  ],
};
