// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AdminClient = any;

function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Finds the nearest available delivery partner within 3 km of the shop
 * and assigns them to the order. Safe to call multiple times — skips if
 * already assigned.
 */
export async function assignDelivery(admin: AdminClient, orderId: string): Promise<void> {
  // Idempotency — skip if already assigned
  const { data: existing } = await admin
    .from('delivery_assignments')
    .select('id')
    .eq('order_id', orderId)
    .single();
  if (existing) return;

  // Fetch order + shop location (proximity to shop = fast pickup)
  const { data: order } = await admin
    .from('orders')
    .select('id,order_number,shop_id,delivery_earning,shops!shop_id(lat,lng,owner_id)')
    .eq('id', orderId)
    .single();
  if (!order) return;

  const shopRaw = order.shops as unknown;
  const shop: { lat: number; lng: number; owner_id: string } | null = Array.isArray(shopRaw)
    ? (shopRaw[0] ?? null)
    : (shopRaw as { lat: number; lng: number; owner_id: string } | null);
  if (!shop?.lat) return;

  // Exclude partners already on a delivery
  const { data: busy } = await admin
    .from('delivery_assignments')
    .select('delivery_partner_id')
    .in('status', ['assigned', 'picked_up']);
  const busyIds = (busy ?? []).map((d: { delivery_partner_id: string }) => d.delivery_partner_id);

  // Fetch all online partners
  let q = admin.from('delivery_locations').select('delivery_partner_id,lat,lng').eq('is_online', true);
  if (busyIds.length > 0) q = q.not('delivery_partner_id', 'in', `(${busyIds.join(',')})`);
  const { data: partners } = await q;
  if (!partners?.length) return;

  // Sort by distance from shop asc, keep only within 3 km
  const nearby = (partners as { delivery_partner_id: string; lat: number; lng: number }[])
    .map(p => ({ ...p, dist: haversine(shop.lat, shop.lng, p.lat, p.lng) }))
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

  await admin.from('notifications').insert([
    {
      user_id: partnerId,
      title: 'New Delivery!',
      body: `Order ${order.order_number} assigned to you`,
      type: 'ORDER_UPDATE',
      data: { order_id: orderId },
    },
    ...(shop.owner_id
      ? [{
          user_id: shop.owner_id,
          title: 'Rider Assigned',
          body: `Rider assigned for ${order.order_number}`,
          type: 'ORDER_UPDATE',
          data: { order_id: orderId },
        }]
      : []),
  ]);
}
