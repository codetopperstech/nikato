'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import Link from 'next/link';

export default function AdminOverview() {
  const [stats, setStats] = useState({ shops: 0, orders: 0, riders: 0, gmv: 0, users: 0, pending: 0, pendingShops: 0 });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const today = new Date().toISOString().split('T')[0];
      const [shops, pendingShops, orders, riders, users, pendingOrders, recent] = await Promise.all([
        supabase.from('shops').select('*', { count: 'exact', head: true }).eq('is_approved', true),
        supabase.from('shops').select('*', { count: 'exact', head: true }).eq('is_approved', false),
        supabase.from('orders').select('total_amount').gte('created_at', `${today}T00:00:00Z`),
        supabase.from('delivery_locations').select('*', { count: 'exact', head: true }).eq('is_online', true),
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('orders').select('id,order_number,status,total_amount,created_at,payment_method').order('created_at', { ascending: false }).limit(8),
      ]);
      setStats({
        shops: shops.count ?? 0,
        pendingShops: pendingShops.count ?? 0,
        orders: orders.data?.length ?? 0,
        riders: riders.count ?? 0,
        gmv: orders.data?.reduce((s, o) => s + Number(o.total_amount), 0) ?? 0,
        users: users.count ?? 0,
        pending: pendingOrders.count ?? 0,
      });
      setRecentOrders(recent.data ?? []);
      setLoading(false);
    };
    fetch();
  }, []);

  const statusColor: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700', confirmed: 'bg-blue-100 text-blue-700',
    preparing: 'bg-purple-100 text-purple-700', delivered: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-600', rejected: 'bg-red-100 text-red-600',
    ready: 'bg-indigo-100 text-indigo-700', picked_up: 'bg-cyan-100 text-cyan-700',
  };

  if (loading) return <div className="p-6 text-center text-orange-500 animate-pulse">Loading dashboard...</div>;

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Admin Overview</h1>
        <p className="text-gray-400 text-sm">Platform-wide real-time stats</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Active Shops', value: stats.shops, icon: '🏪', sub: `${stats.pendingShops} pending approval`, href: '/admin/shops', color: 'border-orange-200 bg-orange-50' },
          { label: 'Orders Today', value: stats.orders, icon: '📦', sub: `${stats.pending} pending`, href: '/admin/orders', color: 'border-blue-200 bg-blue-50' },
          { label: 'Online Riders', value: stats.riders, icon: '🛵', sub: 'Currently online', href: '/admin/delivery-partners', color: 'border-green-200 bg-green-50' },
          { label: "Today's GMV", value: `₹${stats.gmv.toFixed(0)}`, icon: '💰', sub: 'Gross merchandise value', href: '/admin/analytics', color: 'border-purple-200 bg-purple-50' },
        ].map(c => (
          <Link key={c.label} href={c.href} className={`border rounded-2xl p-4 hover:shadow-md transition ${c.color}`}>
            <span className="text-3xl">{c.icon}</span>
            <p className="text-2xl font-black mt-2">{c.value}</p>
            <p className="text-sm font-semibold text-gray-700">{c.label}</p>
            <p className="text-xs text-gray-400 mt-0.5">{c.sub}</p>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { href: '/admin/create-shop', label: 'Create Shop', icon: '🏪', color: 'hover:bg-orange-50' },
          { href: '/admin/create-delivery', label: 'Add Rider', icon: '🛵', color: 'hover:bg-green-50' },
          { href: '/admin/shops', label: `Approve Shops ${stats.pendingShops > 0 ? `(${stats.pendingShops})` : ''}`, icon: '✅', color: 'hover:bg-blue-50' },
          { href: '/admin/commissions', label: 'Commissions', icon: '💰', color: 'hover:bg-purple-50' },
        ].map(a => (
          <Link key={a.href} href={a.href} className={`bg-white border rounded-2xl p-4 text-center transition ${a.color}`}>
            <div className="text-2xl mb-2">{a.icon}</div>
            <p className="text-xs font-semibold text-gray-700">{a.label}</p>
          </Link>
        ))}
      </div>

      <div className="bg-white rounded-2xl border shadow-sm">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h2 className="font-bold">Recent Orders</h2>
          <Link href="/admin/orders" className="text-orange-500 text-sm font-semibold">View all →</Link>
        </div>
        {recentOrders.length === 0 ? (
          <div className="p-8 text-center text-gray-400">No orders yet</div>
        ) : recentOrders.map(o => (
          <div key={o.id} className="px-6 py-3 flex items-center justify-between border-b last:border-0 hover:bg-gray-50">
            <div>
              <p className="font-semibold text-sm">{o.order_number}</p>
              <p className="text-xs text-gray-400">{o.payment_method} · {new Date(o.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm">₹{o.total_amount}</span>
              <span className={`text-xs px-2 py-1 rounded-full capitalize font-medium ${statusColor[o.status] || 'bg-gray-100'}`}>{o.status}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
