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

export async function GET() {
  const a = await verifyAdmin();
  if (!a) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { data } = await a.from('shops').select('*, owner:profiles!owner_id(full_name)').eq('is_approved', true).order('name');
  return NextResponse.json({ shops: data ?? [] });
}

export async function PATCH(req: NextRequest) {
  const a = await verifyAdmin();
  if (!a) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id, commission_rate } = await req.json();
  if (!id || isNaN(commission_rate) || commission_rate < 0 || commission_rate > 1) {
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
  }
  const { error } = await a.from('shops').update({ commission_rate }).eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
