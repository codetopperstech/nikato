import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { phone, name, shopName, shopPhone, address, city, pincode, lat, lng, radius } = await req.json()

    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
      phone,
      phone_confirm: true,
      user_metadata: { name, role: 'shop_owner' },
    })
    if (userError) throw userError

    const { error: profileError } = await supabase.from('profiles').upsert({
      id: userData.user.id,
      phone,
      name,
      role: 'shop_owner',
    })
    if (profileError) throw profileError

    const { error: shopError } = await supabase.from('shops').insert({
      owner_id: userData.user.id,
      name: shopName,
      phone: shopPhone,
      address,
      city,
      pincode,
      lat,
      lng,
      delivery_radius_km: radius,
      is_active: true,
    })
    if (shopError) throw shopError

    return NextResponse.json({ success: true, userId: userData.user.id })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
