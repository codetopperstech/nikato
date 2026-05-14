import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

async function verifyAdmin() {
  const cookieStore = await cookies()
  const userClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )
  const { data: { user } } = await userClient.auth.getUser()
  if (!user) return null
  const { data: profile } = await userClient.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return null
  return user
}

export async function POST(req: NextRequest) {
  try {
    const user = await verifyAdmin()
    if (!user) return NextResponse.json({ error: 'Requires role: admin' }, { status: 403 })

    const { phone, full_name } = await req.json()

    if (!phone || !full_name) {
      return NextResponse.json({ error: 'phone and full_name are required' }, { status: 400 })
    }

    const e164 = /^\+[1-9]\d{6,14}$/
    if (!e164.test(phone)) {
      return NextResponse.json({ error: 'Invalid phone. Use format: +91XXXXXXXXXX' }, { status: 400 })
    }

    const admin = getAdminClient()

    // ✅ If already exists — return success instead of 409 error
    const { data: existing } = await admin.from('profiles').select('id, phone, full_name, role').eq('phone', phone).single()
    if (existing) {
      return NextResponse.json({
        success: true,
        already_existed: true,
        user_id: existing.id,
        phone,
        full_name: existing.full_name,
        message: 'Delivery partner already exists with this phone number'
      }, { status: 200 })
    }

    // Create auth user
    const { data: newUser, error: createErr } = await admin.auth.admin.createUser({
      phone,
      phone_confirm: true,
      user_metadata: { full_name, role: 'delivery' },
    })
    if (createErr || !newUser.user) {
      return NextResponse.json({ error: createErr?.message ?? 'Failed to create user' }, { status: 500 })
    }

    const uid = newUser.user.id

    await admin.from('profiles').upsert({ id: uid, phone, full_name, role: 'delivery' })
    await admin.from('delivery_locations').upsert({ delivery_partner_id: uid, lat: 0, lng: 0, is_online: false })

    return NextResponse.json({ success: true, user_id: uid, phone, full_name }, { status: 201 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
