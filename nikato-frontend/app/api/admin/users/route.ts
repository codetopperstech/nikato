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
  const { data } = await a.from('profiles').select('id,phone,full_name,role,is_active,created_at,avatar_url').order('created_at', { ascending: false });
  return NextResponse.json({ users: data ?? [] });
}

export async function PATCH(req: NextRequest) {
  const a = await verifyAdmin();
  if (!a) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id, ...updates } = await req.json();
  const { error } = await a.from('profiles').update(updates).eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
