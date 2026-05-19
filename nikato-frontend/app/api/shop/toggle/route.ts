import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
  const c = await cookies();
  const sb = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { cookies: { getAll: () => c.getAll(), setAll: () => {} } });
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { is_open } = await req.json();
  if (typeof is_open !== 'boolean') return NextResponse.json({ error: 'is_open required' }, { status: 400 });
  const { data, error } = await sb.from('shops').update({ is_open, updated_at: new Date().toISOString() }).eq('owner_id', user.id).select('id,is_open').single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, is_open: data.is_open });
}
