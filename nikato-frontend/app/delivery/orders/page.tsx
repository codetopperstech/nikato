'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useDeliveryStore } from '@/store/delivery';
import { Badge, Skeleton, EmptyState } from '@/components/ui';
import { formatPrice, formatRelativeTime } from '@/lib/utils';
import type { Order } from '@/types';

export default function AvailableOrdersPage() {
  const { isOnline } = useDeliveryStore();

  const { data: orders = [], isLoading } = useQuery<Order[]>({
    queryKey: ['available-orders-full'],
    queryFn: async () => {
      const { data } = await supabase
        .from('orders')
        .select('*, shop:shops(name, address_line, city)')
        .eq('status', 'ready')
        .is('delivery_partner_id', null)
        .order('created_at', { ascending: false });
      return (data ?? []) as Order[];
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
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}
        </div>
      ) : orders.length === 0 ? (
        <EmptyState title="No orders available" description="Check back in a moment" />
      ) : (
        <div className="space-y-2">
          {orders.map((o) => {
            const shop = (o as { shop?: { name: string; address_line: string } }).shop;
            return (
              <Link
                key={o.id}
                href={`/delivery/orders/${o.id}`}
                className="flex items-center gap-3 bg-white rounded-2xl border border-gray-100 p-4 hover:border-[#FF6B35]/30 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-bold text-gray-900 text-sm">#{o.order_number}</span>
                    <Badge variant="success">{formatPrice(o.delivery_earning)}</Badge>
                  </div>
                  <p className="text-xs text-gray-500 truncate">
                    {shop?.name} · {formatRelativeTime(o.created_at)}
                  </p>
                </div>
                <ChevronRight size={16} className="text-gray-400" />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
