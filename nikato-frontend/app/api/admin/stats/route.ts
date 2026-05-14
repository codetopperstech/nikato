// app/api/admin/stats/route.ts — uses service role to bypass RLS
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

async function verifyAdmin() {
  const cookieStore = await cookies();
  const userClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) return null;
  const { data: p } = await userClient.from('profiles').select('role').eq('id', user.id).single();
  return p?.role === 'admin' ? user : null;
}

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function GET() {
  const user = await verifyAdmin();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = getAdminClient();
  const today = new Date().toISOString().split('T')[0];

  const [shops, pendingShops, orders, riders, users, pendingOrders, recent] = await Promise.all([
    admin.from('shops').select('*', { count: 'exact', head: true }).eq('is_approved', true),
    admin.from('shops').select('*', { count: 'exact', head: true }).eq('is_approved', false),
    admin.from('orders').select('total_amount').gte('created_at', `${today}T00:00:00Z`),
    admin.from('delivery_locations').select('*', { count: 'exact', head: true }).eq('is_online', true),
    admin.from('profiles').select('*', { count: 'exact', head: true }),
    admin.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    admin.from('orders').select('id,order_number,status,total_amount,created_at,payment_method').order('created_at', { ascending: false }).limit(8),
  ]);

  return NextResponse.json({
    stats: {
      shops: shops.count ?? 0,
      pendingShops: pendingShops.count ?? 0,
      orders: orders.data?.length ?? 0,
      riders: riders.count ?? 0,
      gmv: orders.data?.reduce((s: number, o: { total_amount: number }) => s + Number(o.total_amount), 0) ?? 0,
      users: users.count ?? 0,
      pending: pendingOrders.count ?? 0,
    },
    recentOrders: recent.data ?? [],
  });
}
