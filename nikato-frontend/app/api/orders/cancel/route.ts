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

    const { order_id, reason } = await req.json();
    if (!order_id) return NextResponse.json({ error: 'order_id required' }, { status: 400 });

    const admin = getAdminClient();

    // Only cancel if still pending + belongs to this customer
    const { data: order } = await admin.from('orders')
      .select('id, status, customer_id')
      .eq('id', order_id)
      .eq('customer_id', user.id)
      .single();

    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

    // Only cancel pending/unpaid orders
    if (!['pending'].includes(order.status)) {
      return NextResponse.json({ error: 'Cannot cancel this order' }, { status: 422 });
    }

    await admin.from('orders').update({
      status: 'cancelled',
      payment_status: 'failed',
      cancelled_reason: reason ?? 'Payment not completed',
      updated_at: new Date().toISOString(),
    }).eq('id', order_id);

    // Restore stock (best effort)
    const { data: items } = await admin.from('order_items').select('product_id, quantity').eq('order_id', order_id);
    for (const item of (items ?? []) as { product_id: string; quantity: number }[]) {
      const { data: prod } = await admin.from('products').select('stock').eq('id', item.product_id).single();
      if (prod) {
        await admin.from('products').update({ stock: prod.stock + item.quantity }).eq('id', item.product_id);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
