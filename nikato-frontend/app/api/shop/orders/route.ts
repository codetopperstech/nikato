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
  const { data, error } = await ctx.admin
    .from('orders')
    .select('id,order_number,status,total_amount,payment_method,created_at,customer:profiles!customer_id(full_name,phone)')
    .eq('shop_id', ctx.shopId)
    .order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ orders: data ?? [] });
}
