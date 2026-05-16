'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { useShopStore } from '@/store/shop';
import { RevenueChart } from '@/components/shop/RevenueChart';
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

      // ✅ Use anon client — RLS allows shop_owner to read own orders
      const { data: orders } = await supabase
        .from('orders')
        .select('total_amount, shop_earning, status, created_at, order_items(product_name, quantity, total_price)')
        .eq('shop_id', shopData!.id)
        .eq('status', 'delivered')
        .gte('created_at', from.toISOString())
        .order('created_at');

      const rows = orders ?? [];

      // Group by date
      const byDate: Record<string, DayStat> = {};
      for (let i = 0; i < period; i++) {
        const d = new Date(); d.setDate(d.getDate() - (period - 1 - i)); d.setHours(0,0,0,0);
        const key = d.toISOString().split('T')[0];
        byDate[key] = { date: key, revenue: 0, orders: 0 };
      }
      rows.forEach(o => {
        const key = new Date(o.created_at).toISOString().split('T')[0];
        if (byDate[key]) { byDate[key].revenue += Number(o.shop_earning ?? 0); byDate[key].orders += 1; }
      });

      // Top products
      const productMap: Record<string, ProductStat> = {};
      rows.forEach(o => {
        (o.order_items as {product_name: string; quantity: number; total_price: number}[] ?? []).forEach(item => {
          if (!productMap[item.product_name]) productMap[item.product_name] = { product_name: item.product_name, quantity: 0, revenue: 0 };
          productMap[item.product_name].quantity += item.quantity;
          productMap[item.product_name].revenue += Number(item.total_price ?? 0);
        });
      });

      return {
        daily: Object.values(byDate),
        topProducts: Object.values(productMap).sort((a, b) => b.revenue - a.revenue).slice(0, 5),
        totalRevenue: rows.reduce((s, r) => s + Number(r.shop_earning ?? 0), 0),
        totalOrders: rows.length,
      };
    },
    enabled: !!shopData?.id,
    staleTime: 60000,
    refetchInterval: 60000,
  });

  return (
    <div className="p-4 lg:p-6 max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-gray-900">Analytics</h1>
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
          {([7, 30] as Period[]).map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${period === p ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}>
              {p}d
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">{[1,2].map(i => <Skeleton key={i} className="h-20 rounded-2xl" />)}</div>
          <Skeleton className="h-48 rounded-2xl" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-2xl border border-gray-100 p-4">
              <p className="text-xs text-gray-500 mb-1">Revenue ({period}d)</p>
              <p className="text-2xl font-black text-gray-900">{formatPrice(data?.totalRevenue ?? 0)}</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-4">
              <p className="text-xs text-gray-500 mb-1">Orders ({period}d)</p>
              <p className="text-2xl font-black text-gray-900">{data?.totalOrders ?? 0}</p>
            </div>
          </div>

          {data?.daily && <RevenueChart data={data.daily} />}

          {(data?.topProducts?.length ?? 0) > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-4">
              <h2 className="text-sm font-bold text-gray-700 mb-3">Top Products</h2>
              <div className="space-y-2">
                {data!.topProducts.map((p, i) => (
                  <div key={p.product_name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400 w-4">{i + 1}.</span>
                      <span className="text-gray-800 truncate max-w-[160px]">{p.product_name}</span>
                    </div>
                    <div className="flex items-center gap-3 text-right flex-shrink-0">
                      <span className="text-xs text-gray-400">{p.quantity} sold</span>
                      <span className="font-bold text-gray-900">{formatPrice(p.revenue)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
