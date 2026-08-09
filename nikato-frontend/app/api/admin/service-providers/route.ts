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
  const { data } = await adminClient().from('service_providers').select('*').order('created_at', { ascending: false });
  return NextResponse.json({ providers: data ?? [] });
}

export async function POST(req: NextRequest) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { name, phone, service_type, city, experience_years } = await req.json();
  if (!name || !phone || !service_type || !city) return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  const { data, error } = await adminClient().from('service_providers')
    .insert({ name: name.trim(), phone: phone.trim(), service_type, city: city.trim(), experience_years: experience_years || 0 })
    .select('*').single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ provider: data }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id, ...updates } = await req.json();
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  const { error } = await adminClient().from('service_providers').update(updates).eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await req.json();
  const { error } = await adminClient().from('service_providers').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
