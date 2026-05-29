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

export async function POST(req: NextRequest) {
  const ctx = await getShopOwner();
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { is_open } = await req.json();
  if (typeof is_open !== 'boolean') return NextResponse.json({ error: 'is_open required' }, { status: 400 });
  const { data, error } = await ctx.admin.from('shops').update({ is_open, updated_at: new Date().toISOString() }).eq('id', ctx.shopId).select('id,is_open').single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, is_open: data.is_open });
}
