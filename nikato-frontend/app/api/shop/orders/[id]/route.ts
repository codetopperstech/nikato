import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

function getAdminClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { autoRefreshToken: false, persistSession: false } });
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const cookieStore = await cookies();
    const userClient = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const admin = getAdminClient();
    const { data: shop } = await admin.from('shops').select('id').eq('owner_id', user.id).single();
    if (!shop) return NextResponse.json({ error: 'Shop not found' }, { status: 403 });

    const { data: order, error } = await admin
      .from('orders')
      .select(`
        *,
        order_items(*, product:products(name, image_url)),
        customer:profiles!customer_id(full_name, phone),
        delivery_address:addresses!delivery_address_id(address_line, city, pincode, lat, lng)
      `)
      .eq('id', id)
      .eq('shop_id', shop.id)
      .single();

    if (error || !order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    return NextResponse.json({ order });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
