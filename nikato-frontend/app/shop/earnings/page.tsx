'use client';
import { useQuery } from '@tanstack/react-query';
import { useShopStore } from '@/store/shop';
import { EarningsCard } from '@/components/shop/EarningsCard';
import { Skeleton, EmptyState } from '@/components/ui';
import { formatPrice, formatOrderDate } from '@/lib/utils';
import { Wallet } from 'lucide-react';

interface EarningRow { id: string; order_number: string; shop_earning: number; commission_amount: number; total_amount: number; created_at: string; }

export default function ShopEarningsPage() {
  const { shopData } = useShopStore();

  const { data, isLoading } = useQuery({
    queryKey: ['shop-earnings', shopData?.id],
    queryFn: async () => {
      const res = await fetch('/api/shop/earnings');
      if (!res.ok) throw new Error('Failed to load');
      return res.json() as Promise<{ rows: EarningRow[]; today: number; week: number; month: number }>;
    },
    enabled: !!shopData?.id,
    staleTime: 30000,
  });

  return (
    <div className="p-4 lg:p-6 max-w-3xl space-y-6">
      <h1 className="text-2xl font-black text-gray-900">Earnings</h1>
      {isLoading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">{[1,2,3].map(i => <Skeleton key={i} className="h-20 rounded-2xl" />)}</div>
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      ) : data ? (
        <>
          <div className="grid grid-cols-3 gap-3">
            <EarningsCard label="Today" amount={data.today} />
            <EarningsCard label="This Week" amount={data.week} trend="up" />
            <EarningsCard label="This Month" amount={data.month} trend="up" />
          </div>
          <div className="bg-white rounded-2xl border border-gray-100">
            <div className="px-4 py-3 border-b border-gray-50">
              <h2 className="text-sm font-bold text-gray-700">Order Breakdown</h2>
            </div>
            {data.rows.length === 0 ? (
              <EmptyState icon={<Wallet size={40} className="text-gray-200" />} title="No earnings yet" description="Your completed orders will appear here" />
            ) : (
              <div className="divide-y divide-gray-50">
                {data.rows.map((row) => (
                  <div key={row.id} className="flex items-center justify-between px-4 py-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">#{row.order_number}</p>
                      <p className="text-xs text-gray-500">{formatOrderDate(row.created_at)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-green-600">+{formatPrice(row.shop_earning)}</p>
                      <p className="text-xs text-gray-400">Order: {formatPrice(row.total_amount)} · Commission: {formatPrice(row.commission_amount)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}
