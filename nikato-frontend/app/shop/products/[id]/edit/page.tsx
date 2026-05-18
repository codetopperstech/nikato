'use client';
import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useShopStore } from '@/store/shop';
import { toast } from '@/store/ui';
import { ProductForm, type ProductFormValues } from '@/components/shop/ProductForm';
import { Skeleton } from '@/components/ui';
import type { Category, Product } from '@/types';

export default function EditProductPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { shopData } = useShopStore();
  const qc = useQueryClient();
  const [saving, setSaving] = useState(false);

  const { data: product, isLoading: productLoading } = useQuery<Product>({
    queryKey: ['product', id],
    queryFn: async () => {
      const res = await fetch('/api/shop/products');
      if (!res.ok) throw new Error('Failed to load');
      const d = await res.json();
      const found = (d.products as Product[]).find((p) => p.id === id);
      if (!found) throw new Error('Product not found');
      return found;
    },
    enabled: !!shopData?.id && !!id,
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

  async function handleSubmit(values: ProductFormValues) {
    setSaving(true);
    const res = await fetch('/api/shop/products', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...values, category_id: values.category_id || null, mrp: values.mrp || null }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error('Failed to save changes', data.error ?? '');
    } else {
      qc.invalidateQueries({ queryKey: ['shop-products-list', shopData?.id] });
      toast.success('Product updated!');
      router.push('/shop/products');
    }
    setSaving(false);
  }

  return (
    <div className="p-4 lg:p-6 max-w-xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/shop/products" className="p-2 rounded-xl hover:bg-gray-100"><ArrowLeft size={20} className="text-gray-700" /></Link>
        <h1 className="text-xl font-black text-gray-900">Edit Product</h1>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        {productLoading ? (
          <div className="space-y-4">{[1,2,3,4].map((i) => <Skeleton key={i} className="h-12 rounded-xl" />)}</div>
        ) : product ? (
          <ProductForm defaultValues={product} categories={categories} onSubmit={handleSubmit} isLoading={saving} />
        ) : (
          <p className="text-sm text-gray-500">Product not found</p>
        )}
      </div>
    </div>
  );
}
