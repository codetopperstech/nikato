'use client';

import { useState } from 'react';
import { Clock, Check, X } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useShopStore } from '@/store/shop';
import { toast } from '@/store/ui';
import { formatRelativeTime, formatPrice } from '@/lib/utils';
import { Button, Badge, Spinner } from '@/components/ui';
import type { Order } from '@/types';

interface OrderRowProps {
  order: Order;
}

function OrderRow({ order }: OrderRowProps) {
  const { removePendingOrder } = useShopStore();
  const [loading, setLoading] = useState<'accept' | 'reject' | null>(null);

  async function handleAction(action: 'accept' | 'reject') {
    setLoading(action);
    const status = action === 'accept' ? 'confirmed' : 'rejected';
    const { error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', order.id);
    if (error) {
      toast.error(`Failed to ${action} order`);
    } else {
      removePendingOrder(order.id);
      toast.success(action === 'accept' ? 'Order accepted!' : 'Order rejected', `#${order.order_number}`);
    }
    setLoading(null);
  }

  return (
    <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-sm font-bold text-gray-900">#{order.order_number}</span>
          <Badge variant="warning">Pending</Badge>
        </div>
        <p className="text-xs text-gray-500 flex items-center gap-1">
          <Clock size={11} />
          {formatRelativeTime(order.created_at)}
          <span className="mx-1">·</span>
          {formatPrice(order.total_amount)}
        </p>
      </div>
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="danger"
          isLoading={loading === 'reject'}
          disabled={!!loading}
          onClick={() => handleAction('reject')}
          leftIcon={loading === 'reject' ? undefined : <X size={14} />}
        >
          Reject
        </Button>
        <Button
          size="sm"
          variant="primary"
          isLoading={loading === 'accept'}
          disabled={!!loading}
          onClick={() => handleAction('accept')}
          leftIcon={loading === 'accept' ? undefined : <Check size={14} />}
        >
          Accept
        </Button>
      </div>
    </div>
  );
}

export function OrderQueue() {
  const { pendingOrders } = useShopStore();

  if (pendingOrders.length === 0) {
    return (
      <p className="text-sm text-gray-500 text-center py-6">No pending orders</p>
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
