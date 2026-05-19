import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const c = await cookies();
  const sb = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { cookies: { getAll: () => c.getAll(), setAll: () => {} } });
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { data: shop } = await sb.from('shops').select('id').eq('owner_id', user.id).single();
  if (!shop) return NextResponse.json({ error: 'Shop not found' }, { status: 403 });
  const { data, error } = await sb.from('orders').select('*,order_items(*,product:products(name,image_url)),customer:profiles!customer_id(full_name,phone),delivery_address:addresses!delivery_address_id(address_line,city,pincode)').eq('id', id).eq('shop_id', shop.id).single();
  if (error || !data) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  return NextResponse.json({ order: data });
}
