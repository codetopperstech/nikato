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
  const { data: orders } = await sb.from('orders').select('id,order_number,shop_earning,commission_amount,total_amount,created_at').eq('shop_id', shop.id).eq('status', 'delivered').order('created_at', { ascending: false });
  const rows = orders ?? [];
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const weekStart = new Date(now.getTime() - 7 * 86400000).toISOString();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const sum = (from: string) => rows.filter(r => r.created_at >= from).reduce((acc, r) => acc + Number(r.shop_earning ?? 0), 0);
  return NextResponse.json({ rows, today: sum(todayStart), week: sum(weekStart), month: sum(monthStart) });
}
