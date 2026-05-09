'use client';

import { useState } from 'react';
import { Check, X, Store } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { toast } from '@/store/ui';
import { Button, Badge } from '@/components/ui';
import type { Shop } from '@/types';

interface ShopApprovalCardProps {
  shop: Shop & { owner?: { full_name: string; phone: string } };
  onAction?: () => void;
}

export function ShopApprovalCard({ shop, onAction }: ShopApprovalCardProps) {
  const [loading, setLoading] = useState<'approve' | 'reject' | null>(null);

  async function handleAction(action: 'approve' | 'reject') {
    setLoading(action);
    const { error } = await supabase
      .from('shops')
      .update({ is_approved: action === 'approve' })
      .eq('id', shop.id);
    if (error) {
      toast.error(`Failed to ${action} shop`);
    } else {
      toast.success(`Shop ${action === 'approve' ? 'approved' : 'rejected'}`);
      onAction?.();
    }
    setLoading(null);
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-start gap-4">
      <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center flex-shrink-0">
        <Store size={20} className="text-[#FF6B35]" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="font-bold text-gray-900 text-sm truncate">{shop.name}</p>
          <Badge variant="warning">Pending</Badge>
        </div>
        <p className="text-xs text-gray-500 truncate">{shop.address_line}, {shop.city}</p>
        {shop.owner && (
          <p className="text-xs text-gray-400 mt-0.5">Owner: {shop.owner.full_name} · {shop.owner.phone}</p>
        )}
      </div>
      <div className="flex gap-2 flex-shrink-0">
        <Button
          size="sm"
          variant="danger"
          isLoading={loading === 'reject'}
          disabled={!!loading}
          onClick={() => handleAction('reject')}
          leftIcon={<X size={14} />}
        >
          Reject
        </Button>
        <Button
          size="sm"
          variant="primary"
          isLoading={loading === 'approve'}
          disabled={!!loading}
          onClick={() => handleAction('approve')}
          leftIcon={<Check size={14} />}
        >
          Approve
        </Button>
      </div>
    </div>
  );
}
