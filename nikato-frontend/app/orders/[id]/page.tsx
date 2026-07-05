'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, MapPin, Package, CheckCircle2, Clock, Truck, Home } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useOrderRealtime } from '@/hooks/useOrderRealtime';
import { Spinner } from '@/components/ui';
import { formatPrice, formatOrderDate, getDeliveryOtp } from '@/lib/utils';
import type { Order, OrderItem } from '@/types';

const STEPS = [
  { status: 'pending',   icon: Clock,         label: 'Order Placed',    color: '#F59E0B' },
  { status: 'confirmed', icon: CheckCircle2,  label: 'Confirmed',       color: '#7CCBFF' },
  { status: 'preparing', icon: Package,       label: 'Preparing',       color: '#a78bfa' },
  { status: 'ready',     icon: Package,       label: 'Ready',           color: '#7ED957' },
  { status: 'picked_up', icon: Truck,         label: 'On the way',      color: '#7ED957' },
  { status: 'delivered', icon: Home,          label: 'Delivered',       color: '#7ED957' },
];

const STATUS_IDX: Record<string, number> = { pending: 0, confirmed: 1, preparing: 2, ready: 3, picked_up: 4, delivered: 5 };

export default function OrderDetailPage() {
  const params = useParams();
  const id = (Array.isArray(params.id) ? params.id[0] : params.id) ?? '';
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);

  const { isLoading } = useQuery({
    queryKey: ['order-detail', id],
    queryFn: async () => {
      const res = await fetch(`/api/orders/${id}`);
      if (!res.ok) throw new Error('Order not found');
      const d = await res.json();
      setOrder(d.order as Order);
      setItems((d.order.order_items ?? []) as OrderItem[]);
      return d.order as Order;
    },
    enabled: !!id,
    staleTime: 0,
    refetchInterval: 15000,
  });

  const { order: realtimeOrder } = useOrderRealtime(id);
  useEffect(() => { if (realtimeOrder) setOrder(prev => prev ? { ...prev, ...realtimeOrder } : realtimeOrder); }, [realtimeOrder]);

  const { data: address } = useQuery({
    queryKey: ['address', order?.delivery_address_id],
    queryFn: async () => { const { data } = await supabase.from('addresses').select('*').eq('id', order!.delivery_address_id).single(); return data; },
    enabled: !!order?.delivery_address_id,
  });

  if (isLoading && !order) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#F9FBF8' }}>
      <Spinner size="lg" style={{ color: '#7ED957' } as React.CSSProperties} />
    </div>
  );
  if (!order) return null;

  const currentIdx = STATUS_IDX[order.status] ?? 0;
  const isCancelled = ['cancelled', 'rejected'].includes(order.status);

  return (
    <div className="min-h-screen pb-10" style={{ background: '#F9FBF8' }}>
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 py-3.5 flex items-center gap-3" style={{ boxShadow: '0 1px 8px rgba(0,0,0,0.05)' }}>
        <button onClick={() => router.back()} className="p-2 rounded-xl hover:bg-surface-2 transition-colors"><ArrowLeft size={20} className="text-gray-700" /></button>
        <div className="flex-1">
          <h1 className="text-base font-black text-gray-900">{order.order_number}</h1>
          <p className="text-xs text-gray-400">{formatOrderDate(order.created_at)}</p>
        </div>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${isCancelled ? 'bg-red-50 text-red-500' : 'text-white'}`}
          style={!isCancelled ? { background: '#7ED957', color: 'white' } : {}}>
          {order.status.replace('_', ' ')}
        </span>
      </div>

      <div className="max-w-lg mx-auto px-4 py-5 space-y-4">
        {/* Status timeline */}
        {!isCancelled && (
          <div className="bg-white rounded-3xl border border-gray-100 p-5 shadow-card">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-5">Order Status</h2>
            <div className="space-y-0">
              {STEPS.map((step, idx) => {
                const done = idx <= currentIdx;
                const active = idx === currentIdx;
                const Icon = step.icon;
                return (
                  <div key={step.status} className="flex items-start gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${active ? 'shadow-lg' : ''}`}
                        style={{ background: done ? step.color : '#f3f4f6', transition: 'all 0.3s' }}>
                        <Icon size={15} className={done ? 'text-white' : 'text-gray-400'} />
                      </div>
                      {idx < STEPS.length - 1 && (
                        <div className="w-0.5 h-6 mt-1 rounded-full transition-all" style={{ background: idx < currentIdx ? '#7ED957' : '#e5e7eb' }} />
                      )}
                    </div>
                    <div className="pt-1 pb-5">
                      <p className={`text-sm font-${active ? 'black' : done ? 'semibold' : 'medium'} ${active ? 'text-gray-900' : done ? 'text-gray-600' : 'text-gray-400'}`}>
                        {step.label}
                        {active && <span className="ml-2 inline-block w-1.5 h-1.5 rounded-full animate-pulse align-middle" style={{ background: step.color }} />}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {isCancelled && (
          <div className="bg-red-50 rounded-2xl border border-red-100 p-4 text-center">
            <div className="text-3xl mb-2">😔</div>
            <p className="font-bold text-red-600">{order.status === 'cancelled' ? 'Order Cancelled' : 'Order Rejected'}</p>
            {(order as any).cancelled_reason && <p className="text-sm text-red-400 mt-1">{(order as any).cancelled_reason}</p>}
          </div>
        )}

        {/* Delivery OTP — shown when rider is on the way */}
        {order.status === 'picked_up' && (
          <div className="rounded-2xl border-2 p-4 text-center" style={{ borderColor: '#7ED957', background: '#f0fce8' }}>
            <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: '#5cb83a' }}>🔐 Delivery OTP</p>
            <p className="text-4xl font-black tracking-[0.3em] my-2" style={{ color: '#2d6a12' }}>{getDeliveryOtp(order.id)}</p>
            <p className="text-xs text-gray-500">Share this code with the delivery partner to confirm handover</p>
          </div>
        )}

        {/* Items */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-50">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Items Ordered</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {items.map(item => (
              <div key={item.id} className="flex items-center justify-between px-4 py-3 gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold text-white" style={{ background: '#7ED957' }}>{item.quantity}</span>
                  <span className="text-sm text-gray-800">{item.product_name}</span>
                </div>
                <span className="font-bold text-sm text-gray-900">{formatPrice(item.total_price)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bill */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-card">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Bill Details</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-gray-500"><span>Subtotal</span><span>{formatPrice(order.subtotal)}</span></div>
            <div className="flex justify-between text-gray-500"><span>Delivery fee</span><span>{Number(order.delivery_fee) === 0 ? <span style={{ color: '#5cb83a' }}>FREE</span> : formatPrice(order.delivery_fee)}</span></div>
            {Number(order.discount) > 0 && <div className="flex justify-between" style={{ color: '#5cb83a' }}><span>Discount</span><span>-{formatPrice(order.discount)}</span></div>}
            <div className="flex justify-between font-black text-gray-900 text-base pt-2.5 border-t border-gray-100">
              <span>Total Paid</span><span>{formatPrice(order.total_amount)}</span>
            </div>
            <div className="flex justify-between text-xs text-gray-400 pt-1">
              <span>Payment</span>
              <span className={`font-semibold ${order.payment_status === 'paid' ? '' : ''}`} style={order.payment_status === 'paid' ? { color: '#5cb83a' } : {}}>
                {order.payment_method === 'COD' ? 'Cash on Delivery' : 'Online'} · {order.payment_status}
              </span>
            </div>
          </div>
        </div>

        {/* Address */}
        {address && (
          <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-start gap-3 shadow-card">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#edfbdc' }}>
              <MapPin size={16} style={{ color: '#5cb83a' }} />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Delivered to</p>
              <p className="text-sm text-gray-700 leading-relaxed">
                {(address as any).label && <span className="font-semibold">{(address as any).label} · </span>}
                {(address as any).address_line}, {(address as any).city} - {(address as any).pincode}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
