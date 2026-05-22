'use client';
import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { ArrowLeft, Phone, MapPin, Clock } from 'lucide-react';
import { useShopStore } from '@/store/shop';
import { toast } from '@/store/ui';
import { Skeleton } from '@/components/ui';
import { formatPrice, formatOrderDate, formatRelativeTime } from '@/lib/utils';
import type { Order, OrderItem, OrderStatus } from '@/types';

type FullOrder = Order & {
  order_items: (OrderItem & { product: { name: string; image_url: string | null } | null })[];
  customer: { full_name: string | null; phone: string | null } | null;
  delivery_address: { address_line: string; city: string; pincode: string } | null;
};

const ACTIONS: Record<string, { label: string; status: string; primary: boolean }[]> = {
  pending:   [{ label: 'Reject', status: 'rejected', primary: false }, { label: 'Accept Order', status: 'confirmed', primary: true }],
  confirmed: [{ label: 'Cancel', status: 'cancelled', primary: false }, { label: 'Start Preparing', status: 'preparing', primary: true }],
  preparing: [{ label: 'Mark Ready', status: 'ready', primary: true }],
};

const STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  pending:   { bg: '#fff7ed', color: '#c2570a', label: 'Pending' },
  confirmed: { bg: '#e8f6ff', color: '#0369a1', label: 'Confirmed' },
  preparing: { bg: '#f5f3ff', color: '#7c3aed', label: 'Preparing' },
  ready:     { bg: '#edfbdc', color: '#3a7a1f', label: 'Ready' },
  picked_up: { bg: '#edfbdc', color: '#3a7a1f', label: 'Picked Up' },
  delivered: { bg: '#edfbdc', color: '#166534', label: 'Delivered' },
  cancelled: { bg: '#fef2f2', color: '#dc2626', label: 'Cancelled' },
  rejected:  { bg: '#fef2f2', color: '#dc2626', label: 'Rejected' },
};

export default function ShopOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const { shopData, removePendingOrder, updateOrderStatus } = useShopStore();
  const [updating, setUpdating] = useState<string | null>(null);

  const { data: order, isLoading } = useQuery<FullOrder>({
    queryKey: ['shop-order', id],
    queryFn: async () => { const res = await fetch(`/api/shop/orders/${id}`); if (!res.ok) throw new Error('Failed'); return (await res.json()).order as FullOrder; },
    enabled: !!shopData?.id && !!id,
    staleTime: 10000, refetchInterval: 15000,
  });

  async function handleAction(status: string) {
    setUpdating(status);
    try {
      const res = await fetch(`/api/shop/orders/${id}/status`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? 'Failed'); }
      else {
        removePendingOrder(id); updateOrderStatus(id, status as OrderStatus);
        qc.invalidateQueries({ queryKey: ['shop-order', id] });
        qc.invalidateQueries({ queryKey: ['shop-orders', shopData?.id] });
        toast.success(`Order ${status}`);
        if (status === 'rejected' || status === 'cancelled') router.push('/shop/orders');
      }
    } catch { toast.error('Network error. Retry.'); }
    setUpdating(null);
  }

  if (isLoading) return <div className="p-4 space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-20 rounded-2xl" />)}</div>;
  if (!order) return <p className="p-6 text-gray-500 text-sm">Order not found</p>;

  const s = STATUS_STYLE[order.status] ?? STATUS_STYLE.pending;
  const actions = ACTIONS[order.status] ?? [];
  const ageMin = Math.floor((Date.now() - new Date(order.created_at).getTime()) / 60000);

  return (
    <div className="p-4 lg:p-6 max-w-2xl space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/shop/orders" className="p-2 rounded-xl hover:bg-surface-2 transition-colors"><ArrowLeft size={20} className="text-gray-700" /></Link>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-lg font-black text-gray-900">#{order.order_number}</h1>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full capitalize" style={{ background: s.bg, color: s.color }}>{s.label}</span>
            {order.status === 'pending' && ageMin >= 10 && <span className="text-xs bg-red-50 text-red-500 px-2 py-0.5 rounded-full font-semibold animate-pulse">⚠ {ageMin}m waiting</span>}
          </div>
          <p className="text-xs text-gray-400 mt-0.5">{formatOrderDate(order.created_at)} · {formatRelativeTime(order.created_at)}</p>
        </div>
      </div>

      {/* Customer */}
      {order.customer && (
        <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center justify-between shadow-card">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white text-sm" style={{ background: '#7ED957' }}>
              {order.customer.full_name?.[0]?.toUpperCase() ?? '?'}
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">{order.customer.full_name ?? 'Customer'}</p>
              <p className="text-xs text-gray-400">{order.customer.phone}</p>
            </div>
          </div>
          {order.customer.phone && (
            <a href={`tel:${order.customer.phone}`} className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl" style={{ background: '#edfbdc', color: '#5cb83a' }}>
              <Phone size={13} /> Call
            </a>
          )}
        </div>
      )}

      {/* Address */}
      {order.delivery_address && (
        <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-start gap-3 shadow-card">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#edfbdc' }}>
            <MapPin size={15} style={{ color: '#5cb83a' }} />
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Deliver to</p>
            <p className="text-sm text-gray-800">{order.delivery_address.address_line}, {order.delivery_address.city} — {order.delivery_address.pincode}</p>
          </div>
        </div>
      )}

      {/* Items */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden">
        <p className="px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-50">Items</p>
        <div className="divide-y divide-gray-50">
          {order.order_items.map(item => (
            <div key={item.id} className="flex items-center justify-between px-4 py-3 gap-3">
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-lg text-xs font-black text-white flex items-center justify-center" style={{ background: '#7ED957' }}>{item.quantity}</span>
                <span className="text-sm text-gray-800">{item.product?.name ?? item.product_name}</span>
              </div>
              <span className="font-bold text-sm text-gray-900">{formatPrice(item.total_price)}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-surface-2">
          <span className="text-sm font-black text-gray-900">Total</span>
          <span className="text-base font-black text-gray-900">{formatPrice(order.total_amount)}</span>
        </div>
      </div>

      {/* Payment + notes */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-card space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Payment</span>
          <span className="font-semibold px-2 py-0.5 rounded-full text-xs" style={order.payment_status === 'paid' ? { background: '#edfbdc', color: '#3a7a1f' } : { background: '#fff7ed', color: '#c2570a' }}>
            {order.payment_method} · {order.payment_status}
          </span>
        </div>
        {order.special_instructions && (
          <div className="bg-amber-50 border border-amber-100 rounded-xl px-3 py-2.5 text-xs text-amber-800">
            📝 {order.special_instructions}
          </div>
        )}
        <div className="flex items-center gap-1 text-xs text-gray-400"><Clock size={11} /> {ageMin} minutes ago</div>
      </div>

      {/* Actions */}
      {actions.length > 0 && (
        <div className="flex gap-3">
          {actions.map(action => (
            <button key={action.status}
              onClick={() => handleAction(action.status)}
              disabled={!!updating}
              className={`flex-1 py-3.5 rounded-2xl font-bold text-sm transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center ${action.primary ? 'text-white' : 'border-[1.5px] border-gray-200 text-gray-700 hover:bg-surface-2'}`}
              style={action.primary ? { background: '#7ED957' } : {}}>
              {updating === action.status ? <div className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" /> : action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
