import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

function adminClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { autoRefreshToken: false, persistSession: false } });
}

async function requireAdmin() {
  const cookieStore = await cookies();
  const uc = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } });
  const { data: { user } } = await uc.auth.getUser();
  if (!user) return null;
  const { data: p } = await adminClient().from('profiles').select('role').eq('id', user.id).single();
  return p?.role === 'admin' ? user : null;
}

export async function GET() {
  const { data } = await adminClient().from('service_prices').select('*').order('service_type');
  return NextResponse.json({ prices: data ?? [] });
}

export async function PATCH(req: NextRequest) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { service_type, base_price, unit } = await req.json();
  const { error } = await adminClient().from('service_prices')
    .upsert({ service_type, base_price, unit, updated_at: new Date().toISOString() }, { onConflict: 'service_type' });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
