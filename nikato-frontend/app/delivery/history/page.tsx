'use client';

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/store/auth';
import { Badge, Skeleton, EmptyState } from '@/components/ui';
import { formatPrice, formatOrderDate } from '@/lib/utils';
import { Clock } from 'lucide-react';
import type { Order } from '@/types';

export default function DeliveryHistoryPage() {
  const { user } = useAuthStore();

  const { data: orders = [], isLoading } = useQuery<Order[]>({
    queryKey: ['delivery-history', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('orders')
        .select('*, shop:shops(name)')
        .eq('delivery_partner_id', user!.id)
        .in('status', ['delivered', 'cancelled'])
        .order('created_at', { ascending: false });
      return (data ?? []) as Order[];
    },
    enabled: !!user,
  });

  return (
    <div className="p-4 max-w-lg mx-auto">
      <h1 className="text-2xl font-black text-gray-900 mb-4">Delivery History</h1>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-16 rounded-2xl" />)}
        </div>
      ) : orders.length === 0 ? (
        <EmptyState
          icon={<Clock size={44} className="text-gray-200" />}
          title="No deliveries yet"
          description="Your completed deliveries will appear here"
        />
      ) : (
        <div className="space-y-2">
          {orders.map((o) => {
            const shop = (o as { shop?: { name: string } }).shop;
            return (
              <div key={o.id} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900">#{o.order_number}</p>
                  <p className="text-xs text-gray-500 truncate">
                    {shop?.name} · {formatOrderDate(o.created_at)}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold text-green-600">+{formatPrice(o.delivery_earning)}</p>
                  <Badge variant={o.status === 'delivered' ? 'success' : 'danger'}>
                    {o.status}
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
