// ============================================================
// NIKATO — hooks/useShopProducts.ts
// Fetches products for a shop, grouped by category
// Blueprint Section 07
// ============================================================

'use client';

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import type { Category, Product, ProductsByCategory } from '@/types';

async function fetchShopProducts(shopId: string): Promise<ProductsByCategory[]> {
  // Fetch categories
  const { data: categories, error: catErr } = await supabase
    .from('categories')
    .select('*')
    .eq('shop_id', shopId)
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (catErr) throw catErr;

  // Fetch available products
  const { data: products, error: prodErr } = await supabase
    .from('products')
    .select('*')
    .eq('shop_id', shopId)
    .eq('is_available', true)
    .order('sort_order', { ascending: true });

  if (prodErr) throw prodErr;

  const cats = (categories ?? []) as Category[];
  const prods = (products ?? []) as Product[];

  // Group products by category
  const grouped: ProductsByCategory[] = cats.map((cat) => ({
    category: cat,
    products: prods.filter((p) => p.category_id === cat.id),
  }));

  // Uncategorised products
  const uncategorised = prods.filter((p) => !p.category_id);
  if (uncategorised.length > 0) {
    grouped.push({
      category: {
        id: '__uncategorised__',
        shop_id: shopId,
        name: 'Other Items',
        sort_order: 999,
        is_active: true,
      },
      products: uncategorised,
    });
  }

  return grouped.filter((g) => g.products.length > 0);
}

export function useShopProducts(shopId: string | null | undefined) {
  return useQuery({
    queryKey: ['shop-products', shopId],
    queryFn: () => fetchShopProducts(shopId!),
    enabled: !!shopId,
    staleTime: 30 * 1000, // 30s
    refetchOnMount: true,
  });
}
