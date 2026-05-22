'use client';
import { useState, useRef, useCallback } from 'react';
import { Clock, Check, X, ChevronDown, ChevronUp } from 'lucide-react';
import { useShopStore } from '@/store/shop';
import { toast } from '@/store/ui';
import { formatRelativeTime, formatPrice } from '@/lib/utils';
import type { Order, OrderItem, OrderStatus } from '@/types';

type OrderWithItems = Order & { order_items?: (OrderItem & { product: { name: string } | null })[]; special_instructions?: string | null; };

function OrderRow({ order }: { order: Order }) {
  const { removePendingOrder, updateOrderStatus } = useShopStore();
  const [loading, setLoading] = useState<'accept' | 'reject' | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [detail, setDetail] = useState<OrderWithItems | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const actionInFlight = useRef(false);

  const loadDetail = useCallback(async () => {
    if (detail) { setExpanded(e => !e); return; }
    setLoadingDetail(true);
    try { const res = await fetch(`/api/shop/orders/${order.id}`); if (res.ok) { const d = await res.json(); setDetail(d.order); } } catch { /* silent */ }
    setLoadingDetail(false);
    setExpanded(true);
  }, [detail, order.id]);

  const handleAction = useCallback(async (action: 'accept' | 'reject') => {
    if (actionInFlight.current) return;
    actionInFlight.current = true;
    setLoading(action);
    const status: OrderStatus = action === 'accept' ? 'confirmed' : 'rejected';
    try {
      const res = await fetch(`/api/shop/orders/${order.id}/status`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
      const data = await res.json();
      if (!res.ok) toast.error(data.error ?? `Failed to ${action}`);
      else { removePendingOrder(order.id); updateOrderStatus(order.id, status); toast.success(action === 'accept' ? 'Order accepted!' : 'Order rejected', `#${order.order_number}`); }
    } catch { toast.error('Network error — retry'); }
    finally { setLoading(null); actionInFlight.current = false; }
  }, [order.id, order.order_number, removePendingOrder, updateOrderStatus]);

  const ageMin = Math.floor((Date.now() - new Date(order.created_at).getTime()) / 60000);
  const isDelayed = ageMin >= 10;

  return (
    <div className={`bg-white rounded-2xl border overflow-hidden transition-colors ${isDelayed ? 'border-red-200' : 'border-gray-100'}`}>
      <div className="flex items-center gap-3 p-3.5">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1 flex-wrap">
            <span className="text-sm font-black text-gray-900">#{order.order_number}</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: '#fff7ed', color: '#c2570a' }}>Pending</span>
            {isDelayed && <span className="text-xs px-2 py-0.5 rounded-full font-semibold animate-pulse" style={{ background: '#fef2f2', color: '#dc2626' }}>⚠ {ageMin}m</span>}
          </div>
          <p className="text-xs text-gray-500 flex items-center gap-1">
            <Clock size={10} />{formatRelativeTime(order.created_at)}
            <span className="mx-1">·</span>
            <span className="font-bold text-gray-700">{formatPrice(order.total_amount)}</span>
            <span className="mx-1">·</span>
            <span className="uppercase text-gray-400">{order.payment_method}</span>
          </p>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button onClick={loadDetail} className="p-1.5 rounded-xl hover:bg-surface-2 text-gray-400 transition-colors">
            {loadingDetail ? <div className="w-3 h-3 rounded-full border-2 border-gray-300 border-t-transparent animate-spin" /> : expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          <button onClick={() => handleAction('reject')} disabled={!!loading}
            className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold border-[1.5px] border-red-200 text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50">
            {loading === 'reject' ? <div className="w-3 h-3 rounded-full border-2 border-red-400 border-t-transparent animate-spin" /> : <X size={13} />}
            Reject
          </button>
          <button onClick={() => handleAction('accept')} disabled={!!loading}
            className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold text-white transition-all active:scale-95 disabled:opacity-50"
            style={{ background: '#7ED957' }}>
            {loading === 'accept' ? <div className="w-3 h-3 rounded-full border-2 border-white border-t-transparent animate-spin" /> : <Check size={13} />}
            Accept
          </button>
        </div>
      </div>

      {expanded && detail && (
        <div className="border-t border-gray-50 px-3.5 py-3 space-y-1.5" style={{ background: '#F9FBF8' }}>
          {detail.order_items?.map(item => (
            <div key={item.id} className="flex justify-between text-xs text-gray-700">
              <span className="truncate flex-1 mr-2">{item.product?.name ?? item.product_name} × {item.quantity}</span>
              <span className="font-bold flex-shrink-0">{formatPrice(item.total_price)}</span>
            </div>
          ))}
          {detail.special_instructions && (
            <p className="text-xs text-amber-800 bg-amber-50 border border-amber-100 rounded-xl px-2.5 py-2 mt-1">📝 {detail.special_instructions}</p>
          )}
        </div>
      )}
    </div>
  );
}

export function OrderQueue() {
  const { pendingOrders } = useShopStore();
  if (pendingOrders.length === 0) return (
    <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-2xl bg-white">
      <div className="text-2xl mb-2">✓</div>
      <p className="text-sm font-semibold text-gray-400">All caught up — no pending orders</p>
    </div>
  );
  return <div className="space-y-2">{pendingOrders.map(o => <OrderRow key={o.id} order={o} />)}</div>;
}
