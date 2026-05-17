'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useShopStore } from '@/store/shop';
import { toast } from '@/store/ui';
import { ProductForm, type ProductFormValues } from '@/components/shop/ProductForm';
import type { Category } from '@/types';

export default function NewProductPage() {
  const router = useRouter();
  const { shopData } = useShopStore();
  const qc = useQueryClient();
  const [saving, setSaving] = useState(false);

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
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...values, category_id: values.category_id || null, mrp: values.mrp || null }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error('Failed to create product', data.error ?? '');
    } else {
      toast.success('Product added!');
      qc.invalidateQueries({ queryKey: ['shop-products-list', shopData?.id] });
      router.push('/shop/products');
    }
    setSaving(false);
  }

  return (
    <div className="p-4 lg:p-6 max-w-xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/shop/products" className="p-2 rounded-xl hover:bg-gray-100">
          <ArrowLeft size={20} className="text-gray-700" />
        </Link>
        <h1 className="text-xl font-black text-gray-900">Add Product</h1>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <ProductForm categories={categories} onSubmit={handleSubmit} isLoading={saving} />
      </div>
    </div>
  );
}
