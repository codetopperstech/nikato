'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Store, ShoppingBag, Bike, TrendingUp, AlertCircle, ChevronRight } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { StatCard } from '@/components/admin/StatCard';
import { ShopApprovalCard } from '@/components/admin/ShopApprovalCard';
import { Skeleton } from '@/components/ui';
import { formatPrice } from '@/lib/utils';
import type { Shop } from '@/types';

export default function AdminOverviewPage() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-overview'],
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [
        { count: totalShops },
        { count: pendingShops, data: pendingShopData },
        { data: todayOrders },
        { count: activeDeliveries },
      ] = await Promise.all([
        supabase.from('shops').select('id', { count: 'exact', head: true }).eq('is_approved', true),
        supabase.from('shops').select('*, owner:profiles(*)', { count: 'exact' }).eq('is_approved', false),
        supabase.from('orders').select('total_amount').gte('created_at', today.toISOString()).not('status', 'in', '(cancelled,rejected)'),
        supabase.from('delivery_locations').select('delivery_partner_id', { count: 'exact', head: true }).eq('is_online', true),
      ]);

      const todayRevenue = (todayOrders ?? []).reduce((s, o) => s + (o.total_amount ?? 0), 0);

      return {
        totalShops: totalShops ?? 0,
        pendingShops: pendingShops ?? 0,
        pendingShopData: (pendingShopData ?? []) as (Shop & { owner: { full_name: string; phone: string } })[],
        todayOrders: (todayOrders ?? []).length,
        todayRevenue,
        activeDeliveries: activeDeliveries ?? 0,
      };
    },
    staleTime: 30000,
  });

  return (
    <div className="p-4 lg:p-6 max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-black text-gray-900">Admin Overview</h1>
        <p className="text-sm text-gray-500">System-wide stats</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
        </div>
      ) : data ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard label="Active Shops" value={data.totalShops} icon={<Store size={18} />} color="bg-[#FF6B35]" />
          <StatCard label="Orders Today" value={data.todayOrders} icon={<ShoppingBag size={18} />} color="bg-blue-500" />
          <StatCard label="Online Riders" value={data.activeDeliveries} icon={<Bike size={18} />} color="bg-green-500" />
          <StatCard label="Today GMV" value={formatPrice(data.todayRevenue)} icon={<TrendingUp size={18} />} color="bg-purple-500" />
        </div>
      ) : null}

      {/* Pending approvals */}
      {data && data.pendingShops > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
              <AlertCircle size={14} className="text-yellow-500" />
              Pending Approvals ({data.pendingShops})
            </h2>
            <Link href="/admin/shops" className="text-xs text-[#FF6B35] font-semibold flex items-center gap-0.5">
              View all <ChevronRight size={14} />
            </Link>
          </div>
          <div className="space-y-2">
            {data.pendingShopData.slice(0, 3).map((shop) => (
              <ShopApprovalCard key={shop.id} shop={shop} onAction={refetch} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
