import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// ✅ Lazy client — created inside handler, not at module level (avoids build crash)
function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function POST(req: NextRequest) {
  try {
    const supabaseAdmin = getAdminClient()

    const authHeader = req.headers.get('authorization')
    if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Requires role: admin' }, { status: 403 })
    }

    const body = await req.json()
    const { owner_phone, owner_name, shop_name, shop_phone, address, city, pincode, latitude, longitude, delivery_radius, min_order, commission } = body

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
