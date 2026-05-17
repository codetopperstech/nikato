import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

function getAdminClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { autoRefreshToken: false, persistSession: false } });
}
async function verifyAdmin() {
  const cookieStore = await cookies();
  const uc = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } });
  const { data: { user } } = await uc.auth.getUser();
  if (!user) return null;
  const a = getAdminClient();
  const { data: p } = await a.from('profiles').select('role').eq('id', user.id).single();
  return p?.role === 'admin' ? a : null;
}

export async function GET(req: NextRequest) {
  const a = await verifyAdmin();
  if (!a) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const status = new URL(req.url).searchParams.get('status');
  let q = a.from('orders').select('*, shop:shops(name), customer:profiles!customer_id(full_name, phone)').order('created_at', { ascending: false }).limit(200);
  if (status && status !== 'all') q = q.eq('status', status);
  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ orders: data ?? [] });
}
