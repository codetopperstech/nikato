import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const path = req.nextUrl.pathname

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => {
            res.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Not logged in — redirect to login
  if (!user) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // Get role from user metadata first (fast), fallback to DB
  let role: string | null =
    user.app_metadata?.user_role ||
    user.app_metadata?.role ||
    user.user_metadata?.role ||
    null

  // If not in metadata, fetch from DB (one query, cached by Supabase)
  if (!role) {
    const { data } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    role = data?.role ?? null
  }

  if (path.startsWith('/admin') && role !== 'admin') {
    return NextResponse.redirect(new URL('/unauthorized', req.url))
  }

  if (path.startsWith('/shop') && role !== 'shop_owner') {
    return NextResponse.redirect(new URL('/unauthorized', req.url))
  }

  if (path.startsWith('/delivery') && role !== 'delivery') {
    return NextResponse.redirect(new URL('/unauthorized', req.url))
  }

  return res
}

export const config = {
  matcher: ['/admin/:path*', '/shop/:path*', '/delivery/:path*'],
}
