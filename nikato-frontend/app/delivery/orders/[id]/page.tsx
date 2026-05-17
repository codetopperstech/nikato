'use client';
import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { ArrowLeft, MapPin, Navigation, Phone } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useDeliveryStore } from '@/store/delivery';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/store/ui';
import { PickupAction } from '@/components/delivery/PickupAction';
import { DeliverAction } from '@/components/delivery/DeliverAction';
import { Button, Badge, Skeleton } from '@/components/ui';
import { formatPrice, formatOrderDate, getOrderStatusLabel } from '@/lib/utils';
import type { Order, OrderItem } from '@/types';

type FullOrder = Order & {
  shop: { name: string; address_line: string; lat: number; lng: number; phone: string | null };
  address: { address_line: string; city: string; lat: number; lng: number };
  order_items: (OrderItem & { product: { name: string } | null })[];
  customer: { full_name: string | null; phone: string | null } | null;
};

const STATUS_COLOR: Record<string, string> = {
  ready: 'bg-indigo-100 text-indigo-700', picked_up: 'bg-cyan-100 text-cyan-700',
  delivered: 'bg-green-100 text-green-700', cancelled: 'bg-red-100 text-red-600',
};

export default function DeliveryOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const { user } = useAuth();
  const { setCurrentDelivery } = useDeliveryStore();
  const [accepting, setAccepting] = useState(false);

  const { data: order, isLoading } = useQuery<FullOrder>({
    queryKey: ['delivery-order', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*, shop:shops(name,address_line,lat,lng,phone), address:addresses!delivery_address_id(address_line,city,lat,lng), order_items(*, product:products(name)), customer:profiles!customer_id(full_name,phone)')
        .eq('id', id).single();
      if (error) throw error;
      return data as FullOrder;
    },
    enabled: !!id,
    refetchInterval: 10000,
  });

  async function acceptOrder() {
    if (!user || !order) return;
    setAccepting(true);
    // Use delivery_assignments for proper assignment
    const { error: assignErr } = await supabase.from('delivery_assignments').insert({
      order_id: id, delivery_partner_id: user.id,
      delivery_fee: order.delivery_earning, status: 'assigned',
    });
    if (assignErr && !assignErr.message.includes('duplicate')) {
      toast.error('Failed to accept — order may have been taken');
      setAccepting(false);
      return;
    }
    const { data, error } = await supabase.from('orders')
      .update({ delivery_partner_id: user.id, status: 'picked_up' })
      .eq('id', id).select('*').single();
    if (error) {
      toast.error('Failed to accept order');
    } else {
      setCurrentDelivery(data as Order);
      qc.invalidateQueries({ queryKey: ['delivery-order', id] });
      qc.invalidateQueries({ queryKey: ['available-orders'] });
      toast.success('Order accepted! Head to shop for pickup.');
    }
    setAccepting(false);
  }

  if (isLoading) return <div className="p-6 space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-16 rounded-2xl" />)}</div>;
  if (!order) return <div className="p-6 text-gray-500">Order not found</div>;

  const isMyOrder = order.delivery_partner_id === user?.id;
  const canAccept = order.status === 'ready' && !order.delivery_partner_id;

  return (
    <div className="min-h-screen bg-[#FAFAF8] pb-10">
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 py-4 flex items-center gap-3">
        <Link href="/delivery/orders" className="p-2 rounded-xl hover:bg-gray-100"><ArrowLeft size={20} className="text-gray-700" /></Link>
        <div className="flex-1">
          <h1 className="text-base font-black text-gray-900">#{order.order_number}</h1>
          <p className="text-xs text-gray-500">{formatOrderDate(order.created_at)}</p>
        </div>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${STATUS_COLOR[order.status] ?? 'bg-gray-100 text-gray-600'}`}>
          {getOrderStatusLabel(order.status)}
        </span>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
        {/* Pickup from shop */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <p className="text-xs text-gray-400 mb-1">Pickup from</p>
          <p className="font-bold text-gray-900">{order.shop.name}</p>
          <p className="text-sm text-gray-500">{order.shop.address_line}</p>
          {order.shop.lat && (
            <a href={`https://maps.google.com/?q=${order.shop.lat},${order.shop.lng}`} target="_blank" rel="noreferrer"
              className="flex items-center gap-1 text-[#FF6B35] text-sm mt-2 font-semibold">
              <Navigation size={14} /> Open in Maps
            </a>
          )}
        </div>

        {/* Deliver to customer */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <p className="text-xs text-gray-400 mb-1">Deliver to</p>
          <p className="font-bold text-gray-900">{order.customer?.full_name ?? 'Customer'}</p>
          <p className="text-sm text-gray-500">{order.address.address_line}, {order.address.city}</p>
          <div className="flex gap-3 mt-2">
            {order.address.lat && (
              <a href={`https://maps.google.com/?q=${order.address.lat},${order.address.lng}`} target="_blank" rel="noreferrer"
                className="flex items-center gap-1 text-[#FF6B35] text-sm font-semibold">
                <MapPin size={14} /> Maps
              </a>
            )}
            {order.customer?.phone && (
              <a href={`tel:${order.customer.phone}`} className="flex items-center gap-1 text-green-600 text-sm font-semibold">
                <Phone size={14} /> Call
              </a>
            )}
          </div>
        </div>

        {/* Items */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <p className="text-xs text-gray-400 mb-2">Items</p>
          <div className="space-y-1">
            {order.order_items.map(item => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-gray-700">{item.product?.name ?? item.product_name} × {item.quantity}</span>
                <span className="font-semibold">{formatPrice(item.total_price)}</span>
              </div>
            ))}
          </div>
          <div className="pt-2 mt-2 border-t border-gray-100 flex justify-between text-sm font-bold">
            <span>Total</span><span>{formatPrice(order.total_amount)}</span>
          </div>
          <p className="text-xs text-gray-400 mt-1">{order.payment_method === 'COD' ? '⚠️ Collect cash on delivery' : '✅ Already paid online'}</p>
        </div>

        {/* Delivery earning */}
        <div className="bg-green-50 rounded-2xl border border-green-100 p-4 flex justify-between items-center">
          <p className="text-sm text-green-700 font-medium">Your earning</p>
          <p className="text-xl font-black text-green-600">{formatPrice(order.delivery_earning)}</p>
        </div>

        {/* Actions */}
        {canAccept && (
          <Button variant="primary" size="lg" className="w-full" isLoading={accepting} onClick={acceptOrder}>
            Accept & Pickup
          </Button>
        )}
        {isMyOrder && order.status === 'picked_up' && false && (
          <PickupAction orderId={id} onSuccess={() => { qc.invalidateQueries({ queryKey: ['delivery-order', id] }); }} />
        )}
        {isMyOrder && order.status === 'picked_up' && false && (
          <DeliverAction orderId={id} onSuccess={() => { setCurrentDelivery(null); router.push('/delivery'); }} />
        )}
      </div>
    </div>
  );
}
