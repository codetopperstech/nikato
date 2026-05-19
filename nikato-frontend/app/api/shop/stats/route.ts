import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET() {
  const c = await cookies();
  const sb = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { cookies: { getAll: () => c.getAll(), setAll: () => {} } });
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { data: shop } = await sb.from('shops').select('id').eq('owner_id', user.id).single();
  if (!shop) return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
  const today = new Date(); today.setHours(0,0,0,0);
  const { data: orders } = await sb.from('orders').select('shop_earning,status,created_at').eq('shop_id', shop.id).gte('created_at', today.toISOString());
  const rows = orders ?? [];
  const active = rows.filter(r => !['cancelled','rejected'].includes(r.status));
  return NextResponse.json({ orders: active.length, revenue: active.reduce((s,r) => s + Number(r.shop_earning ?? 0), 0), pending: rows.filter(r => r.status === 'pending').length });
}
