// Secure server-side order status update — validates shop ownership + transition
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const VALID_TRANSITIONS: Record<string, string[]> = {
  pending:   ['confirmed', 'rejected'],
  confirmed: ['preparing', 'cancelled'],
  preparing: ['ready', 'cancelled'],
  ready:     ['picked_up'],
  picked_up: ['delivered'],
};

function getAdminClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { autoRefreshToken: false, persistSession: false } });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const cookieStore = await cookies();
    const userClient = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Verify shop ownership
    const admin = getAdminClient();
    const { data: shop } = await admin.from('shops').select('id').eq('owner_id', user.id).single();
    if (!shop) return NextResponse.json({ error: 'Shop not found' }, { status: 403 });

    const { status, reason } = await req.json();
    if (!status) return NextResponse.json({ error: 'status required' }, { status: 400 });

    // Fetch current order — must belong to this shop
    const { data: order } = await admin.from('orders').select('id,status,shop_id').eq('id', id).eq('shop_id', shop.id).single();
    if (!order) return NextResponse.json({ error: 'Order not found or not yours' }, { status: 404 });

    // Validate transition
    const allowed = VALID_TRANSITIONS[order.status] ?? [];
    if (!allowed.includes(status)) {
      return NextResponse.json({ error: `Cannot transition from ${order.status} to ${status}` }, { status: 422 });
    }

    const update: Record<string, string> = { status, updated_at: new Date().toISOString() };
    if (reason) update.cancelled_reason = reason;

    const { error } = await admin.from('orders').update(update).eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true, status });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
