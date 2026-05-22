'use client';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase/client';
import { Skeleton } from '@/components/ui';
import { formatPrice, formatRelativeTime } from '@/lib/utils';

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  delivered: { bg: '#edfbdc', color: '#166534' },
  cancelled: { bg: '#fef2f2', color: '#dc2626' },
  picked_up: { bg: '#edfbdc', color: '#3a7a1f' },
};

export default function DeliveryHistoryPage() {
  const { user } = useAuth();

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['delivery-history', user?.id],
    queryFn: async () => {
      const { data } = await supabase.from('orders')
        .select('id,order_number,status,total_amount,delivery_earning,created_at,shop:shops(name)')
        .eq('delivery_partner_id', user!.id)
        .in('status', ['delivered', 'cancelled'])
        .order('created_at', { ascending: false }).limit(100);
      return data ?? [];
    },
    enabled: !!user,
    staleTime: 30000,
  });

  return (
    <div className="p-4 max-w-lg mx-auto pb-24">
      <h1 className="text-2xl font-black text-gray-900 pt-2 mb-4">History</h1>
      {isLoading ? (
        <div className="space-y-2">{[1,2,3,4].map(i => <Skeleton key={i} className="h-16 rounded-2xl" />)}</div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center shadow-card">
          <div className="text-4xl mb-3">🛵</div>
          <p className="font-bold text-gray-700">No delivery history</p>
          <p className="text-sm text-gray-400 mt-1">Completed deliveries appear here</p>
        </div>
      ) : (
        <div className="space-y-2">
          {orders.map((o: any) => {
            const s = STATUS_STYLE[o.status] ?? STATUS_STYLE.delivered;
            return (
              <div key={o.id} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3 shadow-card">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-bold text-sm text-gray-900">#{o.order_number}</span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full capitalize" style={{ background: s.bg, color: s.color }}>{o.status.replace('_', ' ')}</span>
                  </div>
                  <p className="text-xs text-gray-400">{o.shop?.name} · {formatRelativeTime(o.created_at)}</p>
                </div>
                {o.status === 'delivered' && (
                  <p className="text-sm font-black flex-shrink-0" style={{ color: '#3a7a1f' }}>+{formatPrice(o.delivery_earning)}</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
