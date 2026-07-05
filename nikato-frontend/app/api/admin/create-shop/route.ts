import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

async function verifyAdmin() {
  const cookieStore = await cookies()
  const uc = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )
  const { data: { user } } = await uc.auth.getUser()
  if (!user) return null
  const { data: profile } = await uc.from('profiles').select('role').eq('id', user.id).single()
  return profile?.role === 'admin' ? user : null
}

export async function POST(req: NextRequest) {
  try {
    const supabaseAdmin = getAdminClient()

    const admin = await verifyAdmin()
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { owner_phone, owner_name, shop_name, shop_phone, address, city, pincode, latitude, longitude, delivery_radius, min_order, commission, logo_url } = body

    const { data: newUser, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
      phone: owner_phone,
      phone_confirm: true,
      user_metadata: { role: 'shop_owner', name: owner_name }
    })

    if (createUserError) return NextResponse.json({ error: createUserError.message }, { status: 400 })

    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({ id: newUser.user.id, phone: owner_phone, full_name: owner_name, role: 'shop_owner' })

    if (profileError) {
      await supabaseAdmin.auth.admin.deleteUser(newUser.user.id)
      return NextResponse.json({ error: profileError.message }, { status: 400 })
    }

    const { data: shop, error: shopError } = await supabaseAdmin
      .from('shops')
      .insert({
        owner_id: newUser.user.id,
        name: shop_name,
        phone: shop_phone,
        address_line: address,
        city,
        pincode,
        lat: parseFloat(latitude),
        lng: parseFloat(longitude),
        delivery_radius_km: parseFloat(delivery_radius),
        min_order_amount: parseFloat(min_order) || 0,
        commission_rate: parseFloat(commission) || 0.1,
        logo_url: logo_url || null,
        is_approved: false,
      })
      .select()
      .single()

    if (shopError) {
      await supabaseAdmin.auth.admin.deleteUser(newUser.user.id)
      return NextResponse.json({ error: shopError.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, shop, user: newUser.user })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
