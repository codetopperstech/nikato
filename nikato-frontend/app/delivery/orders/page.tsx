'use client';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { useDeliveryStore } from '@/store/delivery';
import { Badge, Skeleton, EmptyState } from '@/components/ui';
import { formatPrice, formatRelativeTime } from '@/lib/utils';
import type { Order } from '@/types';

export default function AvailableOrdersPage() {
  const { isOnline } = useDeliveryStore();

  const { data: orders = [], isLoading } = useQuery<Order[]>({
    queryKey: ['available-orders-full'],
    queryFn: async () => {
      const res = await fetch('/api/delivery/available-orders');
      if (!res.ok) throw new Error('Failed to fetch');
      const d = await res.json();
      return d.orders as Order[];
    },
    enabled: isOnline,
    refetchInterval: 15000,
  });

  return (
    <div className="p-4 max-w-lg mx-auto">
      <h1 className="text-2xl font-black text-gray-900 mb-4">Available Orders</h1>
      {!isOnline && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 text-sm text-yellow-800 mb-4">
          Go online to see available pickup orders.
        </div>
      )}
      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-24 rounded-2xl" />)}</div>
      ) : orders.length === 0 ? (
        <EmptyState title="No orders available" description={isOnline ? "No orders ready for pickup right now. Check back soon." : "Go online to start receiving orders."} />
      ) : (
        <div className="space-y-3">
          {orders.map((order: any) => (
            <Link key={order.id} href={`/delivery/orders/${order.id}`}
              className="block bg-white rounded-2xl border border-gray-100 p-4 hover:border-[#FF6B35]/30 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-gray-900">#{order.order_number}</span>
                <Badge variant="info">Ready for pickup</Badge>
              </div>
              <p className="text-sm text-gray-600 mb-1">🏪 {order.shop?.name}</p>
              <p className="text-xs text-gray-400">{order.shop?.address_line}, {order.shop?.city}</p>
              <div className="flex items-center justify-between mt-3">
                <div>
                  <p className="text-sm font-bold text-gray-900">{formatPrice(order.total_amount)}</p>
                  <p className="text-xs text-green-600 font-medium">Earn: {formatPrice(order.delivery_earning)}</p>
                </div>
                <div className="flex items-center gap-1 text-gray-400">
                  <span className="text-xs">{formatRelativeTime(order.created_at)}</span>
                  <ChevronRight size={16} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
