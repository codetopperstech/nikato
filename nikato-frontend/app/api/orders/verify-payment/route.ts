import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createHmac } from 'crypto';

function getAdminClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { autoRefreshToken: false, persistSession: false } });
}

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const userClient = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { order_id, razorpay_payment_id, razorpay_order_id, razorpay_signature } = await req.json();
    if (!order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const admin = getAdminClient();

    // Verify HMAC signature
    const keySecret = process.env.RAZORPAY_KEY_SECRET!;
    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = createHmac('sha256', keySecret).update(body).digest('hex');
    const isValid = expectedSignature === razorpay_signature;

    if (!isValid) {
      await admin.from('orders').update({ payment_status: 'failed', status: 'cancelled' }).eq('id', order_id);
      return NextResponse.json({ success: false, error: 'Invalid payment signature' }, { status: 400 });
    }

    // Mark payment captured
    await admin.from('payments').update({ status: 'captured', razorpay_payment_id, razorpay_signature }).eq('order_id', order_id);
    await admin.from('orders').update({ razorpay_payment_id, payment_status: 'paid' }).eq('id', order_id);

    // Trigger delivery assignment (fire and forget)
    assignDelivery(admin, order_id);

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

async function assignDelivery(admin: ReturnType<typeof getAdminClient>, orderId: string) {
  try {
    const { data: order } = await admin.from('orders').select('id,order_number,shop_id,delivery_earning,delivery_address_id,addresses!delivery_address_id(lat,lng)').eq('id', orderId).single();
    if (!order) return;

    const addrArr = order.addresses as unknown as { lat: number; lng: number }[] | null;
    const addr = Array.isArray(addrArr) ? addrArr[0] : (addrArr as unknown as { lat: number; lng: number } | null);
    if (!addr) return;

    const { data: existing } = await admin.from('delivery_assignments').select('id,delivery_partner_id').eq('order_id', orderId).single();
    if (existing) return;

    const { data: busy } = await admin.from('delivery_assignments').select('delivery_partner_id').in('status', ['assigned', 'picked_up']);
    const busyIds = (busy ?? []).map((d: {delivery_partner_id: string}) => d.delivery_partner_id);

    let q = admin.from('delivery_locations').select('delivery_partner_id,lat,lng').eq('is_online', true);
    if (busyIds.length > 0) q = q.not('delivery_partner_id', 'in', `(${busyIds.join(',')})`);
    const { data: partners } = await q;
    if (!partners?.length) return;

    // ✅ Filter within 3km using Haversine formula
    const R = 6371;
    const toRad = (d: number) => (d * Math.PI) / 180;
    const haversine = (lat1: number, lng1: number, lat2: number, lng2: number) => {
      const dLat = toRad(lat2 - lat1), dLng = toRad(lng2 - lng1);
      const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng/2)**2;
      return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    };

    const nearby = partners
      .map((p: {delivery_partner_id: string; lat: number; lng: number}) => ({ ...p, dist: haversine(addr.lat, addr.lng, p.lat, p.lng) }))
      .filter(p => p.dist <= 3) // ✅ 3km max
      .sort((a, b) => a.dist - b.dist);

    if (!nearby.length) return; // no partner within 3km

    const partnerId = nearby[0].delivery_partner_id;

    await admin.from('delivery_assignments').insert({ order_id: orderId, delivery_partner_id: partnerId, delivery_fee: order.delivery_earning, status: 'assigned' });
    await admin.from('orders').update({ delivery_partner_id: partnerId }).eq('id', orderId);

    const { data: shopOwner } = await admin.from('shops').select('owner_id').eq('id', order.shop_id).single();
    await admin.from('notifications').insert([
      { user_id: partnerId, title: 'New Delivery!', body: `Order ${order.order_number} assigned to you`, type: 'ORDER_UPDATE', data: { order_id: orderId } },
      ...(shopOwner?.owner_id ? [{ user_id: shopOwner.owner_id, title: 'Rider Assigned', body: `Rider assigned for order ${order.order_number}`, type: 'ORDER_UPDATE', data: { order_id: orderId } }] : []),
    ]);
  } catch (e) {
    console.error('assignDelivery error:', e);
  }
}
