'use client';
import { useQuery } from '@tanstack/react-query';
import { useShopStore } from '@/store/shop';
import { Skeleton } from '@/components/ui';
import { formatPrice, formatOrderDate } from '@/lib/utils';
import { Wallet, TrendingUp, Calendar } from 'lucide-react';

interface EarningRow { id: string; order_number: string; shop_earning: number; commission_amount: number; total_amount: number; created_at: string; }

export default function ShopEarningsPage() {
  const { shopData } = useShopStore();
  const { data, isLoading } = useQuery({
    queryKey: ['shop-earnings', shopData?.id],
    queryFn: async () => { const res = await fetch('/api/shop/earnings'); if (!res.ok) throw new Error('Failed'); return res.json() as Promise<{ rows: EarningRow[]; today: number; week: number; month: number }>; },
    enabled: !!shopData?.id,
    staleTime: 30000,
  });

  return (
    <div className="p-4 lg:p-6 max-w-3xl space-y-5">
      <h1 className="text-2xl font-black text-gray-900">Earnings</h1>
      {isLoading ? (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-3">{[1,2,3].map(i => <Skeleton key={i} className="h-20 rounded-2xl" />)}</div>
          <Skeleton className="h-48 rounded-2xl" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Today', value: data?.today ?? 0, icon: Wallet, color: '#7ED957' },
              { label: 'This Week', value: data?.week ?? 0, icon: TrendingUp, color: '#7CCBFF' },
              { label: 'This Month', value: data?.month ?? 0, icon: Calendar, color: '#7ED957' },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="bg-white rounded-2xl border border-gray-100 p-3.5 shadow-card">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-2.5" style={{ background: color + '20' }}>
                  <Icon size={15} style={{ color: color === '#7ED957' ? '#5cb83a' : '#0284c7' }} />
                </div>
                <p className="text-lg font-black text-gray-900">{formatPrice(value)}</p>
                <p className="text-[11px] text-gray-400 mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-50">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Order Breakdown</p>
            </div>
            {!data?.rows.length ? (
              <div className="p-10 text-center">
                <p className="text-3xl mb-2">💰</p>
                <p className="text-sm text-gray-400">No delivered orders yet</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {data.rows.map(row => (
                  <div key={row.id} className="flex items-center justify-between px-4 py-3.5">
                    <div>
                      <p className="text-sm font-bold text-gray-900">#{row.order_number}</p>
                      <p className="text-xs text-gray-400">{formatOrderDate(row.created_at)} · Commission: {formatPrice(row.commission_amount)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black" style={{ color: '#3a7a1f' }}>+{formatPrice(row.shop_earning)}</p>
                      <p className="text-xs text-gray-400">of {formatPrice(row.total_amount)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
