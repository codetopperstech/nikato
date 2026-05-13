'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { MapPin, ArrowRight, Zap, Clock, ShieldCheck } from 'lucide-react';
import { Button, Skeleton } from '@/components/ui';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useNearbyShops } from '@/hooks/useNearbyShops';
import { useAuthStore } from '@/store/auth';
import { ShopCard } from '@/components/shop/ShopCard';

function ShopSkeleton() {
  return (
    <div className="rounded-2xl overflow-hidden bg-white shadow-sm border border-gray-100">
      <Skeleton className="h-40 w-full rounded-none" />
      <div className="p-4 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-3 w-1/3" />
      </div>
    </div>
  );
}

export default function HomePage() {
  const { isAuthenticated } = useAuthStore();
  const { coords, requestGPS, hasLocation, permissionState } = useGeolocation();
  const { data: shops, isLoading } = useNearbyShops(coords?.lat, coords?.lng);

  useEffect(() => {
    if (!hasLocation && permissionState === 'unknown') requestGPS();
  }, [hasLocation, permissionState, requestGPS]);

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      <div className="relative bg-gradient-to-br from-[#FF6B35] via-[#FF8147] to-[#FFB347] overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/3 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-1/3 -translate-x-1/4" />
        <div className="relative max-w-lg mx-auto px-6 pt-16 pb-20 text-white">
          <div className="flex items-center justify-between mb-10">
            <span className="text-2xl font-black tracking-tighter drop-shadow">NIKATO</span>
            {isAuthenticated ? (
              <Link href="/shops" className="text-sm font-semibold bg-white/20 hover:bg-white/30 backdrop-blur px-4 py-1.5 rounded-full transition-colors">Browse shops</Link>
            ) : (
              <Link href="/login" className="text-sm font-semibold bg-white/20 hover:bg-white/30 backdrop-blur px-4 py-1.5 rounded-full transition-colors">Login</Link>
            )}
          </div>
          <h1 className="text-4xl font-black leading-tight mb-3 drop-shadow-sm">
            Your neighbourhood,<br />delivered in minutes
          </h1>
          <p className="text-white/80 text-base mb-8">Fresh groceries, hot food, and essentials from shops right around you.</p>
          {!hasLocation ? (
            <Button variant="secondary" size="lg" onClick={requestGPS} leftIcon={<MapPin size={18} />} className="bg-white text-[#FF6B35] hover:bg-gray-50 w-full sm:w-auto">
              {permissionState === 'requesting' ? 'Detecting location…' : 'Find shops near me'}
            </Button>
          ) : (
            <Link href="/shops">
              <Button variant="secondary" size="lg" rightIcon={<ArrowRight size={18} />} className="bg-white text-[#FF6B35] hover:bg-gray-50">
                {shops?.length ? `${shops.length} shops nearby` : 'Browse nearby shops'}
              </Button>
            </Link>
          )}
        </div>
      </div>

      <div className="max-w-lg mx-auto px-6 -mt-5 relative z-10">
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: <Zap size={18} className="text-[#FF6B35]" />, label: 'Fast delivery' },
            { icon: <Clock size={18} className="text-[#FF6B35]" />, label: 'Live tracking' },
            { icon: <ShieldCheck size={18} className="text-[#FF6B35]" />, label: 'Safe & secure' },
          ].map((item) => (
            <div key={item.label} className="bg-white rounded-2xl p-3 flex flex-col items-center gap-1.5 shadow-sm border border-gray-100 text-center">
              {item.icon}
              <span className="text-xs font-semibold text-gray-700">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-lg mx-auto px-6 py-8">
        {hasLocation && (
          <>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-black text-gray-900">Nearby Shops</h2>
              <Link href="/shops" className="text-sm text-[#FF6B35] font-semibold flex items-center gap-1 hover:underline">
                See all <ArrowRight size={14} />
              </Link>
            </div>
            {isLoading ? (
              <div className="grid gap-4"><ShopSkeleton /><ShopSkeleton /></div>
            ) : shops && shops.length > 0 ? (
              <div className="grid gap-4">
                {shops.slice(0, 4).map((shop) => <ShopCard key={shop.id} shop={shop} />)}
              </div>
            ) : (
              <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
                <span className="text-5xl">🏪</span>
                <p className="text-gray-600 font-semibold mt-3">No shops found nearby</p>
              </div>
            )}
          </>
        )}
        {!hasLocation && permissionState === 'denied' && (
          <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-200 mt-4">
            <MapPin size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-600 font-semibold">Location access denied</p>
            <p className="text-sm text-gray-400 mt-1 mb-4">Enable location in browser settings</p>
            <Link href="/shops"><Button variant="outline" size="sm">Browse all shops</Button></Link>
          </div>
        )}
      </div>
    </div>
  );
}
