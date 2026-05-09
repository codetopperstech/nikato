'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import dynamic from 'next/dynamic';
import { ArrowLeft, Phone, MapPin } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useOrderRealtime } from '@/hooks/useOrderRealtime';
import { OrderStatusStepper } from '@/components/order/OrderStatusStepper';
import { Spinner, Card } from '@/components/ui';
import { formatPrice, formatOrderDate, getOrderStatusLabel } from '@/lib/utils';
import type { Order, OrderItem, Address } from '@/types';

const MapView = dynamic(() => import('@/components/map/MapView'), { ssr: false });

async function fetchOrderDetail(id: string) {
  const [orderRes, itemsRes] = await Promise.all([
    supabase.from('orders').select('*').eq('id', id).single(),
    supabase.from('order_items').select('*').eq('order_id', id),
  ]);
  if (orderRes.error) throw orderRes.error;
  return {
    order: orderRes.data as Order,
    items: (itemsRes.data ?? []) as OrderItem[],
  };
}

async function fetchAddress(id: string): Promise<Address | null> {
  const { data } = await supabase.from('addresses').select('*').eq('id', id).single();
  return (data as Address) ?? null;
}

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [mergedOrder, setMergedOrder] = useState<Order | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['order-detail', id],
    queryFn: () => fetchOrderDetail(id),
    enabled: !!id,
    staleTime: 0,
  });

  const { order: realtimeOrder } = useOrderRealtime(id);

  useEffect(() => {
    if (data?.order) setMergedOrder(data.order);
  }, [data]);

  useEffect(() => {
    if (realtimeOrder) setMergedOrder(realtimeOrder);
  }, [realtimeOrder]);

  const { data: address } = useQuery({
    queryKey: ['address', mergedOrder?.delivery_address_id],
    queryFn: () => fetchAddress(mergedOrder!.delivery_address_id),
    enabled: !!mergedOrder?.delivery_address_id,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAF8]">
        <Spinner size="lg" className="text-[#FF6B35]" />
      </div>
    );
  }

  if (!mergedOrder) return null;
  const items = data?.items ?? [];

  return (
    <div className="min-h-screen bg-[#FAFAF8] pb-10">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 py-4 flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2 rounded-xl hover:bg-gray-100">
          <ArrowLeft size={20} className="text-gray-700" />
        </button>
        <div>
          <h1 className="text-base font-black text-gray-900">{mergedOrder.order_number}</h1>
          <p className="text-xs text-gray-500">{formatOrderDate(mergedOrder.created_at)}</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
        {/* Status stepper */}
        <Card className="p-4">
          <OrderStatusStepper status={mergedOrder.status} />
        </Card>

        {/* Live map — show when delivery partner assigned */}
        {mergedOrder.delivery_partner_id && address && (
          <Card className="overflow-hidden">
            <div className="h-48">
              <MapView
                center={{ lat: address.lat, lng: address.lng }}
                zoom={14}
                className="h-full"
              />
            </div>
            <div className="p-3 flex items-center gap-2 text-sm text-gray-600 border-t border-gray-100">
              <MapPin size={14} className="text-[#FF6B35]" />
              Delivering to: {address.address_line}, {address.city}
            </div>
          </Card>
        )}

        {/* Order items */}
        <Card className="p-4">
          <h2 className="text-sm font-black text-gray-900 mb-3">Items Ordered</h2>
          <div className="space-y-2">
            {items.map((item) => (
              <div key={item.id} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 bg-gray-100 rounded-md flex items-center justify-center text-xs font-bold text-gray-600">
                    {item.quantity}
                  </span>
                  <span className="text-gray-700">{item.product_name}</span>
                </div>
                <span className="font-semibold text-gray-900">{formatPrice(item.total_price)}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Bill */}
        <Card className="p-4">
          <h2 className="text-sm font-black text-gray-900 mb-3">Bill Details</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span><span>{formatPrice(mergedOrder.subtotal)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Delivery fee</span>
              <span>{mergedOrder.delivery_fee === 0 ? 'FREE' : formatPrice(mergedOrder.delivery_fee)}</span>
            </div>
            {mergedOrder.discount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Discount</span><span>-{formatPrice(mergedOrder.discount)}</span>
              </div>
            )}
            <div className="flex justify-between font-black text-gray-900 text-base pt-2 border-t border-gray-100">
              <span>Total</span><span>{formatPrice(mergedOrder.total_amount)}</span>
            </div>
            <div className="flex justify-between text-xs text-gray-400 pt-1">
              <span>Payment</span>
              <span>{mergedOrder.payment_method === 'COD' ? 'Cash on Delivery' : 'Online'} · {mergedOrder.payment_status}</span>
            </div>
          </div>
        </Card>

        {/* Delivery address */}
        {address && (
          <Card className="p-4">
            <h2 className="text-sm font-black text-gray-900 mb-2">Delivery Address</h2>
            <div className="flex items-start gap-2 text-sm text-gray-600">
              <MapPin size={14} className="text-[#FF6B35] mt-0.5 flex-shrink-0" />
              <span>{address.label} · {address.address_line}, {address.city} - {address.pincode}</span>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
