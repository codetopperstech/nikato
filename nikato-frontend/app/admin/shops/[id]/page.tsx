'use client';

import { useParams } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { ArrowLeft, Check, X } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { toast } from '@/store/ui';
import { Button, Badge, Skeleton, Card } from '@/components/ui';
import { formatPrice } from '@/lib/utils';
import type { Shop } from '@/types';
import { useState } from 'react';

export default function AdminShopDetailPage() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const [updating, setUpdating] = useState(false);

  const { data: shop, isLoading } = useQuery<Shop & {
    owner: { full_name: string; phone: string; email: string | null };
    _count?: { products: number; orders: number };
  }>({
    queryKey: ['admin-shop', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shops')
        .select('*, owner:profiles(full_name, phone, email)')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: orderStats } = useQuery({
    queryKey: ['admin-shop-stats', id],
    queryFn: async () => {
      const { data } = await supabase
        .from('orders')
        .select('total_amount, commission_amount, status')
        .eq('shop_id', id);
      const delivered = (data ?? []).filter((o) => o.status === 'delivered');
      return {
        total: (data ?? []).length,
        gmv: delivered.reduce((s, o) => s + o.total_amount, 0),
        commission: delivered.reduce((s, o) => s + o.commission_amount, 0),
      };
    },
    enabled: !!id,
  });

  async function toggleApproval() {
    if (!shop) return;
    setUpdating(true);
    const { error } = await supabase.from('shops').update({ is_approved: !shop.is_approved }).eq('id', id);
    if (error) toast.error('Update failed');
    else {
      qc.invalidateQueries({ queryKey: ['admin-shop', id] });
      toast.success(`Shop ${shop.is_approved ? 'unapproved' : 'approved'}`);
    }
    setUpdating(false);
  }

  if (isLoading) {
    return (
      <div className="p-4 lg:p-6 max-w-2xl space-y-4">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-40 rounded-2xl" />
      </div>
    );
  }

  if (!shop) return <p className="p-6 text-gray-500">Shop not found</p>;

  return (
    <div className="p-4 lg:p-6 max-w-2xl space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/admin/shops" className="p-2 rounded-xl hover:bg-gray-100">
          <ArrowLeft size={20} className="text-gray-700" />
        </Link>
        <div>
          <h1 className="text-xl font-black text-gray-900">{shop.name}</h1>
          <div className="flex gap-2 mt-0.5">
            <Badge variant={shop.is_approved ? 'success' : 'warning'}>
              {shop.is_approved ? 'Approved' : 'Pending'}
            </Badge>
            <Badge variant={shop.is_open ? 'info' : 'default'}>
              {shop.is_open ? 'Open' : 'Closed'}
            </Badge>
          </div>
        </div>
      </div>

      <Card className="p-5 space-y-2">
        <h2 className="text-sm font-bold text-gray-700 mb-2">Shop Info</h2>
        {[
          { label: 'Address', value: `${shop.address_line}, ${shop.city} ${shop.pincode}` },
          { label: 'Phone', value: shop.phone },
          { label: 'Commission', value: `${(shop.commission_rate * 100).toFixed(0)}%` },
          { label: 'Delivery Radius', value: `${shop.delivery_radius_km} km` },
          { label: 'Min Order', value: formatPrice(shop.min_order_amount) },
        ].map((row) => (
          <div key={row.label} className="flex justify-between text-sm">
            <span className="text-gray-500">{row.label}</span>
            <span className="font-medium text-gray-900">{row.value}</span>
          </div>
        ))}
      </Card>

      {shop.owner && (
        <Card className="p-5 space-y-2">
          <h2 className="text-sm font-bold text-gray-700 mb-2">Owner</h2>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Name</span>
            <span className="font-medium text-gray-900">{shop.owner.full_name}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Phone</span>
            <span className="font-medium text-gray-900">{shop.owner.phone}</span>
          </div>
        </Card>
      )}

      {orderStats && (
        <Card className="p-5 space-y-2">
          <h2 className="text-sm font-bold text-gray-700 mb-2">Order Stats</h2>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Total Orders</span>
            <span className="font-bold text-gray-900">{orderStats.total}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Total GMV</span>
            <span className="font-bold text-gray-900">{formatPrice(orderStats.gmv)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Commission Earned</span>
            <span className="font-bold text-[#FF6B35]">{formatPrice(orderStats.commission)}</span>
          </div>
        </Card>
      )}

      <Button
        variant={shop.is_approved ? 'danger' : 'primary'}
        className="w-full"
        isLoading={updating}
        leftIcon={shop.is_approved ? <X size={16} /> : <Check size={16} />}
        onClick={toggleApproval}
      >
        {shop.is_approved ? 'Revoke Approval' : 'Approve Shop'}
      </Button>
    </div>
  );
}
