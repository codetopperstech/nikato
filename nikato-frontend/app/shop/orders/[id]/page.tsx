'use client';
import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { ArrowLeft, Phone, MapPin, Clock } from 'lucide-react';
import { useShopStore } from '@/store/shop';
import { toast } from '@/store/ui';
import { Button, Badge, Skeleton } from '@/components/ui';
import { formatPrice, formatOrderDate, formatRelativeTime } from '@/lib/utils';
import type { Order, OrderItem, OrderStatus } from '@/types';

type FullOrder = Order & {
  order_items: (OrderItem & { product: { name: string; image_url: string | null } | null })[];
  customer: { full_name: string | null; phone: string | null } | null;
  delivery_address: { address_line: string; city: string; pincode: string } | null;
};

// Valid next actions per status for shop owner
const ACTIONS: Record<string, { label: string; status: string; variant: 'primary' | 'danger' | 'ghost' }[]> = {
  pending:   [{ label: 'Reject', status: 'rejected', variant: 'danger' }, { label: 'Accept Order', status: 'confirmed', variant: 'primary' }],
  confirmed: [{ label: 'Cancel', status: 'cancelled', variant: 'danger' }, { label: 'Start Preparing', status: 'preparing', variant: 'primary' }],
  preparing: [{ label: 'Mark Ready for Pickup', status: 'ready', variant: 'primary' }],
  ready:     [],
  picked_up: [],
  delivered: [],
  cancelled: [],
  rejected:  [],
};

const STATUS_COLOR: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700', confirmed: 'bg-blue-100 text-blue-700',
  preparing: 'bg-purple-100 text-purple-700', ready: 'bg-indigo-100 text-indigo-700',
  picked_up: 'bg-cyan-100 text-cyan-700', delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-600', rejected: 'bg-red-100 text-red-600',
};

export default function ShopOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const { shopData, removePendingOrder, updateOrderStatus } = useShopStore();
  const [updating, setUpdating] = useState<string | null>(null);

  const { data: order, isLoading } = useQuery<FullOrder>({
    queryKey: ['shop-order', id],
    queryFn: async () => {
      const res = await fetch(`/api/shop/orders/${id}`);
      if (!res.ok) throw new Error('Failed to load order');
      const d = await res.json();
      return d.order as FullOrder;
    },
    enabled: !!shopData?.id && !!id,
    staleTime: 10000,
    refetchInterval: 15000,
  });

  async function handleAction(status: string) {
    setUpdating(status);
    try {
      const res = await fetch(`/api/shop/orders/${id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? 'Failed to update order');
      } else {
        removePendingOrder(id);
        updateOrderStatus(id, status as OrderStatus);
        qc.invalidateQueries({ queryKey: ['shop-order', id] });
        qc.invalidateQueries({ queryKey: ['shop-orders', shopData?.id] });
        toast.success(`Order ${status}`);
        if (status === 'rejected' || status === 'cancelled') router.push('/shop/orders');
      }
    } catch {
      toast.error('Network error. Please retry.');
    }
    setUpdating(null);
  }

  if (isLoading) {
    return (
      <div className="p-4 lg:p-6 max-w-2xl space-y-4">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-40 rounded-2xl" />
        <Skeleton className="h-24 rounded-2xl" />
      </div>
    );
  }

  if (!order) return <p className="p-6 text-gray-500">Order not found</p>;

  const ageMin = Math.floor((Date.now() - new Date(order.created_at).getTime()) / 60000);
  const actions = ACTIONS[order.status] ?? [];

  return (
    <div className="p-4 lg:p-6 max-w-2xl space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/shop/orders" className="p-2 rounded-xl hover:bg-gray-100"><ArrowLeft size={20} className="text-gray-700" /></Link>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-black text-gray-900">#{order.order_number}</h1>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${STATUS_COLOR[order.status]}`}>{order.status.replace('_', ' ')}</span>
            {order.status === 'pending' && ageMin >= 10 && (
              <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">⚠️ Waiting {ageMin}m</span>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-0.5">{formatOrderDate(order.created_at)} · {formatRelativeTime(order.created_at)}</p>
        </div>
      </div>

      {/* Customer info */}
      {order.customer && (
        <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Customer</p>
            <p className="font-semibold text-gray-900 text-sm">{order.customer.full_name ?? 'Customer'}</p>
          </div>
          {order.customer.phone && (
            <a href={`tel:${order.customer.phone}`} className="flex items-center gap-1.5 text-sm text-[#FF6B35] font-semibold bg-orange-50 px-3 py-2 rounded-xl">
              <Phone size={14} /> Call
            </a>
          )}
        </div>
      )}

      {/* Delivery address */}
      {order.delivery_address && (
        <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-start gap-3">
          <MapPin size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Delivery to</p>
            <p className="text-sm text-gray-800">{order.delivery_address.address_line}, {order.delivery_address.city} — {order.delivery_address.pincode}</p>
          </div>
        </div>
      )}

      {/* Items */}
      <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50">
        {order.order_items.map((item) => (
          <div key={item.id} className="flex items-center justify-between px-4 py-3 gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900">{item.product?.name ?? item.product_name}</p>
              <p className="text-xs text-gray-400">× {item.quantity} @ {formatPrice(item.unit_price)}</p>
            </div>
            <p className="text-sm font-bold text-gray-900 flex-shrink-0">{formatPrice(item.total_price)}</p>
          </div>
        ))}
        <div className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-b-2xl">
          <div>
            <p className="text-xs text-gray-400">Subtotal</p>
            <p className="text-xs text-gray-400">Delivery</p>
            <p className="text-sm font-bold text-gray-700 mt-1">Total</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-600">{formatPrice(order.subtotal)}</p>
            <p className="text-xs text-gray-600">{formatPrice(order.delivery_fee)}</p>
            <p className="text-base font-black text-gray-900 mt-1">{formatPrice(order.total_amount)}</p>
          </div>
        </div>
      </div>

      {/* Payment + notes */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Payment</span>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${order.payment_status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
            {order.payment_method} · {order.payment_status}
          </span>
        </div>
        {order.special_instructions && (
          <div className="text-sm">
            <span className="text-gray-500 block mb-1">Customer note</span>
            <p className="text-gray-900 bg-orange-50 text-orange-800 rounded-xl px-3 py-2 text-xs">{order.special_instructions}</p>
          </div>
        )}
        <div className="flex justify-between text-sm">
          <span className="text-gray-500 flex items-center gap-1"><Clock size={12} /> Age</span>
          <span className="text-gray-700">{ageMin}m ago</span>
        </div>
      </div>

      {/* Actions */}
      {actions.length > 0 && (
        <div className={`flex gap-3 ${actions.length > 1 ? '' : ''}`}>
          {actions.map((action) => (
            <Button key={action.status} variant={action.variant} className="flex-1"
              isLoading={updating === action.status} disabled={!!updating}
              onClick={() => handleAction(action.status)}>
              {action.label}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
