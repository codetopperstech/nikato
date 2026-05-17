'use client';
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/store/ui';
import { DataTable, type Column } from '@/components/admin/DataTable';
import { Button, Input, Skeleton } from '@/components/ui';
import type { Shop } from '@/types';

type ShopRow = Shop & { owner: { full_name: string } | null };

export default function AdminCommissionsPage() {
  const qc = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRate, setEditRate] = useState('');
  const [saving, setSaving] = useState(false);

  const { data: shops = [], isLoading } = useQuery<ShopRow[]>({
    queryKey: ['admin-commissions'],
    queryFn: async () => {
      const res = await fetch('/api/admin/commissions');
      if (!res.ok) throw new Error('Failed to load');
      const d = await res.json();
      return d.shops as ShopRow[];
    },
  });

  async function saveCommission(id: string) {
    const rate = parseFloat(editRate);
    if (isNaN(rate) || rate < 0 || rate > 1) { toast.error('Enter value between 0 and 1 (e.g. 0.10 for 10%)'); return; }
    setSaving(true);
    const res = await fetch('/api/admin/commissions', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, commission_rate: rate }),
    });
    if (!res.ok) toast.error('Failed to update commission');
    else { qc.invalidateQueries({ queryKey: ['admin-commissions'] }); setEditingId(null); toast.success('Commission updated'); }
    setSaving(false);
  }

  const COLUMNS: Column<ShopRow>[] = [
    { key: 'name', label: 'Shop', render: (r) => <span className="font-semibold">{r.name}</span> },
    { key: 'owner', label: 'Owner', render: (r) => r.owner?.full_name ?? '—' },
    { key: 'city', label: 'City' },
    { key: 'commission_rate', label: 'Commission', render: (r) =>
      editingId === r.id
        ? <Input value={editRate} onChange={(e) => setEditRate(e.target.value)} className="w-24 py-1.5" placeholder="0.10" type="number" step="0.01" />
        : <span className="font-bold text-[#FF6B35]">{(r.commission_rate * 100).toFixed(0)}%</span>
    },
  ];

  return (
    <div className="p-4 lg:p-6 max-w-4xl">
      <h1 className="text-2xl font-black text-gray-900 mb-4">Commissions</h1>
      {isLoading ? (
        <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-12 rounded-xl" />)}</div>
      ) : (
        <DataTable columns={COLUMNS} data={shops}
          actions={(shop) => editingId === shop.id ? (
            <div className="flex gap-2 justify-end">
              <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>Cancel</Button>
              <Button size="sm" variant="primary" isLoading={saving} onClick={() => saveCommission(shop.id)}>Save</Button>
            </div>
          ) : (
            <Button size="sm" variant="outline" onClick={() => { setEditingId(shop.id); setEditRate(shop.commission_rate.toString()); }}>Edit</Button>
          )}
          emptyText="No approved shops"
        />
      )}
    </div>
  );
}
