'use client';
import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ShoppingBag, TrendingUp, Clock, Wifi, WifiOff } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useShopStore } from '@/store/shop';
import { OpenCloseToggle } from '@/components/shop/OpenCloseToggle';
import { OrderQueue } from '@/components/shop/OrderQueue';
import { Card, Skeleton } from '@/components/ui';
import { formatPrice } from '@/lib/utils';

interface DayStat { orders: number; revenue: number; pending: number }

function StatCard({ icon: Icon, label, value, sub, color }: {
  icon: React.ElementType; label: string; value: string; sub?: string; color: string;
}) {
  return (
    <Card className="p-4 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon size={18} className="text-white" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-500 font-medium truncate">{label}</p>
        <p className="text-xl font-black text-gray-900">{value}</p>
        {sub && <p className="text-xs text-gray-400">{sub}</p>}
      </div>
    </Card>
  );
}

export default function ShopDashboard() {
  const { shopData, pendingOrders, isOpen } = useShopStore();
  const qc = useQueryClient();

  const { data: stats, isLoading, dataUpdatedAt } = useQuery<DayStat>({
    queryKey: ['shop-today-stats', shopData?.id],
    queryFn: async () => {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const { data } = await supabase
        .from('orders')
        .select('total_amount, shop_earning, status')
        .eq('shop_id', shopData!.id)
        .gte('created_at', today.toISOString());
      const rows = data ?? [];
      const active = rows.filter(r => !['cancelled', 'rejected'].includes(r.status));
      return {
        orders: active.length,
        revenue: active.reduce((s, r) => s + Number(r.shop_earning ?? 0), 0),
        pending: rows.filter(r => r.status === 'pending').length,
      };
    },
    enabled: !!shopData?.id,
    staleTime: 20000,
    refetchInterval: 30000, // ✅ periodic refresh
  });

  const lastUpdated = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <div className="p-4 lg:p-6 space-y-5 max-w-2xl">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5 truncate max-w-xs">{shopData?.name}</p>
        </div>
        {lastUpdated && (
          <span className="text-xs text-gray-400 flex items-center gap-1 mt-1">
            <Wifi size={11} /> {lastUpdated}
          </span>
        )}
      </div>

      {/* Open/Close toggle */}
      <OpenCloseToggle />

      {/* Stats */}
      <div>
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Today</h2>
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {[1, 2].map((i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <StatCard icon={ShoppingBag} label="Orders" value={String(stats?.orders ?? 0)}
              sub={stats?.pending ? `${stats.pending} pending` : undefined} color="bg-[#FF6B35]" />
            <StatCard icon={TrendingUp} label="Your Earnings"
              value={formatPrice(stats?.revenue ?? 0)} color="bg-blue-500" />
          </div>
        )}
      </div>

      {/* Pending queue */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
            {pendingOrders.length > 0 && <span className="w-2 h-2 rounded-full bg-[#FF6B35] animate-pulse" />}
            Pending Orders ({pendingOrders.length})
          </h2>
          {!isOpen && (
            <span className="text-xs text-red-500 bg-red-50 px-2 py-0.5 rounded-full">Shop closed</span>
          )}
        </div>
        <OrderQueue />
      </div>
    </div>
  );
}
