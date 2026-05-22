'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { MapPin, ArrowRight, Zap, Shield, Star } from 'lucide-react';
import { ShopCard } from '@/components/shop/ShopCard';
import { Skeleton } from '@/components/ui';
import type { Shop } from '@/types';

export default function HomePage() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async (lat: number, lng: number, radius = 5) => {
      const res = await fetch('/api/shops/nearby', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ lat, lng, radius_km: radius }) });
      const d = await res.json();
      setShops((d.shops ?? []).slice(0, 6));
      setLoading(false);
    };
    if (navigator?.geolocation) {
      navigator.geolocation.getCurrentPosition(
        ({ coords }) => load(coords.latitude, coords.longitude),
        () => load(0, 0, 9999),
        { timeout: 5000 }
      );
    } else { load(0, 0, 9999); }
  }, []);

  return (
    <div className="min-h-screen" style={{ background: '#F9FBF8' }}>
      {/* Hero */}
      <section className="px-4 pt-8 pb-10" style={{ background: 'linear-gradient(160deg, #f0fce8 0%, #e8f6ff 100%)' }}>
        <div className="max-w-lg mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold mb-4" style={{ background: '#7ED957', color: 'white' }}>
            <Zap size={12} /> Delivery in 30 mins
          </div>
          <h1 className="text-3xl font-black text-gray-900 leading-tight mb-3">
            Your neighbourhood,<br />
            <span style={{ color: '#5cb83a' }}>delivered fast</span>
          </h1>
          <p className="text-gray-500 text-sm mb-6 leading-relaxed">Fresh groceries, hot food, and daily essentials from shops right around you.</p>
          <Link href="/shops" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white text-sm transition-all hover:opacity-90 active:scale-95" style={{ background: '#7ED957', boxShadow: '0 4px 16px rgba(126,217,87,0.35)' }}>
            Browse shops near you <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* Features strip */}
      <section className="px-4 py-5 bg-white border-y border-gray-100">
        <div className="max-w-lg mx-auto grid grid-cols-3 gap-3">
          {[
            { icon: Zap, label: '30 min delivery', color: '#7ED957' },
            { icon: MapPin, label: 'Live tracking', color: '#7CCBFF' },
            { icon: Shield, label: 'Safe & trusted', color: '#7ED957' },
          ].map(({ icon: Icon, label, color }) => (
            <div key={label} className="flex flex-col items-center gap-1.5 py-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: color + '20' }}>
                <Icon size={18} style={{ color }} />
              </div>
              <span className="text-xs font-semibold text-gray-600 text-center leading-tight">{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Nearby shops */}
      <section className="px-4 py-6">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-black text-gray-900">Shops Near You</h2>
              <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1"><MapPin size={10} />Within 3 km</p>
            </div>
            <Link href="/shops" className="text-sm font-semibold flex items-center gap-1" style={{ color: '#5cb83a' }}>
              See all <ArrowRight size={14} />
            </Link>
          </div>
          {loading ? (
            <div className="grid grid-cols-2 gap-3">
              {[1,2,3,4].map(i => (
                <div key={i} className="bg-white rounded-2xl overflow-hidden border border-gray-100">
                  <Skeleton className="h-36 w-full rounded-none" />
                  <div className="p-3 space-y-2"><Skeleton className="h-3 w-3/4" /><Skeleton className="h-3 w-1/2" /></div>
                </div>
              ))}
            </div>
          ) : shops.length === 0 ? (
            <div className="text-center py-14 bg-white rounded-2xl border border-gray-100">
              <div className="text-5xl mb-3">🏪</div>
              <p className="text-gray-600 font-semibold">No shops nearby</p>
              <p className="text-sm text-gray-400 mt-1 mb-4">Try expanding your search area</p>
              <Link href="/shops" className="text-sm font-semibold" style={{ color: '#5cb83a' }}>Browse all shops →</Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 stagger">
              {shops.map(shop => <ShopCard key={shop.id} shop={shop} className="animate-fade-in" />)}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
