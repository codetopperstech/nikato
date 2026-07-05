'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { TrendingUp, ShoppingBag, BarChart2, DollarSign } from 'lucide-react';
import { useShopStore } from '@/store/shop';
import { Skeleton } from '@/components/ui';
import { formatPrice } from '@/lib/utils';

type DayStat = { date: string; revenue: number };
type Period = 7 | 30;

export default function ShopAnalyticsPage() {
  const { shopData } = useShopStore();
  const [period, setPeriod] = useState<Period>(7);

  const { data, isLoading } = useQuery({
    queryKey: ['shop-analytics', shopData?.id, period],
    queryFn: async () => {
      const res = await fetch(`/api/shop/analytics?period=${period}`);
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!shopData?.id,
    staleTime: 60000,
  });

  const maxRevenue = data?.chartData ? Math.max(...data.chartData.map((d: DayStat) => d.revenue), 1) : 1;

  return (
    <div className="p-4 lg:p-6 max-w-3xl space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-gray-900">Analytics</h1>
        <div className="flex gap-1 p-1 rounded-xl border border-gray-200 bg-white">
          {([7, 30] as Period[]).map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${period === p ? 'text-white' : 'text-gray-500'}`}
              style={period === p ? { background: '#7ED957' } : {}}>
              {p}d
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">{[1,2,3,4].map(i => <Skeleton key={i} className="h-24 rounded-2xl" />)}</div>
          <Skeleton className="h-48 rounded-2xl" />
        </div>
      ) : data ? (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-card">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: '#edfbdc' }}>
                <TrendingUp size={18} style={{ color: '#5cb83a' }} />
              </div>
              <p className="text-2xl font-black text-gray-900">{formatPrice(data.gmv ?? 0)}</p>
              <p className="text-xs text-gray-400 mt-0.5">Total GMV ({period}d)</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-card">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: '#e8f6ff' }}>
                <DollarSign size={18} style={{ color: '#0284c7' }} />
              </div>
              <p className="text-2xl font-black text-gray-900">{formatPrice(data.shopEarning ?? 0)}</p>
              <p className="text-xs text-gray-400 mt-0.5">Your earnings ({period}d)</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-card">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: '#edfbdc' }}>
                <ShoppingBag size={18} style={{ color: '#5cb83a' }} />
              </div>
              <p className="text-2xl font-black text-gray-900">{data.deliveredOrders ?? 0}</p>
              <p className="text-xs text-gray-400 mt-0.5">Orders delivered ({period}d)</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-card">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: '#fff7ed' }}>
                <BarChart2 size={18} style={{ color: '#ea580c' }} />
              </div>
              <p className="text-2xl font-black text-gray-900">{formatPrice(data.avgOrderValue ?? 0)}</p>
              <p className="text-xs text-gray-400 mt-0.5">Avg. order value ({period}d)</p>
            </div>
          </div>

          {data.chartData && (
            <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-card">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                <BarChart2 size={13} /> Daily Revenue
              </p>
              <div className="flex items-end gap-1 h-32">
                {data.chartData.slice(-14).map((d: DayStat, i: number) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full rounded-t-md transition-all"
                      style={{ height: `${Math.max((d.revenue / maxRevenue) * 112, d.revenue > 0 ? 4 : 0)}px`, background: d.revenue > 0 ? '#7ED957' : '#f3f4f6' }} />
                    <p className="text-[8px] text-gray-300 rotate-45 origin-left">{d.date.slice(5)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
          <p className="text-4xl mb-3">📊</p>
          <p className="font-bold text-gray-700">No data yet</p>
          <p className="text-sm text-gray-400 mt-1">Analytics appear after your first orders</p>
        </div>
      )}
    </div>
  );
}
