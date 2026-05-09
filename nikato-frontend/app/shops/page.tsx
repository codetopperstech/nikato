'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { MapPin, List, Map, Search, SlidersHorizontal } from 'lucide-react';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useNearbyShops } from '@/hooks/useNearbyShops';
import { ShopCard } from '@/components/shop/ShopCard';
import { Button, Input, Skeleton, EmptyState } from '@/components/ui';
import { cn } from '@/lib/utils';

const MapView = dynamic(() => import('@/components/map/MapView'), { ssr: false });

type ViewMode = 'list' | 'map';

export default function ShopsPage() {
  const { coords, requestGPS, hasLocation, permissionState } = useGeolocation();
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [radiusKm, setRadiusKm] = useState(5);

  const { data: shops = [], isLoading } = useNearbyShops(coords?.lat, coords?.lng, radiusKm);

  useEffect(() => {
    if (!hasLocation && permissionState === 'unknown') requestGPS();
  }, [hasLocation, permissionState, requestGPS]);

  const filtered = shops.filter((s) =>
    searchQuery
      ? s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.description?.toLowerCase().includes(searchQuery.toLowerCase())
      : true
  );

  const openShops = filtered.filter((s) => s.is_open);
  const closedShops = filtered.filter((s) => !s.is_open);

  if (!hasLocation) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FAFAF8] px-6">
        <div className="w-20 h-20 bg-orange-50 rounded-2xl flex items-center justify-center mb-6">
          <MapPin size={36} className="text-[#FF6B35]" />
        </div>
        <h2 className="text-xl font-black text-gray-900 text-center mb-2">Share your location</h2>
        <p className="text-sm text-gray-500 text-center mb-6 max-w-xs">We need your location to show shops near you.</p>
        <Button variant="primary" size="lg" onClick={requestGPS} isLoading={permissionState === 'requesting'}>
          Allow location access
        </Button>
        {permissionState === 'denied' && (
          <p className="text-xs text-red-500 mt-3 text-center">Location denied. Please enable it in browser settings and refresh.</p>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      <div className="sticky top-0 z-20 bg-white border-b border-gray-100 px-4 py-3 space-y-3">
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <Input
              placeholder="Search shops or items…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftAddon={<Search size={16} />}
              className="py-2"
            />
          </div>
          <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
            <button onClick={() => setViewMode('list')} className={cn('p-2 rounded-lg transition-all', viewMode === 'list' ? 'bg-white shadow-sm text-[#FF6B35]' : 'text-gray-500')}>
              <List size={16} />
            </button>
            <button onClick={() => setViewMode('map')} className={cn('p-2 rounded-lg transition-all', viewMode === 'map' ? 'bg-white shadow-sm text-[#FF6B35]' : 'text-gray-500')}>
              <Map size={16} />
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <SlidersHorizontal size={12} />
          <span>Radius:</span>
          {[2, 5, 10].map((r) => (
            <button key={r} onClick={() => setRadiusKm(r)}
              className={cn('px-2.5 py-1 rounded-full border text-xs font-medium transition-all', radiusKm === r ? 'bg-[#FF6B35] border-[#FF6B35] text-white' : 'border-gray-200 text-gray-600 hover:border-gray-400')}>
              {r} km
            </button>
          ))}
          <span className="ml-auto text-gray-400">{filtered.length} shops</span>
        </div>
      </div>

      {viewMode === 'map' && coords && (
        <div className="h-[50vh] px-4 py-3">
          <MapView center={coords} zoom={14} className="rounded-2xl overflow-hidden h-full" />
        </div>
      )}

      <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-2xl overflow-hidden bg-white shadow-sm border border-gray-100">
              <Skeleton className="h-40 w-full rounded-none" />
              <div className="p-4 space-y-2"><Skeleton className="h-4 w-3/4" /><Skeleton className="h-3 w-1/2" /></div>
            </div>
          ))
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<span className="text-5xl">🏪</span>}
            title="No shops found"
            description={searchQuery ? `No results for "${searchQuery}"` : 'Try increasing your radius'}
            action={searchQuery ? <Button variant="ghost" size="sm" onClick={() => setSearchQuery('')}>Clear search</Button> : undefined}
          />
        ) : (
          <>
            {openShops.length > 0 && (
              <section>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Open Now ({openShops.length})</h3>
                <div className="space-y-3">{openShops.map((s) => <ShopCard key={s.id} shop={s} />)}</div>
              </section>
            )}
            {closedShops.length > 0 && (
              <section>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 mt-4">Closed ({closedShops.length})</h3>
                <div className="space-y-3">{closedShops.map((s) => <ShopCard key={s.id} shop={s} />)}</div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}
