'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import dynamic from 'next/dynamic';
import { ArrowLeft, MapPin } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useOrderRealtime } from '@/hooks/useOrderRealtime';
import { OrderStatusStepper } from '@/components/order/OrderStatusStepper';
import { Spinner } from '@/components/ui';
import { formatPrice, formatOrderDate } from '@/lib/utils';
import type { Order, OrderItem } from '@/types';

const MapView = dynamic(() => import('@/components/map/MapView'), { ssr: false });

export default function OrderDetailPage() {
  const params = useParams();
  const id = (Array.isArray(params.id) ? params.id[0] : params.id) ?? '';
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);

  const { isLoading } = useQuery({
    queryKey: ['order-detail', id],
    queryFn: async () => {
      const res = await fetch(`/api/orders/${id}`);
      if (!res.ok) throw new Error('Order not found');
      const d = await res.json();
      setOrder(d.order as Order);
      setItems((d.order.order_items ?? []) as OrderItem[]);
      return d.order as Order;
    },
    enabled: !!id,
    staleTime: 0,
    refetchInterval: 15000,
  });

  // ✅ Realtime status updates
  const { order: realtimeOrder } = useOrderRealtime(id);
  useEffect(() => { if (realtimeOrder) setOrder(prev => prev ? { ...prev, ...realtimeOrder } : realtimeOrder); }, [realtimeOrder]);

  const { data: address } = useQuery({
    queryKey: ['address', order?.delivery_address_id],
    queryFn: async () => {
      const { data } = await supabase.from('addresses').select('*').eq('id', order!.delivery_address_id).single();
      return data;
    },
    enabled: !!order?.delivery_address_id,
  });

  if (isLoading && !order) return <div className="min-h-screen flex items-center justify-center bg-[#FAFAF8]"><Spinner size="lg" className="text-[#FF6B35]" /></div>;
  if (!order) return null;

  return (
    <div className="min-h-screen bg-[#FAFAF8] pb-10">
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 py-4 flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2 rounded-xl hover:bg-gray-100"><ArrowLeft size={20} className="text-gray-700" /></button>
        <div>
          <h1 className="text-base font-black text-gray-900">{order.order_number}</h1>
          <p className="text-xs text-gray-500">{formatOrderDate(order.created_at)}</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <OrderStatusStepper status={order.status} />
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <h2 className="text-sm font-black text-gray-900 mb-3">Items Ordered</h2>
          <div className="space-y-2">
            {items.map((item) => (
              <div key={item.id} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 bg-gray-100 rounded-md flex items-center justify-center text-xs font-bold text-gray-600">{item.quantity}</span>
                  <span className="text-gray-700">{item.product_name}</span>
                </div>
                <span className="font-semibold text-gray-900">{formatPrice(item.total_price)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <h2 className="text-sm font-black text-gray-900 mb-3">Bill Details</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>{formatPrice(order.subtotal)}</span></div>
            <div className="flex justify-between text-gray-600"><span>Delivery fee</span><span>{Number(order.delivery_fee) === 0 ? 'FREE' : formatPrice(order.delivery_fee)}</span></div>
            {Number(order.discount) > 0 && <div className="flex justify-between text-green-600"><span>Discount</span><span>-{formatPrice(order.discount)}</span></div>}
            <div className="flex justify-between font-black text-gray-900 text-base pt-2 border-t border-gray-100"><span>Total</span><span>{formatPrice(order.total_amount)}</span></div>
            <div className="flex justify-between text-xs text-gray-400 pt-1">
              <span>Payment</span>
              <span>{order.payment_method === 'COD' ? 'Cash on Delivery' : 'Online'} · {order.payment_status}</span>
            </div>
          </div>
        </div>

        {address && (
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <h2 className="text-sm font-black text-gray-900 mb-2">Delivery Address</h2>
            <div className="flex items-start gap-2 text-sm text-gray-600">
              <MapPin size={14} className="text-[#FF6B35] mt-0.5 flex-shrink-0" />
              <span>{(address as any).label && `${(address as any).label} · `}{(address as any).address_line}, {(address as any).city} - {(address as any).pincode}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
