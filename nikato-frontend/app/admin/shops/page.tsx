'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { ChevronRight, Plus } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { ShopApprovalCard } from '@/components/admin/ShopApprovalCard';
import { Badge, Skeleton, EmptyState, Button } from '@/components/ui';
import { formatPrice } from '@/lib/utils';
import type { Shop } from '@/types';

type ShopWithOwner = Shop & { owner: { full_name: string; phone: string } };

export default function AdminShopsPage() {
  const [tab, setTab] = useState<'approved' | 'pending'>('pending');
  const qc = useQueryClient();

  const { data: shops = [], isLoading } = useQuery<ShopWithOwner[]>({
    queryKey: ['admin-shops', tab],
    queryFn: async () => {
      const { data } = await supabase
        .from('shops')
        .select('*, owner:profiles(full_name, phone)')
        .eq('is_approved', tab === 'approved')
        .order('created_at', { ascending: false });
      return (data ?? []) as ShopWithOwner[];
    },
    staleTime: 30000,
  });

  return (
    <div className="p-4 lg:p-6 max-w-3xl">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-black text-gray-900">Shops</h1>
        <Link href="/admin/create-shop">
          <Button size="sm" leftIcon={<Plus size={16} />}>Create Shop</Button>
        </Link>
      </div>

      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-4">
        {(['pending', 'approved'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-1.5 rounded-lg text-sm font-semibold transition-colors capitalize ${tab === t ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}
          >
            {t}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-2">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}</div>
      ) : shops.length === 0 ? (
        <EmptyState title={`No ${tab} shops`} />
      ) : tab === 'pending' ? (
        <div className="space-y-2">
          {shops.map((shop) => (
            <ShopApprovalCard
              key={shop.id}
              shop={shop}
              onAction={() => qc.invalidateQueries({ queryKey: ['admin-shops'] })}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {shops.map((shop) => (
            <Link
              key={shop.id}
              href={`/admin/shops/${shop.id}`}
              className="flex items-center gap-3 bg-white rounded-2xl border border-gray-100 p-4 hover:border-[#FF6B35]/30 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-bold text-gray-900 text-sm truncate">{shop.name}</span>
                  <Badge variant={shop.is_open ? 'success' : 'default'}>{shop.is_open ? 'Open' : 'Closed'}</Badge>
                </div>
                <p className="text-xs text-gray-500 truncate">{shop.city} · {shop.owner?.full_name}</p>
              </div>
              <ChevronRight size={16} className="text-gray-400" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
