'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { MapPin } from 'lucide-react';
import { ShopCard } from '@/components/shop/ShopCard';
import { Skeleton } from '@/components/ui';
import type { Shop } from '@/types';

export default function HomePage() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Try GPS first, fallback to all approved shops
    if (navigator?.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async ({ coords }) => {
          const res = await fetch('/api/shops/nearby', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ lat: coords.latitude, lng: coords.longitude, radius_km: 5 }),
          });
          const d = await res.json();
          setShops((d.shops ?? []).slice(0, 6));
          setLoading(false);
        },
        async () => {
          // GPS denied — show all approved open shops
          const res = await fetch('/api/shops/nearby', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ lat: 0, lng: 0, radius_km: 9999 }),
          });
          const d = await res.json();
          setShops((d.shops ?? []).slice(0, 6));
          setLoading(false);
        },
        { timeout: 5000 }
      );
    } else {
      setLoading(false);
    }
  }, []);

  return (
    <div>
      {/* Hero */}
      <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white px-6 py-16">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-4xl font-black leading-tight mb-4">Your neighbourhood,<br />delivered in minutes</h1>
          <p className="text-orange-100 mb-8 text-lg">Fresh groceries, hot food, and essentials from shops right around you.</p>
          <Link href="/shops" className="inline-block bg-white text-orange-500 px-8 py-3 rounded-full font-bold text-lg hover:bg-orange-50 transition shadow-lg">
            Browse nearby shops →
          </Link>
        </div>
      </div>

      {/* Features */}
      <div className="bg-white px-6 py-8">
        <div className="max-w-3xl mx-auto grid grid-cols-3 gap-4 text-center">
          {[{ icon: '⚡', title: 'Fast delivery', desc: 'In 30 mins' }, { icon: '📍', title: 'Live tracking', desc: 'Real-time' }, { icon: '🔒', title: 'Safe & secure', desc: 'Trusted shops' }].map(f => (
            <div key={f.title} className="p-4 rounded-2xl bg-orange-50">
              <div className="text-3xl mb-2">{f.icon}</div>
              <div className="font-semibold text-sm">{f.title}</div>
              <div className="text-xs text-gray-400">{f.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Nearby Shops */}
      <div className="px-6 py-8 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <MapPin size={16} className="text-[#FF6B35]" />
              <h2 className="text-xl font-bold">Shops Near You</h2>
            </div>
            <Link href="/shops" className="text-orange-500 text-sm font-semibold">See all →</Link>
          </div>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1,2,3].map(i => <Skeleton key={i} className="h-32 rounded-2xl" />)}
            </div>
          ) : shops.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <div className="text-4xl mb-3">🏪</div>
              <p>No shops available right now</p>
              <Link href="/shops" className="text-orange-500 text-sm mt-2 inline-block">Browse all shops</Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {shops.map(shop => <ShopCard key={shop.id} shop={shop} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
