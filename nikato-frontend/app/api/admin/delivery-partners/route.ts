// app/api/admin/delivery-partners/route.ts
// Server-side — uses service role key to bypass RLS for admin
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

async function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

async function verifyAdmin() {
  const cookieStore = await cookies();
  const userClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) return null;
  const { data: profile } = await userClient.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') return null;
  return user;
}

// GET /api/admin/delivery-partners
export async function GET() {
  const user = await verifyAdmin();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const adminClient = await getAdminClient();

  const { data: profiles, error: profilesErr } = await adminClient
    .from('profiles')
    .select('*')
    .eq('role', 'delivery')
    .order('full_name');

  if (profilesErr) return NextResponse.json({ error: profilesErr.message }, { status: 500 });

  const ids = (profiles ?? []).map((p) => p.id);
  if (ids.length === 0) return NextResponse.json({ partners: [] });

  const [{ data: locations }, { data: orders }] = await Promise.all([
    adminClient
      .from('delivery_locations')
      .select('delivery_partner_id, is_online, updated_at')
      .in('delivery_partner_id', ids),
    adminClient
      .from('orders')
      .select('delivery_partner_id, delivery_earning')
      .in('delivery_partner_id', ids)
      .eq('status', 'delivered'),
  ]);

  const locMap: Record<string, { is_online: boolean; updated_at: string }> = {};
  (locations ?? []).forEach((l) => { locMap[l.delivery_partner_id] = l; });

  const earningsMap: Record<string, number> = {};
  (orders ?? []).forEach((o) => {
    if (o.delivery_partner_id) {
      earningsMap[o.delivery_partner_id] = (earningsMap[o.delivery_partner_id] ?? 0) + (o.delivery_earning ?? 0);
    }
  });

  const partners = (profiles ?? []).map((p) => ({
    ...p,
    location: locMap[p.id] ?? null,
    earnings: earningsMap[p.id] ?? 0,
  }));

  return NextResponse.json({ partners });
}
