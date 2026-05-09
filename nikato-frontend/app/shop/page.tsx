'use client';

import { useQuery } from '@tanstack/react-query';
import { ShoppingBag, TrendingUp, Users, Clock } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useShopStore } from '@/store/shop';
import { OpenCloseToggle } from '@/components/shop/OpenCloseToggle';
import { OrderQueue } from '@/components/shop/OrderQueue';
import { Card, Skeleton } from '@/components/ui';
import { formatPrice } from '@/lib/utils';

interface DayStat {
  orders: number;
  revenue: number;
}

function StatCard({ icon: Icon, label, value, color }: {
  icon: React.ElementType;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <Card className="p-4 flex items-center gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color}`}>
        <Icon size={20} className="text-white" />
      </div>
      <div>
        <p className="text-xs text-gray-500 font-medium">{label}</p>
        <p className="text-xl font-black text-gray-900">{value}</p>
      </div>
    </Card>
  );
}

export default function ShopDashboard() {
  const { shopData, pendingOrders } = useShopStore();

  const { data: stats, isLoading } = useQuery<DayStat>({
    queryKey: ['shop-today-stats', shopData?.id],
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { data } = await supabase
        .from('orders')
        .select('total_amount, status')
        .eq('shop_id', shopData!.id)
        .gte('created_at', today.toISOString())
        .not('status', 'in', '(cancelled,rejected)');
      const rows = data ?? [];
      return {
        orders: rows.length,
        revenue: rows.reduce((s, r) => s + (r.total_amount ?? 0), 0),
      };
    },
    enabled: !!shopData?.id,
    staleTime: 30000,
  });

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-black text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">{shopData?.name}</p>
      </div>

      {/* Shop status toggle */}
      <OpenCloseToggle />

      {/* Today's stats */}
      <div>
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Today</h2>
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {[1, 2].map((i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <StatCard
              icon={ShoppingBag}
              label="Orders"
              value={String(stats?.orders ?? 0)}
              color="bg-[#FF6B35]"
            />
            <StatCard
              icon={TrendingUp}
              label="Revenue"
              value={formatPrice(stats?.revenue ?? 0)}
              color="bg-blue-500"
            />
          </div>
        )}
      </div>

      {/* Pending orders queue */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
            {pendingOrders.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-[#FF6B35] animate-pulse" />
            )}
            Pending Orders ({pendingOrders.length})
          </h2>
        </div>
        <OrderQueue />
      </div>
    </div>
  );
}
