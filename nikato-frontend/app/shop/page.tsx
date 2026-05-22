'use client';
import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { TrendingUp, ShoppingBag, Wifi, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useShopStore } from '@/store/shop';
import { OpenCloseToggle } from '@/components/shop/OpenCloseToggle';
import { OrderQueue } from '@/components/shop/OrderQueue';
import { Skeleton } from '@/components/ui';
import { formatPrice } from '@/lib/utils';

interface DayStat { orders: number; revenue: number; pending: number }

export default function ShopDashboard() {
  const { shopData, pendingOrders, isOpen } = useShopStore();
  const qc = useQueryClient();

  const { data: stats, isLoading, dataUpdatedAt, refetch, isFetching } = useQuery<DayStat>({
    queryKey: ['shop-today-stats', shopData?.id],
    queryFn: async () => {
      const res = await fetch('/api/shop/stats');
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    enabled: !!shopData?.id,
    staleTime: 20000,
    refetchInterval: 30000,
  });

  const lastUpdated = dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : null;

  return (
    <div className="p-4 lg:p-6 max-w-2xl space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-400 mt-0.5 truncate max-w-[200px]">{shopData?.name}</p>
        </div>
        <button onClick={() => refetch()} disabled={isFetching} className="flex items-center gap-1.5 text-xs text-gray-400 p-2 rounded-xl hover:bg-surface-2 transition-colors">
          <RefreshCw size={13} className={isFetching ? 'animate-spin' : ''} />
          {lastUpdated && <span>{lastUpdated}</span>}
        </button>
      </div>

      {/* Open/Close toggle */}
      <OpenCloseToggle />

      {/* Stats */}
      <div>
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Today's Summary</h2>
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3"><Skeleton className="h-24 rounded-2xl" /><Skeleton className="h-24 rounded-2xl" /></div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-card">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: '#edfbdc' }}>
                <ShoppingBag size={18} style={{ color: '#5cb83a' }} />
              </div>
              <p className="text-2xl font-black text-gray-900">{stats?.orders ?? 0}</p>
              <p className="text-xs text-gray-400 mt-0.5">Orders</p>
              {(stats?.pending ?? 0) > 0 && <span className="text-xs font-semibold px-2 py-0.5 rounded-full mt-1.5 inline-block" style={{ background: '#fff7ed', color: '#c2570a' }}>{stats!.pending} pending</span>}
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-card">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: '#e8f6ff' }}>
                <TrendingUp size={18} style={{ color: '#0284c7' }} />
              </div>
              <p className="text-2xl font-black text-gray-900">{formatPrice(stats?.revenue ?? 0)}</p>
              <p className="text-xs text-gray-400 mt-0.5">Your Earnings</p>
            </div>
          </div>
        )}
      </div>

      {/* Pending orders */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
            {pendingOrders.length > 0 && <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#7ED957' }} />}
            Pending Orders ({pendingOrders.length})
          </h2>
          {!isOpen && <span className="text-xs font-semibold text-red-400 bg-red-50 px-2.5 py-1 rounded-full">Shop closed</span>}
        </div>
        <OrderQueue />
      </div>
    </div>
  );
}
