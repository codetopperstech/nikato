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
    if (!user) return NextResponse.json({ error: 'Please login to place an order' }, { status: 401 });

    const admin = getAdminClient();
    const { cart, address_id, payment_method, special_instructions } = await req.json();

    if (!cart?.length) return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
    if (!address_id) return NextResponse.json({ error: 'Select a delivery address' }, { status: 400 });

    const { data: address } = await admin.from('addresses').select('id,lat,lng').eq('id', address_id).eq('user_id', user.id).single();
    if (!address) return NextResponse.json({ error: 'Address not found' }, { status: 422 });

    const productIds = cart.map((i: {product_id: string}) => i.product_id);
    const { data: products } = await admin.from('products').select('id,shop_id,name,image_url,price,stock,is_available').in('id', productIds);
    if (!products?.length) return NextResponse.json({ error: 'Products not found' }, { status: 422 });

    for (const item of cart as {product_id: string; quantity: number}[]) {
      const p = products.find(p => p.id === item.product_id);
      if (!p) return NextResponse.json({ error: 'Product not found' }, { status: 422 });
      if (!p.is_available) return NextResponse.json({ error: `"${p.name}" is not available` }, { status: 422 });
      if (p.stock < item.quantity) return NextResponse.json({ error: `Insufficient stock for "${p.name}". Available: ${p.stock}` }, { status: 422 });
    }

    const shopIds = [...new Set(products.map(p => p.shop_id))];
    if (shopIds.length !== 1) return NextResponse.json({ error: 'All items must be from the same shop' }, { status: 422 });
    const shopId = shopIds[0];

    const { data: shop } = await admin.from('shops').select('id,is_open,is_approved,min_order_amount,commission_rate').eq('id', shopId).single();
    if (!shop?.is_approved) return NextResponse.json({ error: 'This shop is not available' }, { status: 422 });
    if (!shop?.is_open) return NextResponse.json({ error: 'This shop is currently closed' }, { status: 422 });

    let subtotal = 0;
    for (const item of cart as {product_id: string; quantity: number}[]) {
      const p = products.find(p => p.id === item.product_id)!;
      subtotal += p.price * item.quantity;
    }
    const deliveryFee = 30;
    const totalAmount = subtotal + deliveryFee;
    if (shop.min_order_amount && totalAmount < shop.min_order_amount) {
      return NextResponse.json({ error: `Minimum order is ₹${shop.min_order_amount}` }, { status: 422 });
    }
    const commissionAmount = parseFloat((subtotal * (shop.commission_rate ?? 0.1)).toFixed(2));
    const shopEarning = parseFloat((subtotal - commissionAmount).toFixed(2));
    const deliveryEarning = parseFloat((deliveryFee * 0.8).toFixed(2));

    for (const item of cart as {product_id: string; quantity: number}[]) {
      const p = products.find(p => p.id === item.product_id)!;
      await admin.from('products').update({ stock: p.stock - item.quantity }).eq('id', item.product_id).gte('stock', item.quantity);
    }

    const orderNumber = `NKT-${Date.now()}`;
    const { data: order, error: orderErr } = await admin.from('orders').insert({
      order_number: orderNumber, customer_id: user.id, shop_id: shopId, delivery_address_id: address_id,
      status: 'pending', payment_method, payment_status: 'pending',
      subtotal: subtotal.toFixed(2), delivery_fee: deliveryFee.toFixed(2), discount: '0',
      total_amount: totalAmount.toFixed(2), commission_amount: commissionAmount,
      shop_earning: shopEarning, delivery_earning: deliveryEarning,
      special_instructions: special_instructions ?? null,
    }).select('id,order_number,total_amount').single();

    if (orderErr || !order) return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });

    await admin.from('order_items').insert(
      (cart as {product_id: string; quantity: number}[]).map(item => {
        const p = products.find(p => p.id === item.product_id)!;
        return { order_id: order.id, product_id: item.product_id, quantity: item.quantity, unit_price: p.price, total_price: parseFloat((p.price * item.quantity).toFixed(2)), product_name: p.name, product_image: p.image_url ?? null };
      })
    );

    const { data: shopOwner } = await admin.from('shops').select('owner_id').eq('id', shopId).single();
    if (shopOwner?.owner_id) {
      await admin.from('notifications').insert({ user_id: shopOwner.owner_id, title: 'New Order!', body: `Order ${orderNumber} received.`, type: 'ORDER_UPDATE', data: { order_number: orderNumber } });
    }

    if (payment_method === 'ONLINE') {
      const keyId = process.env.RAZORPAY_KEY_ID;
      const keySecret = process.env.RAZORPAY_KEY_SECRET;
      // ✅ Hard fail if Razorpay not configured — don't silently fall to COD
      if (!keyId || !keySecret) {
        return NextResponse.json({ error: 'Payment gateway not configured. Please contact support or choose Cash on Delivery.' }, { status: 503 });
      }
      const credentials = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
      const rzpRes = await fetch('https://api.razorpay.com/v1/orders', {
        method: 'POST',
        headers: { 'Authorization': `Basic ${credentials}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: Math.round(totalAmount * 100), currency: 'INR', receipt: orderNumber }),
      });
      const rzpOrder = await rzpRes.json();
      if (!rzpOrder.id) {
        return NextResponse.json({ error: `Razorpay error: ${rzpOrder.error?.description ?? 'Failed to create payment order'}` }, { status: 502 });
      }
      await admin.from('orders').update({ razorpay_order_id: rzpOrder.id }).eq('id', order.id);
      await admin.from('payments').insert({ order_id: order.id, razorpay_order_id: rzpOrder.id, amount: totalAmount, currency: 'INR', status: 'created' });
      return NextResponse.json({ order_id: order.id, order_number: orderNumber, razorpay_order_id: rzpOrder.id, key_id: keyId, amount: Math.round(totalAmount * 100), currency: 'INR' }, { status: 201 });
    }

    return NextResponse.json({ order_id: order.id, order_number: orderNumber, total_amount: totalAmount }, { status: 201 });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
  }
}
