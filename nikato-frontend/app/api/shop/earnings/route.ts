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
  const { data: orders } = await ctx.admin.from('orders').select('id,order_number,shop_earning,commission_amount,total_amount,created_at').eq('shop_id', ctx.shopId).eq('status', 'delivered').order('created_at', { ascending: false });
  const rows = orders ?? [];
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const weekStart = new Date(now.getTime() - 7 * 86400000).toISOString();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const sum = (from: string) => rows.filter((r: any) => r.created_at >= from).reduce((acc: number, r: any) => acc + Number(r.shop_earning ?? 0), 0);
  return NextResponse.json({ rows, today: sum(todayStart), week: sum(weekStart), month: sum(monthStart) });
}
