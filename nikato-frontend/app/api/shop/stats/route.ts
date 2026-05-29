import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

async function getShopOwner() {
  const cookieStore = await cookies();
  const uc = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );
  const { data: { user } } = await uc.auth.getUser();
  if (!user) return null;
  const admin = getAdminClient();
  const { data: shop } = await admin.from('shops').select('id').eq('owner_id', user.id).single();
  return shop ? { userId: user.id, shopId: shop.id, admin } : null;
}

export async function GET() {
  const ctx = await getShopOwner();
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const today = new Date(); today.setHours(0,0,0,0);
  const { data: orders } = await ctx.admin.from('orders').select('shop_earning,status,created_at').eq('shop_id', ctx.shopId).gte('created_at', today.toISOString());
  const rows = orders ?? [];
  const active = rows.filter((r: any) => !['cancelled','rejected'].includes(r.status));
  return NextResponse.json({ orders: active.length, revenue: active.reduce((s: number, r: any) => s + Number(r.shop_earning ?? 0), 0), pending: rows.filter((r: any) => r.status === 'pending').length });
}
