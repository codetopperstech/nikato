'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { useShopStore } from '@/store/shop';
import { RevenueChart } from '@/components/shop/RevenueChart';
import { EarningsCard } from '@/components/shop/EarningsCard';
import { Skeleton } from '@/components/ui';
import { formatPrice } from '@/lib/utils';

type Period = 7 | 30;

interface DayStat { date: string; revenue: number; orders: number }
interface ProductStat { product_name: string; quantity: number; revenue: number }

export default function ShopAnalyticsPage() {
  const { shopData } = useShopStore();
  const [period, setPeriod] = useState<Period>(7);

  const { data, isLoading } = useQuery({
    queryKey: ['shop-analytics', shopData?.id, period],
    queryFn: async () => {
      const from = new Date();
      from.setDate(from.getDate() - period + 1);
      from.setHours(0, 0, 0, 0);

      const { data: orders } = await supabase
        .from('orders')
        .select('total_amount, shop_earning, created_at')
        .eq('shop_id', shopData!.id)
        .eq('status', 'delivered')
        .gte('created_at', from.toISOString());

      const { data: items } = await supabase
        .from('order_items')
        .select('product_name, quantity, total_price, order:orders!inner(shop_id, status, created_at)')
        .eq('order.shop_id', shopData!.id)
        .eq('order.status', 'delivered')
        .gte('order.created_at', from.toISOString());

      // Build daily stats
      const dayMap: Record<string, DayStat> = {};
      for (let i = 0; i < period; i++) {
        const d = new Date(from);
        d.setDate(d.getDate() + i);
        const key = d.toISOString().split('T')[0];
        dayMap[key] = { date: key, revenue: 0, orders: 0 };
      }
      (orders ?? []).forEach((o) => {
        const key = o.created_at.split('T')[0];
        if (dayMap[key]) {
          dayMap[key].revenue += o.shop_earning ?? 0;
          dayMap[key].orders += 1;
        }
      });
      const days = Object.values(dayMap);

      // Top products
      const prodMap: Record<string, ProductStat> = {};
      (items ?? []).forEach((item: { product_name: string; quantity: number; total_price: number }) => {
        if (!prodMap[item.product_name]) {
          prodMap[item.product_name] = { product_name: item.product_name, quantity: 0, revenue: 0 };
        }
        prodMap[item.product_name].quantity += item.quantity;
        prodMap[item.product_name].revenue += item.total_price;
      });
      const topProducts = Object.values(prodMap)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10);

      const totalRevenue = days.reduce((s, d) => s + d.revenue, 0);
      const totalOrders = days.reduce((s, d) => s + d.orders, 0);

      return { days, topProducts, totalRevenue, totalOrders };
    },
    enabled: !!shopData?.id,
    staleTime: 60000,
  });

  return (
    <div className="p-4 lg:p-6 max-w-3xl space-y-6">
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
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-20 rounded-2xl" />
            <Skeleton className="h-20 rounded-2xl" />
          </div>
          <Skeleton className="h-48 rounded-2xl" />
        </div>
      ) : data ? (
        <>
          <div className="grid grid-cols-2 gap-3">
            <EarningsCard label="Your Earnings" amount={data.totalRevenue} subLabel={`Last ${period} days`} trend="up" />
            <EarningsCard label="Total Orders" amount={data.totalOrders} subLabel={`Last ${period} days`} />
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h2 className="text-sm font-bold text-gray-700 mb-4">Daily Revenue</h2>
            <RevenueChart data={data.days} />
          </div>

          {data.topProducts.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h2 className="text-sm font-bold text-gray-700 mb-3">Top Products</h2>
              <div className="space-y-2">
                {data.topProducts.map((p, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-xs font-bold text-gray-400 w-5">{i + 1}</span>
                    <span className="flex-1 text-sm text-gray-900 truncate">{p.product_name}</span>
                    <span className="text-xs text-gray-500">{p.quantity} sold</span>
                    <span className="text-sm font-bold text-[#FF6B35]">{formatPrice(p.revenue)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}
