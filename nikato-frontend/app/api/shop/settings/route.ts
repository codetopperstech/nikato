import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

function admin() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { autoRefreshToken: false, persistSession: false } });
}
async function getShop() {
  const cookieStore = await cookies();
  const uc = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } });
  const { data: { user } } = await uc.auth.getUser();
  if (!user) return null;
  const a = admin();
  const { data: shop } = await a.from('shops').select('*').eq('owner_id', user.id).single();
  return shop ? { shop, admin: a } : null;
}

export async function PATCH(req: NextRequest) {
  const ctx = await getShop();
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json();
  const { data, error } = await ctx.admin.from('shops').update({ ...body, updated_at: new Date().toISOString() }).eq('id', ctx.shop.id).select('*').single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ shop: data });
}
