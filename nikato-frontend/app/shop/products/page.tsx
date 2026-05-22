'use client';
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { Plus, Pencil, Trash2, RefreshCw } from 'lucide-react';
import { useShopStore } from '@/store/shop';
import { toast } from '@/store/ui';
import { Button, Badge, Skeleton, Modal } from '@/components/ui';
import { formatPrice } from '@/lib/utils';
import type { Category, Product } from '@/types';

type PW = Product & { category: Category | null };

export default function ShopProductsPage() {
  const { shopData } = useShopStore();
  const qc = useQueryClient();
  const [filter, setFilter] = useState('all');
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);

  const { data: products = [], isLoading, refetch, isFetching } = useQuery<PW[]>({
    queryKey: ['shop-products-list', shopData?.id],
    queryFn: async () => { const res = await fetch('/api/shop/products'); if (!res.ok) throw new Error('Failed'); return (await res.json()).products as PW[]; },
    enabled: !!shopData?.id, staleTime: 30000,
  });
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['shop-categories', shopData?.id],
    queryFn: async () => { const res = await fetch('/api/shop/categories'); if (!res.ok) return []; return (await res.json()).categories as Category[]; },
    enabled: !!shopData?.id,
  });

  async function toggleAvailable(p: Product) {
    await fetch('/api/shop/products', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: p.id, is_available: !p.is_available }) });
    qc.invalidateQueries({ queryKey: ['shop-products-list', shopData?.id] });
  }
  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    const res = await fetch('/api/shop/products', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: deleteTarget.id }) });
    if (res.ok) { qc.invalidateQueries({ queryKey: ['shop-products-list', shopData?.id] }); toast.success('Deleted'); }
    else toast.error('Failed to delete');
    setDeleteTarget(null); setDeleting(false);
  }

  const filtered = filter === 'all' ? products : products.filter(p => p.category_id === filter);

  return (
    <div className="p-4 lg:p-6 max-w-3xl">
      <div className="flex items-center justify-between mb-4">
        <div><h1 className="text-2xl font-black text-gray-900">Products</h1><p className="text-xs text-gray-400 mt-0.5">{products.length} total</p></div>
        <div className="flex gap-2">
          <button onClick={() => refetch()} disabled={isFetching} className="p-2.5 rounded-xl hover:bg-surface-2 text-gray-400 border border-gray-200">
            <RefreshCw size={15} className={isFetching ? 'animate-spin' : ''} />
          </button>
          <Link href="/shop/products/new" className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold text-white" style={{ background: '#7ED957' }}>
            <Plus size={15} /> Add
          </Link>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
        {[{ id: 'all', name: `All (${products.length})` }, ...categories.map(c => ({ id: c.id, name: c.name }))].map(c => (
          <button key={c.id} onClick={() => setFilter(c.id)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${filter === c.id ? 'text-white border-transparent' : 'border-gray-200 text-gray-500 bg-white'}`}
            style={filter === c.id ? { background: '#7ED957' } : {}}>
            {c.name}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-16 rounded-2xl" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
          <p className="text-4xl mb-3">📦</p>
          <p className="font-bold text-gray-700">No products yet</p>
          <Link href="/shop/products/new" className="mt-3 inline-flex items-center gap-1 text-sm font-semibold" style={{ color: '#5cb83a' }}><Plus size={14} /> Add first product</Link>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(p => (
            <div key={p.id} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3 shadow-card">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden" style={{ background: '#F4F7F2' }}>
                {p.image_url ? <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" /> : <span className="text-2xl">🛒</span>}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className={`w-3 h-3 rounded-sm border-[1.5px] flex-shrink-0 ${p.is_veg ? 'border-green-500' : 'border-red-500'}`}>
                    <span className={`block w-1.5 h-1.5 rounded-full m-0.5 ${p.is_veg ? 'bg-green-500' : 'bg-red-500'}`} />
                  </span>
                  <p className="font-bold text-sm text-gray-900 truncate">{p.name}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-black text-sm" style={{ color: '#3a7a1f' }}>{formatPrice(p.price)}</span>
                  {p.mrp && p.mrp > p.price && <span className="text-xs text-gray-300 line-through">{formatPrice(p.mrp)}</span>}
                  <span className="text-xs text-gray-400">· Stock: {p.stock}</span>
                  {p.category && <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: '#edfbdc', color: '#3a7a1f' }}>{p.category.name}</span>}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button onClick={() => toggleAvailable(p)}
                  className={`relative w-9 h-5 rounded-full transition-colors flex-shrink-0 ${p.is_available ? '' : 'bg-gray-200'}`}
                  style={p.is_available ? { background: '#7ED957' } : {}}>
                  <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${p.is_available ? 'translate-x-4' : 'translate-x-0.5'}`} />
                </button>
                <Link href={`/shop/products/${p.id}/edit`} className="p-1.5 rounded-xl hover:bg-surface-2 text-gray-400 transition-colors"><Pencil size={14} /></Link>
                <button onClick={() => setDeleteTarget(p)} className="p-1.5 rounded-xl hover:bg-red-50 text-gray-300 hover:text-red-400 transition-colors"><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Product" size="sm">
        <p className="text-sm text-gray-500 mb-4">Delete <strong>{deleteTarget?.name}</strong>? This cannot be undone.</p>
        <div className="flex gap-3">
          <Button variant="ghost" className="flex-1" onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button variant="danger" className="flex-1" isLoading={deleting} onClick={confirmDelete}>Delete</Button>
        </div>
      </Modal>
    </div>
  );
}
