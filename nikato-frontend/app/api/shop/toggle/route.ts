import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

function getAdminClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { autoRefreshToken: false, persistSession: false } });
}

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const userClient = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { is_open } = await req.json();
    if (typeof is_open !== 'boolean') return NextResponse.json({ error: 'is_open required' }, { status: 400 });

    const admin = getAdminClient();
    const { data: shop, error } = await admin.from('shops').update({ is_open, updated_at: new Date().toISOString() }).eq('owner_id', user.id).select('id,is_open').single();
    if (error || !shop) return NextResponse.json({ error: 'Failed to update' }, { status: 500 });

    return NextResponse.json({ success: true, is_open: shop.is_open });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
