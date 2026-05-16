'use client';
import { useState, useRef, useCallback } from 'react';
import { Clock, Check, X, ChevronDown, ChevronUp } from 'lucide-react';
import { useShopStore } from '@/store/shop';
import { toast } from '@/store/ui';
import { formatRelativeTime, formatPrice } from '@/lib/utils';
import { Button } from '@/components/ui';
import type { Order, OrderItem, OrderStatus } from '@/types';

type OrderWithItems = Order & {
  order_items?: (OrderItem & { product: { name: string } | null })[];
  special_instructions?: string | null;
};

function OrderRow({ order }: { order: Order }) {
  const { removePendingOrder, updateOrderStatus } = useShopStore();
  const [loading, setLoading] = useState<'accept' | 'reject' | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [detail, setDetail] = useState<OrderWithItems | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // ✅ Race condition guard — prevent duplicate actions
  const actionInFlight = useRef(false);

  const loadDetail = useCallback(async () => {
    if (detail) { setExpanded(e => !e); return; }
    setLoadingDetail(true);
    try {
      const res = await fetch(`/api/shop/orders/${order.id}`);
      if (res.ok) { const d = await res.json(); setDetail(d.order); }
    } catch { /* silent */ }
    setLoadingDetail(false);
    setExpanded(true);
  }, [detail, order.id]);

  const handleAction = useCallback(async (action: 'accept' | 'reject') => {
    if (actionInFlight.current) return; // ✅ Prevent duplicate
    actionInFlight.current = true;
    setLoading(action);
    const status: OrderStatus = action === 'accept' ? 'confirmed' : 'rejected';

    try {
      const res = await fetch(`/api/shop/orders/${order.id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? `Failed to ${action} order`);
      } else {
        removePendingOrder(order.id);
        updateOrderStatus(order.id, status);
        toast.success(action === 'accept' ? 'Order accepted!' : 'Order rejected', `#${order.order_number}`);
      }
    } catch {
      toast.error('Network error — please retry');
    } finally {
      setLoading(null);
      actionInFlight.current = false;
    }
  }, [order.id, order.order_number, removePendingOrder, updateOrderStatus]);

  const ageMin = Math.floor((Date.now() - new Date(order.created_at).getTime()) / 60000);
  const isDelayed = ageMin >= 10;

  return (
    <div className={`bg-white rounded-xl border overflow-hidden transition-colors ${isDelayed ? 'border-red-200 bg-red-50/30' : 'border-gray-100'}`}>
      <div className="flex items-center gap-2 p-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
            <span className="text-sm font-bold text-gray-900">#{order.order_number}</span>
            <span className="text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-full font-medium">Pending</span>
            {isDelayed && (
              <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-medium animate-pulse">
                ⚠️ {ageMin}m waiting
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 flex items-center gap-1">
            <Clock size={10} />
            {formatRelativeTime(order.created_at)}
            <span className="mx-0.5">·</span>
            <span className="font-semibold text-gray-700">{formatPrice(order.total_amount)}</span>
            <span className="mx-0.5">·</span>
            <span className="uppercase">{order.payment_method}</span>
          </p>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            onClick={loadDetail}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"
            title="View details"
          >
            {loadingDetail
              ? <span className="text-xs animate-pulse text-gray-400">…</span>
              : expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
          <Button size="sm" variant="danger" isLoading={loading === 'reject'} disabled={!!loading} onClick={() => handleAction('reject')} leftIcon={loading === 'reject' ? undefined : <X size={13} />}>
            Reject
          </Button>
          <Button size="sm" variant="primary" isLoading={loading === 'accept'} disabled={!!loading} onClick={() => handleAction('accept')} leftIcon={loading === 'accept' ? undefined : <Check size={13} />}>
            Accept
          </Button>
        </div>
      </div>

      {/* ✅ Inline order detail — no modal needed */}
      {expanded && detail && (
        <div className="border-t border-gray-100 px-3 py-2.5 space-y-1.5 bg-gray-50/60">
          {detail.order_items?.map((item) => (
            <div key={item.id} className="flex justify-between text-xs text-gray-700">
              <span className="truncate flex-1 mr-2">{item.product?.name ?? item.product_name} × {item.quantity}</span>
              <span className="font-semibold flex-shrink-0">{formatPrice(item.total_price)}</span>
            </div>
          ))}
          {detail.special_instructions && (
            <p className="text-xs text-orange-700 bg-orange-50 rounded-lg px-2.5 py-1.5 mt-1 border border-orange-100">
              📝 {detail.special_instructions}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export function OrderQueue() {
  const { pendingOrders } = useShopStore();

  if (pendingOrders.length === 0) {
    return (
      <div className="text-center py-8 border border-dashed border-gray-200 rounded-xl bg-white">
        <p className="text-2xl mb-1">✓</p>
        <p className="text-sm text-gray-400 font-medium">All caught up — no pending orders</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {pendingOrders.map((order) => (
        <OrderRow key={order.id} order={order} />
      ))}
    </div>
  );
}
