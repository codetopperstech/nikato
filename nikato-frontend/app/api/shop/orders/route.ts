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
  const { data, error } = await sb.from('orders').select('id,order_number,status,total_amount,payment_method,created_at,customer:profiles!customer_id(full_name,phone)').eq('shop_id', shop.id).order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ orders: data ?? [] });
}
