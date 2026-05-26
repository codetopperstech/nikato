'use client';
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { Plus, Pencil, Trash2, RefreshCw, Package } from 'lucide-react';
import { useShopStore } from '@/store/shop';
import { toast } from '@/store/ui';
import { Modal, Skeleton } from '@/components/ui';
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
    queryFn: async () => {
      const res = await fetch('/api/shop/products');
      if (!res.ok) throw new Error('Failed');
      return (await res.json()).products as PW[];
    },
    enabled: !!shopData?.id,
    staleTime: 30000,
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['shop-categories', shopData?.id],
    queryFn: async () => {
      const res = await fetch('/api/shop/categories');
      if (!res.ok) return [];
      return (await res.json()).categories as Category[];
    },
    enabled: !!shopData?.id,
  });

  async function toggleAvailable(p: Product) {
    await fetch('/api/shop/products', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: p.id, is_available: !p.is_available }),
    });
    qc.invalidateQueries({ queryKey: ['shop-products-list', shopData?.id] });
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    const res = await fetch('/api/shop/products', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: deleteTarget.id }),
    });
    if (res.ok) { qc.invalidateQueries({ queryKey: ['shop-products-list', shopData?.id] }); toast.success('Product deleted'); }
    else toast.error('Failed to delete');
    setDeleteTarget(null); setDeleting(false);
  }

  const filtered = filter === 'all' ? products : products.filter(p => p.category_id === filter);

  // Loading state — shopData not yet loaded
  if (!shopData) return (
    <div className="p-4 lg:p-6 max-w-3xl space-y-4">
      <Skeleton className="h-8 w-40 rounded-xl" />
      <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-20 rounded-2xl" />)}</div>
    </div>
  );

  return (
    <div className="p-4 lg:p-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Products</h1>
          <p className="text-xs text-gray-400 mt-0.5">{products.length} total</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => refetch()} disabled={isFetching}
            className="p-2.5 rounded-xl border border-gray-200 bg-white text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-40">
            <RefreshCw size={15} className={isFetching ? 'animate-spin' : ''} />
          </button>
          <Link href="/shop/products/new"
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-all active:scale-95"
            style={{ background: '#7ED957', boxShadow: '0 4px 12px rgba(126,217,87,0.3)' }}>
            <Plus size={16} /> Add Product
          </Link>
        </div>
      </div>

      {/* Category filter tabs */}
      {categories.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-none">
          {[{ id: 'all', name: `All (${products.length})` }, ...categories.map(c => ({ id: c.id, name: c.name }))].map(c => (
            <button key={c.id} onClick={() => setFilter(c.id)}
              className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all ${filter === c.id ? 'text-white border-transparent' : 'border-gray-200 text-gray-500 bg-white hover:border-gray-300'}`}
              style={filter === c.id ? { background: '#7ED957' } : {}}>
              {c.name}
            </button>
          ))}
        </div>
      )}

      {/* Products list */}
      {isLoading ? (
        <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-20 rounded-2xl" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ background: '#edfbdc' }}>
            <Package size={26} style={{ color: '#5cb83a' }} />
          </div>
          <p className="font-bold text-gray-700">No products yet</p>
          <p className="text-sm text-gray-400 mt-1 mb-4">Add your first product to start selling</p>
          <Link href="/shop/products/new"
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-bold text-white"
            style={{ background: '#7ED957' }}>
            <Plus size={14} /> Add Product
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(p => (
            <div key={p.id} className="bg-white rounded-2xl border border-gray-100 p-3.5 flex items-center gap-3 shadow-card">
              {/* Image */}
              <div className="w-14 h-14 rounded-xl flex-shrink-0 overflow-hidden" style={{ background: '#F4F7F2' }}>
                {p.image_url
                  ? <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center text-2xl">🛒</div>}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className={`w-3 h-3 rounded-sm border-[1.5px] flex-shrink-0 ${p.is_veg ? 'border-green-500' : 'border-red-500'}`}>
                    <span className={`block w-1.5 h-1.5 rounded-full m-0.5 ${p.is_veg ? 'bg-green-500' : 'bg-red-500'}`} />
                  </span>
                  <p className="font-bold text-sm text-gray-900 truncate">{p.name}</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-black text-sm" style={{ color: '#3a7a1f' }}>₹{p.price}</span>
                  {p.mrp && p.mrp > p.price && (
                    <span className="text-xs text-gray-300 line-through">₹{p.mrp}</span>
                  )}
                  <span className="text-xs text-gray-400">· {p.stock} in stock</span>
                  {p.category && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: '#edfbdc', color: '#3a7a1f' }}>
                      {p.category.name}
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {/* Available toggle */}
                <button onClick={() => toggleAvailable(p)} title={p.is_available ? 'Mark unavailable' : 'Mark available'}
                  className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0`}
                  style={{ background: p.is_available ? '#7ED957' : '#e5e7eb' }}>
                  <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${p.is_available ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
                {/* Edit */}
                <Link href={`/shop/products/${p.id}/edit`}
                  className="p-2 rounded-xl hover:bg-surface-2 text-gray-400 hover:text-gray-600 transition-colors">
                  <Pencil size={15} />
                </Link>
                {/* Delete */}
                <button onClick={() => setDeleteTarget(p)}
                  className="p-2 rounded-xl hover:bg-red-50 text-gray-300 hover:text-red-400 transition-colors">
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete confirm modal */}
      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Product" size="sm">
        <p className="text-sm text-gray-500 mb-5">
          Delete <strong className="text-gray-900">{deleteTarget?.name}</strong>? This cannot be undone.
        </p>
        <div className="flex gap-3">
          <button onClick={() => setDeleteTarget(null)}
            className="flex-1 py-3 rounded-xl border-[1.5px] border-gray-200 text-sm font-semibold text-gray-600 hover:bg-surface-2 transition-colors">
            Cancel
          </button>
          <button onClick={confirmDelete} disabled={deleting}
            className="flex-1 py-3 rounded-xl text-sm font-bold text-white bg-red-500 hover:bg-red-600 disabled:opacity-50 flex items-center justify-center transition-colors">
            {deleting ? <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" /> : 'Delete'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
