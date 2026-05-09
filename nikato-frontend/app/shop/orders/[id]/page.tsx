'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { ArrowLeft, Phone } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useShopStore } from '@/store/shop';
import { toast } from '@/store/ui';
import { Button, Badge, Skeleton } from '@/components/ui';
import { formatPrice, formatOrderDate } from '@/lib/utils';
import type { Order, OrderItem } from '@/types';

const STATUS_NEXT: Partial<Record<string, string>> = {
  confirmed: 'preparing',
  preparing: 'ready',
};

export default function ShopOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const { shopData, removePendingOrder } = useShopStore();
  const [updating, setUpdating] = useState(false);

  const { data: order, isLoading } = useQuery<Order & { order_items: (OrderItem & { product: { name: string } })[] }>({
    queryKey: ['shop-order', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*, product:products(name, image_url))')
        .eq('id', id)
        .eq('shop_id', shopData!.id)
        .single();
      if (error) throw error;
      return data as Order & { order_items: (OrderItem & { product: { name: string } })[] };
    },
    enabled: !!shopData?.id && !!id,
  });

  async function updateStatus(status: string) {
    setUpdating(true);
    const { error } = await supabase.from('orders').update({ status }).eq('id', id);
    if (error) {
      toast.error('Failed to update order status');
    } else {
      if (status === 'confirmed') removePendingOrder(id);
      if (status === 'rejected') removePendingOrder(id);
      qc.invalidateQueries({ queryKey: ['shop-order', id] });
      qc.invalidateQueries({ queryKey: ['shop-orders', shopData?.id] });
      toast.success('Order status updated');
      if (status === 'rejected') router.push('/shop/orders');
    }
    setUpdating(false);
  }

  if (isLoading) {
    return (
      <div className="p-4 lg:p-6 max-w-2xl space-y-4">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-40 rounded-2xl" />
        <Skeleton className="h-24 rounded-2xl" />
      </div>
    );
  }

  if (!order) return <p className="p-6 text-gray-500">Order not found</p>;

  const nextStatus = STATUS_NEXT[order.status];

  return (
    <div className="p-4 lg:p-6 max-w-2xl space-y-4">
      <div className="flex items-center gap-3">
        <Link href="/shop/orders" className="p-2 rounded-xl hover:bg-gray-100">
          <ArrowLeft size={20} className="text-gray-700" />
        </Link>
        <div>
          <h1 className="text-xl font-black text-gray-900">#{order.order_number}</h1>
          <p className="text-xs text-gray-500">{formatOrderDate(order.created_at)}</p>
        </div>
      </div>

      {/* Items */}
      <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50">
        {order.order_items.map((item) => (
          <div key={item.id} className="flex items-center justify-between px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-gray-900">{item.product_name}</p>
              <p className="text-xs text-gray-500">x{item.quantity}</p>
            </div>
            <p className="text-sm font-bold text-gray-900">{formatPrice(item.total_price)}</p>
          </div>
        ))}
        <div className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-b-2xl">
          <p className="text-sm font-bold text-gray-700">Total</p>
          <p className="text-base font-black text-gray-900">{formatPrice(order.total_amount)}</p>
        </div>
      </div>

      {/* Order info */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Payment</span>
          <Badge variant={order.payment_status === 'paid' ? 'success' : 'warning'}>
            {order.payment_method} · {order.payment_status}
          </Badge>
        </div>
        {order.special_instructions && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Note</span>
            <span className="text-gray-900 text-right max-w-xs">{order.special_instructions}</span>
          </div>
        )}
      </div>

      {/* Actions */}
      {order.status === 'pending' && (
        <div className="flex gap-3">
          <Button
            variant="danger"
            className="flex-1"
            isLoading={updating}
            onClick={() => updateStatus('rejected')}
          >
            Reject Order
          </Button>
          <Button
            variant="primary"
            className="flex-1"
            isLoading={updating}
            onClick={() => updateStatus('confirmed')}
          >
            Accept Order
          </Button>
        </div>
      )}

      {nextStatus && (
        <Button
          variant="primary"
          className="w-full"
          isLoading={updating}
          onClick={() => updateStatus(nextStatus)}
        >
          Mark as {nextStatus === 'preparing' ? 'Preparing' : nextStatus === 'ready' ? 'Ready for Pickup' : nextStatus}
        </Button>
      )}
    </div>
  );
}
