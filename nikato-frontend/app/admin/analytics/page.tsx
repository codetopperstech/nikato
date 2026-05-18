'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { StatCard } from '@/components/admin/StatCard';
import { RevenueChart } from '@/components/shop/RevenueChart';
import { Skeleton } from '@/components/ui';
import { formatPrice } from '@/lib/utils';
import { TrendingUp, ShoppingBag, Store, Bike } from 'lucide-react';

type Period = 7 | 30;

export default function AdminAnalyticsPage() {
  const [period, setPeriod] = useState<Period>(30);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-analytics', period],
    queryFn: async () => {
      const res = await fetch(`/api/admin/analytics?period=${period}`);
      if (!res.ok) throw new Error('Failed to load');
      return res.json();
    },
    staleTime: 60000,
  });

  return (
    <div className="p-4 lg:p-6 max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-gray-900">Analytics</h1>
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
          {([7, 30] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${period === p ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}
            >
              {p}D
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
          </div>
          <Skeleton className="h-48 rounded-2xl" />
        </div>
      ) : data ? (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard label="Gross GMV" value={formatPrice(data.gmv)} icon={<TrendingUp size={18} />} color="bg-[#FF6B35]" />
            <StatCard label="Platform Commission" value={formatPrice(data.commission)} icon={<Store size={18} />} color="bg-purple-500" />
            <StatCard label="Orders" value={data.totalOrders} subValue={`${data.deliveredOrders} delivered`} icon={<ShoppingBag size={18} />} color="bg-blue-500" />
            <StatCard label="Avg Order Value" value={formatPrice(data.avgOrderValue)} icon={<Bike size={18} />} color="bg-green-500" />
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h2 className="text-sm font-bold text-gray-700 mb-4">Daily GMV — Last {period} Days</h2>
            <RevenueChart data={data.chartData} height={160} />
          </div>
        </>
      ) : null}
    </div>
  );
}
