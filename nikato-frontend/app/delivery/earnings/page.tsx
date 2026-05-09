'use client';

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/store/auth';
import { EarningsSummary } from '@/components/delivery/EarningsSummary';
import { Skeleton } from '@/components/ui';
import { formatPrice, formatOrderDate } from '@/lib/utils';
import type { Order } from '@/types';

export default function DeliveryEarningsPage() {
  const { user } = useAuthStore();

  const { data: orders = [], isLoading } = useQuery<Order[]>({
    queryKey: ['delivery-earnings-detail', user?.id],
    queryFn: async () => {
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);
      const { data } = await supabase
        .from('orders')
        .select('*, shop:shops(name)')
        .eq('delivery_partner_id', user!.id)
        .eq('status', 'delivered')
        .gte('created_at', monthStart.toISOString())
        .order('created_at', { ascending: false });
      return (data ?? []) as Order[];
    },
    enabled: !!user,
  });

  return (
    <div className="p-4 max-w-lg mx-auto space-y-5">
      <h1 className="text-2xl font-black text-gray-900">Earnings</h1>

      <EarningsSummary />

      <div>
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">This Month</h2>
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 rounded-2xl" />)}
          </div>
        ) : orders.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-8">No earnings this month yet</p>
        ) : (
          <div className="space-y-2">
            {orders.map((o) => {
              const shop = (o as { shop?: { name: string } }).shop;
              return (
                <div key={o.id} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">#{o.order_number}</p>
                    <p className="text-xs text-gray-500">{shop?.name} · {formatOrderDate(o.created_at)}</p>
                  </div>
                  <p className="text-base font-black text-green-600">+{formatPrice(o.delivery_earning)}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
