import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

function getAdminClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { autoRefreshToken: false, persistSession: false } });
}
async function verifyAdmin() {
  const cookieStore = await cookies();
  const uc = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } });
  const { data: { user } } = await uc.auth.getUser();
  if (!user) return null;
  const a = getAdminClient();
  const { data: p } = await a.from('profiles').select('role').eq('id', user.id).single();
  return p?.role === 'admin' ? a : null;
}

export async function GET(req: NextRequest) {
  const a = await verifyAdmin();
  if (!a) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const period = parseInt(new URL(req.url).searchParams.get('period') ?? '30');
  const from = new Date(); from.setDate(from.getDate() - period + 1); from.setHours(0,0,0,0);

  const { data: orders } = await a.from('orders')
    .select('total_amount, commission_amount, delivery_earning, shop_earning, created_at, status')
    .gte('created_at', from.toISOString());

  const all = orders ?? [];
  const delivered = all.filter(o => o.status === 'delivered');
  const gmv = delivered.reduce((s, o) => s + Number(o.total_amount), 0);
  const commission = delivered.reduce((s, o) => s + Number(o.commission_amount), 0);
  const deliveryEarnings = delivered.reduce((s, o) => s + Number(o.delivery_earning), 0);
  const avgOrderValue = delivered.length > 0 ? gmv / delivered.length : 0;

  const dayMap: Record<string, number> = {};
  for (let i = 0; i < period; i++) {
    const d = new Date(from); d.setDate(d.getDate() + i);
    dayMap[d.toISOString().split('T')[0]] = 0;
  }
  delivered.forEach(o => { const k = o.created_at.split('T')[0]; if (dayMap[k] !== undefined) dayMap[k] += Number(o.total_amount); });

  return NextResponse.json({ gmv, commission, deliveryEarnings, totalOrders: all.length, deliveredOrders: delivered.length, avgOrderValue, chartData: Object.entries(dayMap).map(([date, revenue]) => ({ date, revenue })) });
}
