'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Search as SearchIcon } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { Input, Skeleton } from '@/components/ui';
import { ProductCard } from '@/components/product/ProductCard';
import { cn } from '@/lib/utils';
import type { Product } from '@/types';

interface ProductWithShop extends Product {
  shop_name: string;
  shop_id: string;
}

async function searchProducts(query: string): Promise<ProductWithShop[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*, shops!inner(id, name, is_approved, is_open)')
    .eq('is_available', true)
    .eq('shops.is_approved', true)
    .ilike('name', `%${query}%`)
    .limit(30);

  if (error) throw error;
  return (data ?? []).map((p: Record<string, unknown>) => ({
    ...(p as unknown as Product),
    shop_id: (p.shops as { id: string }).id,
    shop_name: (p.shops as { name: string }).name,
  }));
}

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ProductWithShop[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    const timeout = setTimeout(async () => {
      setIsSearching(true);
      try {
        const data = await searchProducts(query.trim());
        setResults(data);
      } catch { setResults([]); }
      finally { setIsSearching(false); }
    }, 400);
    return () => clearTimeout(timeout);
  }, [query]);

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3">
        <Link href="/" className="p-2 rounded-xl hover:bg-gray-100 flex-shrink-0">
          <ArrowLeft size={20} className="text-gray-700" />
        </Link>
        <div className="flex-1">
          <Input
            placeholder="Search products across all shops…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            leftAddon={<SearchIcon size={16} />}
            autoFocus
            className="py-2"
          />
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-3">
        {!query.trim() && (
          <div className="text-center py-16">
            <SearchIcon size={48} className="mx-auto text-gray-200 mb-3" />
            <p className="text-gray-600 font-semibold">Search for products</p>
            <p className="text-sm text-gray-400 mt-1">Find items across all nearby shops</p>
          </div>
        )}

        {isSearching && (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-3 flex gap-3 border border-gray-100">
              <Skeleton className="w-24 h-24 rounded-xl flex-shrink-0" />
              <div className="flex-1 space-y-2 py-1">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-4 w-1/3" />
              </div>
            </div>
          ))
        )}

        {!isSearching && query.trim() && results.length === 0 && (
          <div className="text-center py-16">
            <span className="text-5xl">🔍</span>
            <p className="text-gray-600 font-semibold mt-3">No results for "{query}"</p>
            <p className="text-sm text-gray-400 mt-1">Try a different search term</p>
          </div>
        )}

        {!isSearching && results.length > 0 && (
          <>
            <p className="text-xs text-gray-400 font-medium">{results.length} result{results.length !== 1 ? 's' : ''} for "{query}"</p>
            {results.map((product) => (
              <div key={product.id}>
                <Link href={`/shops/${product.shop_id}`} className="text-xs text-[#FF6B35] font-semibold mb-1.5 block hover:underline">
                  From: {product.shop_name}
                </Link>
                <ProductCard product={product} shopId={product.shop_id} shopName={product.shop_name} />
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
