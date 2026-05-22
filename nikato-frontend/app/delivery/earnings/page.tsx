'use client';
import { useDeliveryStore } from '@/store/delivery';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase/client';
import { Skeleton } from '@/components/ui';
import { formatPrice, formatOrderDate } from '@/lib/utils';
import { Wallet, TrendingUp, Calendar, Zap } from 'lucide-react';

export default function DeliveryEarningsPage() {
  const { earnings } = useDeliveryStore();
  const { user } = useAuth();

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['delivery-orders-history', user?.id],
    queryFn: async () => {
      const { data } = await supabase.from('orders')
        .select('id,order_number,delivery_earning,total_amount,created_at,shop:shops(name)')
        .eq('delivery_partner_id', user!.id).eq('status', 'delivered')
        .order('created_at', { ascending: false }).limit(50);
      return data ?? [];
    },
    enabled: !!user,
    staleTime: 30000,
  });

  return (
    <div className="p-4 max-w-lg mx-auto space-y-5 pb-24">
      <h1 className="text-2xl font-black text-gray-900 pt-2">Earnings</h1>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Today', value: earnings.today, icon: Zap, color: '#7ED957' },
          { label: 'This Week', value: earnings.week, icon: TrendingUp, color: '#7CCBFF' },
          { label: 'This Month', value: earnings.month, icon: Calendar, color: '#7ED957' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-100 p-3.5 shadow-card text-center">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center mx-auto mb-2" style={{ background: color + '20' }}>
              <Icon size={15} style={{ color: color === '#7ED957' ? '#5cb83a' : '#0284c7' }} />
            </div>
            <p className="text-base font-black text-gray-900">{formatPrice(value)}</p>
            <p className="text-[10px] text-gray-400 mt-0.5 font-medium">{label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-50">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Recent Deliveries</p>
        </div>
        {isLoading ? (
          <div className="p-4 space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-12 rounded-xl" />)}</div>
        ) : orders.length === 0 ? (
          <div className="p-10 text-center">
            <div className="text-3xl mb-2">🛵</div>
            <p className="text-sm text-gray-400">No deliveries yet</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {orders.map((o: any) => (
              <div key={o.id} className="flex items-center justify-between px-4 py-3.5">
                <div>
                  <p className="text-sm font-bold text-gray-900">#{o.order_number}</p>
                  <p className="text-xs text-gray-400">{o.shop?.name} · {formatOrderDate(o.created_at)}</p>
                </div>
                <p className="text-sm font-black" style={{ color: '#3a7a1f' }}>+{formatPrice(o.delivery_earning)}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
