'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useShopStore } from '@/store/shop';
import { toast } from '@/store/ui';
import { ProductForm, type ProductFormValues } from '@/components/shop/ProductForm';
import type { Category } from '@/types';

export default function NewProductPage() {
  const router = useRouter();
  const { shopData } = useShopStore();
  const [saving, setSaving] = useState(false);

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['shop-categories', shopData?.id],
    queryFn: async () => {
      const { data } = await supabase.from('categories').select('*').eq('shop_id', shopData!.id).order('sort_order');
      return (data ?? []) as Category[];
    },
    enabled: !!shopData?.id,
  });

  async function handleSubmit(values: ProductFormValues) {
    if (!shopData) return;
    setSaving(true);
    const { error } = await supabase.from('products').insert({
      ...values,
      shop_id: shopData.id,
      category_id: values.category_id || null,
      mrp: values.mrp || null,
    });
    if (error) {
      toast.error('Failed to create product', error.message);
    } else {
      toast.success('Product added!');
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
