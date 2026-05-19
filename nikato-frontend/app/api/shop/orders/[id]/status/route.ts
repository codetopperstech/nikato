import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const VALID: Record<string, string[]> = {
  pending: ['confirmed','rejected'],
  confirmed: ['preparing','cancelled'],
  preparing: ['ready','cancelled'],
  ready: ['picked_up'],
  picked_up: ['delivered'],
};

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const c = await cookies();
  const sb = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { cookies: { getAll: () => c.getAll(), setAll: () => {} } });
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { data: shop } = await sb.from('shops').select('id').eq('owner_id', user.id).single();
  if (!shop) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { status, reason } = await req.json();
  const { data: order } = await sb.from('orders').select('id,status').eq('id', id).eq('shop_id', shop.id).single();
  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  if (!(VALID[order.status] ?? []).includes(status)) return NextResponse.json({ error: `Cannot transition from ${order.status} to ${status}` }, { status: 422 });
  const update: Record<string, string> = { status, updated_at: new Date().toISOString() };
  if (reason) update.cancelled_reason = reason;
  const { error } = await sb.from('orders').update(update).eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, status });
}
