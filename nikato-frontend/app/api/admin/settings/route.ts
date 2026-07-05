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

async function verifyAdmin() {
  const cookieStore = await cookies();
  const uc = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );
  const { data: { user } } = await uc.auth.getUser();
  if (!user) return null;
  const a = getAdminClient();
  const { data: p } = await a.from('profiles').select('role').eq('id', user.id).single();
  return p?.role === 'admin' ? a : null;
}

const DEFAULTS = {
  platform_name: 'Nikato',
  delivery_fee: 30,
  default_commission_rate: 0.1,
  min_order_amount: 50,
  max_delivery_radius_km: 10,
  support_phone: '',
  support_email: '',
  maintenance_mode: false,
};

export async function GET() {
  const a = await verifyAdmin();
  if (!a) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Read from platform_settings table; return defaults if table/rows missing
  const { data } = await a.from('platform_settings').select('key, value');
  const map: Record<string, unknown> = { ...DEFAULTS };
  (data ?? []).forEach((row: { key: string; value: unknown }) => {
    map[row.key] = row.value;
  });

  // Fetch live stats to show on the page
  const [{ count: shopCount }, { count: userCount }, { count: orderCount }] = await Promise.all([
    a.from('shops').select('*', { count: 'exact', head: true }).eq('is_approved', true),
    a.from('profiles').select('*', { count: 'exact', head: true }),
    a.from('orders').select('*', { count: 'exact', head: true }),
  ]);

  return NextResponse.json({ settings: map, stats: { shopCount, userCount, orderCount } });
}

export async function PATCH(req: NextRequest) {
  const a = await verifyAdmin();
  if (!a) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const updates: Record<string, unknown> = await req.json();
  const rows = Object.entries(updates).map(([key, value]) => ({ key, value }));

  const { error } = await a.from('platform_settings').upsert(rows, { onConflict: 'key' });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ ok: true });
}
