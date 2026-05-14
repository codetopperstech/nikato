'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { ArrowLeft, MapPin, Navigation } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

import { useDeliveryStore } from '@/store/delivery';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/store/ui';
import { PickupAction } from '@/components/delivery/PickupAction';
import { DeliverAction } from '@/components/delivery/DeliverAction';
import { Button, Badge, Skeleton } from '@/components/ui';
import { formatPrice, formatOrderDate, getOrderStatusLabel } from '@/lib/utils';
import type { Order, OrderItem } from '@/types';

export default function DeliveryOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  
  const { user } = useAuth();
  const { setCurrentDelivery } = useDeliveryStore();
  const [accepting, setAccepting] = useState(false);

  const { data: order, isLoading } = useQuery({
    queryKey: ['delivery-order', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*, shop:shops(*), address:addresses(*), order_items(*, product:products(name))')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data as Order & {
        shop: { name: string; address_line: string; lat: number; lng: number };
        address: { address_line: string; city: string; lat: number; lng: number };
        order_items: (OrderItem & { product: { name: string } })[];
      };
    },
    enabled: !!id,
  });

  async function acceptOrder() {
    if (!user) return;
    setAccepting(true);
    const { data, error } = await supabase
      .from('orders')
      .update({ delivery_partner_id: user.id, status: 'picked_up' })
      .eq('id', id)
      .is('delivery_partner_id', null)
      .select('*')
      .single();
    if (error) {
      toast.error('Failed to accept order — it may have been taken');
    } else {
      setCurrentDelivery(data as Order);
      qc.invalidateQueries({ queryKey: ['delivery-order', id] });
      toast.success('Order accepted! Go pick it up.');
    }
    setAccepting(false);
  }

  if (isLoading) {
    return (
      <div className="p-4 space-y-4 max-w-lg mx-auto">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-40 rounded-2xl" />
      </div>
    );
  }

  if (!order) return <p className="p-6 text-gray-500">Order not found</p>;

  const isAssignedToMe = order.delivery_partner_id === user?.id;
  const isAvailable = !order.delivery_partner_id && order.status === 'ready';

  return (
    <div className="p-4 max-w-lg mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <Link href="/delivery/orders" className="p-2 rounded-xl hover:bg-gray-100">
          <ArrowLeft size={20} className="text-gray-700" />
        </Link>
        <div>
          <h1 className="text-xl font-black text-gray-900">#{order.order_number}</h1>
          <p className="text-xs text-gray-500">{formatOrderDate(order.created_at)}</p>
        </div>
        <Badge variant="info" className="ml-auto">{getOrderStatusLabel(order.status)}</Badge>
      </div>

      {/* Addresses */}
      <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50">
        <div className="flex items-start gap-3 p-4">
          <MapPin size={18} className="text-[#FF6B35] mt-0.5" />
          <div className="flex-1">
            <p className="text-xs text-gray-500 font-medium">Pick up from</p>
            <p className="text-sm font-semibold text-gray-900">{order.shop.name}</p>
            <p className="text-xs text-gray-500">{order.shop.address_line}</p>
          </div>
          <a
            href={`https://maps.google.com/maps?q=${order.shop.lat},${order.shop.lng}`}
            target="_blank"
            rel="noreferrer"
            className="p-1.5 rounded-lg bg-blue-50 text-blue-600"
          >
            <Navigation size={14} />
          </a>
        </div>
        <div className="flex items-start gap-3 p-4">
          <MapPin size={18} className="text-green-500 mt-0.5" />
          <div className="flex-1">
            <p className="text-xs text-gray-500 font-medium">Deliver to</p>
            <p className="text-sm font-semibold text-gray-900">{order.address.address_line}</p>
            <p className="text-xs text-gray-500">{order.address.city}</p>
          </div>
          <a
            href={`https://maps.google.com/maps?q=${order.address.lat},${order.address.lng}`}
            target="_blank"
            rel="noreferrer"
            className="p-1.5 rounded-lg bg-blue-50 text-blue-600"
          >
            <Navigation size={14} />
          </a>
        </div>
      </div>

      {/* Items */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4">
        <h2 className="text-sm font-bold text-gray-700 mb-3">Items ({order.order_items.length})</h2>
        <div className="space-y-2">
          {order.order_items.map((item) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span className="text-gray-700">{item.product_name} x{item.quantity}</span>
              <span className="font-semibold text-gray-900">{formatPrice(item.total_price)}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between">
          <span className="text-sm font-bold text-gray-700">Your Earning</span>
          <span className="text-base font-black text-[#FF6B35]">{formatPrice(order.delivery_earning)}</span>
        </div>
      </div>

      {/* Actions */}
      {isAvailable && (
        <Button variant="primary" size="lg" className="w-full" isLoading={accepting} onClick={acceptOrder}>
          Accept & Pick Up
        </Button>
      )}
      {isAssignedToMe && order.status === 'ready' && (
        <PickupAction orderId={order.id} onSuccess={() => qc.invalidateQueries({ queryKey: ['delivery-order', id] })} />
      )}
      {isAssignedToMe && order.status === 'picked_up' && (
        <DeliverAction orderId={order.id} onSuccess={() => router.push('/delivery')} />
      )}
    </div>
  );
}
