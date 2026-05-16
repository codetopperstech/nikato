import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createHmac } from 'crypto';

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

async function assignDelivery(admin: ReturnType<typeof getAdminClient>, orderId: string) {
  const { data: order } = await admin
    .from('orders')
    .select('id,order_number,shop_id,delivery_earning,delivery_address_id,addresses!delivery_address_id(lat,lng)')
    .eq('id', orderId)
    .single();
  if (!order) return;

  const addrRaw = order.addresses as unknown;
  const addr: { lat: number; lng: number } | null = Array.isArray(addrRaw)
    ? (addrRaw[0] ?? null)
    : (addrRaw as { lat: number; lng: number } | null);
  if (!addr?.lat) return;

  // Idempotency — skip if already assigned
  const { data: existing } = await admin.from('delivery_assignments').select('id').eq('order_id', orderId).single();
  if (existing) return;

  const { data: busy } = await admin.from('delivery_assignments')
    .select('delivery_partner_id').in('status', ['assigned', 'picked_up']);
  const busyIds = (busy ?? []).map((d: { delivery_partner_id: string }) => d.delivery_partner_id);

  let q = admin.from('delivery_locations').select('delivery_partner_id,lat,lng').eq('is_online', true);
  if (busyIds.length > 0) q = q.not('delivery_partner_id', 'in', `(${busyIds.join(',')})`);
  const { data: partners } = await q;
  if (!partners?.length) return;

  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const haversine = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const dLat = toRad(lat2 - lat1), dLng = toRad(lng2 - lng1);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const nearby = (partners as { delivery_partner_id: string; lat: number; lng: number }[])
    .map(p => ({ ...p, dist: haversine(addr.lat, addr.lng, p.lat, p.lng) }))
    .filter(p => p.dist <= 3)
    .sort((a, b) => a.dist - b.dist);

  if (!nearby.length) return;
  const partnerId = nearby[0].delivery_partner_id;

  await admin.from('delivery_assignments').insert({
    order_id: orderId,
    delivery_partner_id: partnerId,
    delivery_fee: order.delivery_earning,
    status: 'assigned',
  });
  await admin.from('orders').update({ delivery_partner_id: partnerId }).eq('id', orderId);

  const { data: shopOwner } = await admin.from('shops').select('owner_id').eq('id', order.shop_id).single();
  await admin.from('notifications').insert([
    { user_id: partnerId, title: 'New Delivery!', body: `Order ${order.order_number} assigned`, type: 'ORDER_UPDATE', data: { order_id: orderId } },
    ...(shopOwner?.owner_id ? [{ user_id: shopOwner.owner_id, title: 'Rider Assigned', body: `Rider assigned for ${order.order_number}`, type: 'ORDER_UPDATE', data: { order_id: orderId } }] : []),
  ]);
}
