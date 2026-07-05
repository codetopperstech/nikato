import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createHmac } from 'crypto';
import { assignDelivery } from '@/lib/assignDelivery';

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const userClient = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
    );
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { order_id, razorpay_payment_id, razorpay_order_id, razorpay_signature } = await req.json();
    if (!order_id || !razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const admin = getAdminClient();

    // ✅ Idempotency — if already verified, return success immediately
    const { data: existingOrder } = await admin
      .from('orders')
      .select('id, payment_status, status, customer_id')
      .eq('id', order_id)
      .single();

    if (!existingOrder) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    if (existingOrder.customer_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    // ✅ Already verified — idempotent success
    if (existingOrder.payment_status === 'paid') {
      return NextResponse.json({ success: true, already_verified: true });
    }

    // Verify HMAC signature
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) return NextResponse.json({ error: 'Payment gateway not configured' }, { status: 503 });

    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = createHmac('sha256', keySecret).update(body).digest('hex');

    if (expectedSignature !== razorpay_signature) {
      await admin.from('orders').update({ payment_status: 'failed', status: 'cancelled' }).eq('id', order_id);
      return NextResponse.json({ success: false, error: 'Invalid payment signature' }, { status: 400 });
    }

    // ✅ Mark payment paid + order confirmed atomically
    await Promise.all([
      admin.from('payments').update({
        status: 'captured',
        razorpay_payment_id,
        razorpay_signature,
        captured_at: new Date().toISOString(),
      }).eq('order_id', order_id),

      admin.from('orders').update({
        razorpay_payment_id,
        payment_status: 'paid',
        status: 'confirmed',               // ✅ KEY FIX: advance order to confirmed
        updated_at: new Date().toISOString(),
      }).eq('id', order_id),
    ]);

    // Trigger delivery assignment (fire-and-forget)
    assignDelivery(admin, order_id).catch(console.error);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('verify-payment error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
