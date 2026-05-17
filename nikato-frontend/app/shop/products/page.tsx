'use client';
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { Plus, Pencil, Trash2, RefreshCw } from 'lucide-react';
import { useShopStore } from '@/store/shop';
import { toast } from '@/store/ui';
import { Button, Badge, Skeleton, EmptyState, Modal } from '@/components/ui';
import { StockBadge } from '@/components/shop/StockBadge';
import { formatPrice } from '@/lib/utils';
import type { Category, Product } from '@/types';

type ProductWithCategory = Product & { category: Category | null };

export default function ShopProductsPage() {
  const { shopData } = useShopStore();
  const qc = useQueryClient();
  const [filterCat, setFilterCat] = useState<string>('all');
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);

  const { data: products = [], isLoading, refetch, isFetching } = useQuery<ProductWithCategory[]>({
    queryKey: ['shop-products-list', shopData?.id],
    queryFn: async () => {
      const res = await fetch('/api/shop/products');
      if (!res.ok) throw new Error('Failed to load products');
      const d = await res.json();
      return d.products as ProductWithCategory[];
    },
    enabled: !!shopData?.id,
    staleTime: 30000,
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['shop-categories', shopData?.id],
    queryFn: async () => {
      const res = await fetch('/api/shop/categories');
      if (!res.ok) return [];
      const d = await res.json();
      return d.categories as Category[];
    },
    enabled: !!shopData?.id,
  });

  async function toggleAvailable(product: Product) {
    const res = await fetch('/api/shop/products', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: product.id, is_available: !product.is_available }),
    });
    if (!res.ok) toast.error('Failed to update product');
    else qc.invalidateQueries({ queryKey: ['shop-products-list', shopData?.id] });
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    const res = await fetch('/api/shop/products', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: deleteTarget.id }),
    });
    if (!res.ok) toast.error('Failed to delete product');
    else {
      qc.invalidateQueries({ queryKey: ['shop-products-list', shopData?.id] });
      toast.success('Product deleted');
    }
    setDeleteTarget(null);
    setDeleting(false);
  }

  const filtered = filterCat === 'all' ? products : products.filter((p) => p.category_id === filterCat);

  return (
    <div className="p-4 lg:p-6 max-w-3xl">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-black text-gray-900">Products</h1>
        <div className="flex gap-2">
          <button onClick={() => refetch()} disabled={isFetching} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400">
            <RefreshCw size={16} className={isFetching ? 'animate-spin' : ''} />
          </button>
          <Link href="/shop/products/new">
            <Button size="sm" leftIcon={<Plus size={16} />}>Add Product</Button>
          </Link>
        </div>
      </div>

      {/* Category filter */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
        <button onClick={() => setFilterCat('all')} className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-sm font-medium transition-colors ${filterCat === 'all' ? 'bg-[#FF6B35] text-white' : 'bg-gray-100 text-gray-600'}`}>
          All ({products.length})
        </button>
        {categories.map((c) => (
          <button key={c.id} onClick={() => setFilterCat(c.id)} className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-sm font-medium transition-colors ${filterCat === c.id ? 'bg-[#FF6B35] text-white' : 'bg-gray-100 text-gray-600'}`}>
            {c.name}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map((i) => <Skeleton key={i} className="h-16 rounded-2xl" />)}</div>
      ) : filtered.length === 0 ? (
        <EmptyState title="No products yet" description="Add your first product to start selling"
          action={<Link href="/shop/products/new"><Button>Add Product</Button></Link>} />
      ) : (
        <div className="space-y-2">
          {filtered.map((p) => (
            <div key={p.id} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="font-semibold text-gray-900 text-sm truncate">{p.name}</p>
                  <Badge variant={p.is_veg ? 'veg' : 'nonveg'}>{p.is_veg ? 'Veg' : 'Non-Veg'}</Badge>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-bold text-[#FF6B35]">{formatPrice(p.price)}</span>
                  <StockBadge stock={p.stock} isAvailable={p.is_available} />
                  {p.category && <span className="text-xs text-gray-400">{p.category.name}</span>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => toggleAvailable(p)} title="Toggle availability"
                  className={`w-9 h-5 rounded-full transition-colors flex-shrink-0 relative ${p.is_available ? 'bg-green-500' : 'bg-gray-300'}`}>
                  <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${p.is_available ? 'translate-x-4' : 'translate-x-0.5'}`} />
                </button>
                <Link href={`/shop/products/${p.id}/edit`}>
                  <button className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"><Pencil size={15} /></button>
                </Link>
                <button onClick={() => setDeleteTarget(p)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500">
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Product" size="sm">
        <p className="text-sm text-gray-600 mb-4">Delete <strong>{deleteTarget?.name}</strong>? This cannot be undone.</p>
        <div className="flex gap-3">
          <Button variant="ghost" className="flex-1" onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button variant="danger" className="flex-1" isLoading={deleting} onClick={confirmDelete}>Delete</Button>
        </div>
      </Modal>
    </div>
  );
}
