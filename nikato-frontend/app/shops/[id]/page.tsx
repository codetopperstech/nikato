'use client';

import { useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, ShoppingBag } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useShopProducts } from '@/hooks/useShopProducts';
import { useCartStore } from '@/store/cart';
import { useUIStore } from '@/store/ui';
import { ShopBanner } from '@/components/shop/ShopCard';
import { ProductGrid } from '@/components/product/ProductCard';
import { Spinner, EmptyState, Skeleton } from '@/components/ui';
import { cn } from '@/lib/utils';
import type { Shop } from '@/types';

async function fetchShop(id: string): Promise<Shop> {
  const { data, error } = await supabase.from('shops').select('*').eq('id', id).single();
  if (error) throw error;
  return data as Shop;
}

export default function ShopDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { itemCount } = useCartStore();
  const { setCartOpen } = useUIStore();
  const [activeCat, setActiveCat] = useState<string | null>(null);
  const categoryRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const { data: shop, isLoading: shopLoading } = useQuery({
    queryKey: ['shop', id],
    queryFn: () => fetchShop(id),
    enabled: !!id,
  });

  const { data: grouped = [], isLoading: productsLoading } = useShopProducts(id);

  const count = itemCount();

  const scrollToCategory = (catId: string) => {
    setActiveCat(catId);
    categoryRefs.current[catId]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  if (shopLoading) {
    return (
      <div className="min-h-screen bg-[#FAFAF8]">
        <Skeleton className="h-52 w-full rounded-none" />
        <div className="p-6 space-y-3">
          <Skeleton className="h-6 w-1/2" /><Skeleton className="h-4 w-3/4" /><Skeleton className="h-4 w-1/3" />
        </div>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <EmptyState title="Shop not found" description="This shop may no longer be available." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAF8] pb-24">
      <div className="absolute top-4 left-4 z-20">
        <button onClick={() => router.back()} className="w-9 h-9 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow-md">
          <ArrowLeft size={18} className="text-gray-700" />
        </button>
      </div>

      <ShopBanner shop={shop} />

      {grouped.length > 1 && (
        <div className="sticky top-0 z-10 bg-white border-b border-gray-100">
          <div className="flex gap-1 px-4 py-2 overflow-x-auto">
            {grouped.map((g) => (
              <button key={g.category.id} onClick={() => scrollToCategory(g.category.id)}
                className={cn('flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap',
                  activeCat === g.category.id ? 'bg-[#FF6B35] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')}>
                {g.category.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="max-w-lg mx-auto px-4 py-4 space-y-8">
        {productsLoading ? (
          <div className="flex justify-center py-12"><Spinner size="lg" className="text-[#FF6B35]" /></div>
        ) : grouped.length === 0 ? (
          <EmptyState icon={<span className="text-4xl">📦</span>} title="No products available" description="This shop hasn't added any products yet." />
        ) : (
          grouped.map((g) => (
            <div key={g.category.id} ref={(el) => { categoryRefs.current[g.category.id] = el; }}>
              <h3 className="text-base font-black text-gray-900 mb-3 flex items-center gap-2">
                <span className="w-1 h-5 bg-[#FF6B35] rounded-full inline-block" />
                {g.category.name}
                <span className="text-xs font-normal text-gray-400">({g.products.length})</span>
              </h3>
              <ProductGrid products={g.products} shopId={shop.id} shopName={shop.name} />
            </div>
          ))
        )}
      </div>

      {count > 0 && (
        <div className="fixed bottom-6 left-0 right-0 flex justify-center px-6 z-30">
          <button onClick={() => setCartOpen(true)}
            className="flex items-center gap-3 bg-[#1A1A2E] text-white px-6 py-3.5 rounded-2xl shadow-2xl active:scale-95 transition-transform">
            <div className="relative">
              <ShoppingBag size={20} />
              <span className="absolute -top-2 -right-2 w-4 h-4 bg-[#FF6B35] rounded-full text-[10px] font-bold flex items-center justify-center">{count}</span>
            </div>
            <span className="font-semibold text-sm">View cart</span>
          </button>
        </div>
      )}
    </div>
  );
}
