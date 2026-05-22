'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Store, ShoppingBag, Truck, TrendingUp, Clock, CheckCircle2, Plus } from 'lucide-react';
import { Skeleton } from '@/components/ui';
import { formatPrice, formatRelativeTime } from '@/lib/utils';

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  pending:   { bg: '#fff7ed', color: '#c2570a' },
  confirmed: { bg: '#e8f6ff', color: '#0369a1' },
  preparing: { bg: '#f5f3ff', color: '#7c3aed' },
  ready:     { bg: '#edfbdc', color: '#3a7a1f' },
  picked_up: { bg: '#edfbdc', color: '#3a7a1f' },
  delivered: { bg: '#edfbdc', color: '#166534' },
  cancelled: { bg: '#fef2f2', color: '#dc2626' },
  rejected:  { bg: '#fef2f2', color: '#dc2626' },
};

export default function AdminOverview() {
  const [stats, setStats] = useState({ shops: 0, orders: 0, riders: 0, gmv: 0, users: 0, pending: 0, pendingShops: 0 });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/stats').then(r => r.json()).then(d => {
      if (!d.error) { setStats(d.stats); setRecentOrders(d.recentOrders); }
    }).finally(() => setLoading(false));
  }, []);

  const STAT_CARDS = [
    { label: 'Active Shops', value: String(stats.shops), sub: `${stats.pendingShops} pending`, icon: Store, href: '/admin/shops', color: '#7ED957' },
    { label: 'Orders Today', value: String(stats.orders), sub: `${stats.pending} pending`, icon: ShoppingBag, href: '/admin/orders', color: '#7CCBFF' },
    { label: 'Online Riders', value: String(stats.riders), sub: 'Currently active', icon: Truck, href: '/admin/delivery-partners', color: '#7ED957' },
    { label: "Today's GMV", value: formatPrice(stats.gmv), sub: 'Gross revenue', icon: TrendingUp, href: '/admin/analytics', color: '#7CCBFF' },
  ];

  return (
    <div className="p-4 lg:p-6 space-y-5 max-w-4xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-gray-900">Overview</h1>
        <div className="flex gap-2">
          <Link href="/admin/create-shop" className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-white transition-all active:scale-95" style={{ background: '#7ED957' }}>
            <Plus size={13} /> Shop
          </Link>
          <Link href="/admin/create-delivery" className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border border-gray-200 text-gray-700 hover:bg-surface-2 transition-all">
            <Plus size={13} /> Rider
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {STAT_CARDS.map(c => (
          <Link key={c.label} href={c.href}
            className="bg-white rounded-2xl border border-gray-100 p-4 shadow-card hover:shadow-card-hover transition-all hover:-translate-y-0.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: c.color + '20' }}>
              <c.icon size={18} style={{ color: c.color === '#7ED957' ? '#5cb83a' : '#0284c7' }} />
            </div>
            {loading ? <div className="h-7 bg-surface-2 rounded-lg animate-pulse mb-1" /> : <p className="text-2xl font-black text-gray-900">{c.value}</p>}
            <p className="text-xs font-semibold text-gray-600 mt-0.5">{c.label}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">{c.sub}</p>
          </Link>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { href: '/admin/shops', label: 'Approve Shops', icon: '✅', badge: stats.pendingShops > 0 ? stats.pendingShops : null },
          { href: '/admin/orders', label: 'All Orders', icon: '📦', badge: null },
          { href: '/admin/commissions', label: 'Commissions', icon: '💰', badge: null },
          { href: '/admin/analytics', label: 'Analytics', icon: '📊', badge: null },
        ].map(a => (
          <Link key={a.href} href={a.href} className="bg-white rounded-2xl border border-gray-100 p-4 text-center hover:shadow-card-hover transition-all hover:-translate-y-0.5 relative">
            <div className="text-2xl mb-2">{a.icon}</div>
            <p className="text-xs font-semibold text-gray-700">{a.label}</p>
            {a.badge && <span className="absolute top-2 right-2 w-5 h-5 rounded-full text-[10px] font-black text-white flex items-center justify-center" style={{ background: '#ef4444' }}>{a.badge}</span>}
          </Link>
        ))}
      </div>

      {/* Recent orders */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
          <h2 className="font-black text-gray-900 text-sm">Recent Orders</h2>
          <Link href="/admin/orders" className="text-xs font-semibold" style={{ color: '#5cb83a' }}>View all →</Link>
        </div>
        {loading ? (
          <div className="p-4 space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-12 rounded-xl" />)}</div>
        ) : recentOrders.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">No orders yet</div>
        ) : recentOrders.map((o: any) => {
          const s = STATUS_STYLE[o.status] ?? STATUS_STYLE.pending;
          return (
            <div key={o.id} className="px-5 py-3.5 flex items-center justify-between border-b border-gray-50 last:border-0 hover:bg-surface-2 transition-colors">
              <div>
                <p className="font-bold text-sm text-gray-900">#{o.order_number}</p>
                <p className="text-xs text-gray-400">{o.payment_method} · {formatRelativeTime(o.created_at)}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-black text-sm text-gray-900">{formatPrice(o.total_amount)}</span>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full capitalize" style={{ background: s.bg, color: s.color }}>{o.status.replace('_', ' ')}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
