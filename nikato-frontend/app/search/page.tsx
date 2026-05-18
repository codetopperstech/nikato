'use client';
import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Search as SearchIcon } from 'lucide-react';
import { Input, Skeleton } from '@/components/ui';
import { cn } from '@/lib/utils';

type ProductResult = { id: string; name: string; description?: string; price: number; image_url?: string; is_veg: boolean; shop_id: string; shops: { name: string } };

export default function SearchPage() {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') ?? '');
  const [results, setResults] = useState<ProductResult[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length < 2) { setResults([]); return; }
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const d = await res.json();
        setResults(d.products ?? []);
      } finally { setLoading(false); }
    }, 350);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3">
        <Link href="/shops" className="p-2 rounded-xl hover:bg-gray-100"><ArrowLeft size={20} className="text-gray-700" /></Link>
        <div className="flex-1 relative">
          <SearchIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input autoFocus value={query} onChange={e => setQuery(e.target.value)} placeholder="Search products…"
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B35]" />
        </div>
      </div>
      <div className="max-w-lg mx-auto px-4 py-4">
        {loading ? (
          <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-16 rounded-2xl" />)}</div>
        ) : results.length === 0 && query.length >= 2 ? (
          <p className="text-center text-gray-400 py-12">No products found for "{query}"</p>
        ) : results.map(p => (
          <Link key={p.id} href={`/shops/${p.shop_id}`} className="flex items-center gap-3 bg-white rounded-2xl p-3 border border-gray-100 mb-2 hover:border-[#FF6B35]/30 transition-colors">
            <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0">
              {p.image_url ? <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" /> : <span className="text-xl">🛒</span>}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className={cn('w-3 h-3 rounded-sm border-2 flex-shrink-0', p.is_veg ? 'border-green-500' : 'border-red-500')}>
                  <span className={cn('block w-1.5 h-1.5 rounded-full m-px', p.is_veg ? 'bg-green-500' : 'bg-red-500')} />
                </span>
                <p className="font-semibold text-sm text-gray-900 truncate">{p.name}</p>
              </div>
              <p className="text-xs text-gray-400">{p.shops.name}</p>
            </div>
            <p className="text-sm font-bold text-gray-900 flex-shrink-0">₹{p.price}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
