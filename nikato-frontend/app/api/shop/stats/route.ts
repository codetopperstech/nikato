// Server-side shop stats — bypasses RLS with service role
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

function getAdminClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { autoRefreshToken: false, persistSession: false } });
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const userClient = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const admin = getAdminClient();
    const { data: shop } = await admin.from('shops').select('id').eq('owner_id', user.id).single();
    if (!shop) return NextResponse.json({ error: 'Shop not found' }, { status: 404 });

    const today = new Date(); today.setHours(0, 0, 0, 0);
    const weekAgo = new Date(Date.now() - 7 * 86400000);
    const monthAgo = new Date(Date.now() - 30 * 86400000);

    const { data: orders } = await admin.from('orders')
      .select('shop_earning, commission_amount, total_amount, status, created_at')
      .eq('shop_id', shop.id)
      .gte('created_at', monthAgo.toISOString());

    const rows = orders ?? [];
    const delivered = rows.filter(r => r.status === 'delivered');
    const todayRows = delivered.filter(r => new Date(r.created_at) >= today);
    const weekRows = delivered.filter(r => new Date(r.created_at) >= weekAgo);

    const sum = (arr: typeof rows, key: 'shop_earning' | 'total_amount') =>
      arr.reduce((s, r) => s + Number(r[key] ?? 0), 0);

    return NextResponse.json({
      shopId: shop.id,
      today: { orders: todayRows.length, revenue: sum(todayRows, 'shop_earning') },
      week: { orders: weekRows.length, revenue: sum(weekRows, 'shop_earning') },
      month: { orders: delivered.length, revenue: sum(delivered, 'shop_earning') },
      pending: rows.filter(r => r.status === 'pending').length,
      active: rows.filter(r => ['confirmed', 'preparing', 'ready', 'picked_up'].includes(r.status)).length,
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
