'use client';
import { useState, useEffect } from 'react';
import { MapPin, List, Map, Search, SlidersHorizontal } from 'lucide-react';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useNearbyShops } from '@/hooks/useNearbyShops';
import { ShopCard } from '@/components/shop/ShopCard';
import { Skeleton } from '@/components/ui';
import { cn } from '@/lib/utils';
import dynamic from 'next/dynamic';

const MapView = dynamic(() => import('@/components/map/MapView'), { ssr: false });
type ViewMode = 'list' | 'map';

export default function ShopsPage() {
  const { coords, requestGPS, hasLocation, permissionState } = useGeolocation();
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [radiusKm, setRadiusKm] = useState(3);

  useEffect(() => { requestGPS(); }, []);

  const { data: shops = [], isLoading } = useNearbyShops(coords?.lat, coords?.lng, radiusKm);

  const filtered = shops.filter(s =>
    !searchQuery || s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const openShops = filtered.filter(s => s.is_open);
  const closedShops = filtered.filter(s => !s.is_open);

  if (!hasLocation) return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ background: 'linear-gradient(160deg, #f0fce8 0%, #e8f6ff 100%)' }}>
      <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-6 shadow-brand" style={{ background: '#7ED957' }}>
        <MapPin size={36} className="text-white" />
      </div>
      <h2 className="text-xl font-black text-gray-900 text-center mb-2">Share your location</h2>
      <p className="text-sm text-gray-500 text-center mb-6 max-w-xs leading-relaxed">We need your location to show shops within 3 km of you.</p>
      <button onClick={requestGPS} disabled={permissionState === 'requesting'}
        className="px-8 py-3.5 rounded-xl font-bold text-white text-sm transition-all active:scale-95 disabled:opacity-60 flex items-center gap-2"
        style={{ background: '#7ED957', boxShadow: '0 4px 16px rgba(126,217,87,0.35)' }}>
        {permissionState === 'requesting' ? <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" /> : <MapPin size={16} />}
        Allow location access
      </button>
      {permissionState === 'denied' && <p className="text-xs text-red-400 mt-3 text-center">Location denied. Enable in browser settings and refresh.</p>}
    </div>
  );

  return (
    <div className="min-h-screen" style={{ background: '#F9FBF8' }}>
      {/* Sticky header */}
      <div className="sticky top-14 z-20 bg-white border-b border-gray-100 px-4 py-3 space-y-3" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
        {/* Search + View toggle */}
        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input placeholder="Search shops…" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border-[1.5px] border-gray-200 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/15 transition-all bg-surface-2" />
          </div>
          <div className="flex bg-surface-2 rounded-xl p-1 gap-1 border border-gray-100">
            <button onClick={() => setViewMode('list')} className={cn('p-2 rounded-lg transition-all', viewMode === 'list' ? 'bg-white shadow-sm text-brand-dark' : 'text-gray-400')}><List size={16} /></button>
            <button onClick={() => setViewMode('map')} className={cn('p-2 rounded-lg transition-all', viewMode === 'map' ? 'bg-white shadow-sm text-brand-dark' : 'text-gray-400')}><Map size={16} /></button>
          </div>
        </div>
        {/* Radius filter */}
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={13} className="text-gray-400 flex-shrink-0" />
          <span className="text-xs text-gray-400 mr-1">Radius:</span>
          {[1, 3, 5].map(r => (
            <button key={r} onClick={() => setRadiusKm(r)}
              className={cn('px-3 py-1.5 rounded-full text-xs font-semibold transition-all border', radiusKm === r ? 'text-white border-transparent' : 'border-gray-200 text-gray-500 hover:border-gray-300')}
              style={radiusKm === r ? { background: '#7ED957' } : {}}>
              {r} km
            </button>
          ))}
          <span className="ml-auto text-xs text-gray-400">{filtered.length} shops</span>
        </div>
      </div>

      {/* Map view */}
      {viewMode === 'map' && coords && (
        <div className="h-[45vh] px-4 py-3">
          <MapView center={coords} zoom={14} className="rounded-2xl overflow-hidden h-full" />
        </div>
      )}

      {/* Shop list */}
      <div className="max-w-lg mx-auto px-4 py-5 space-y-5">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {[1,2,3,4].map(i => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden border border-gray-100">
                <Skeleton className="h-36 rounded-none" />
                <div className="p-3 space-y-2"><Skeleton className="h-3 w-3/4" /><Skeleton className="h-3 w-1/2" /></div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
            <div className="text-5xl mb-3">🏪</div>
            <p className="font-bold text-gray-700">No shops found</p>
            <p className="text-sm text-gray-400 mt-1">{searchQuery ? `No results for "${searchQuery}"` : `No shops within ${radiusKm} km`}</p>
            {!searchQuery && <button onClick={() => setRadiusKm(5)} className="mt-3 text-sm font-semibold" style={{ color: '#5cb83a' }}>Try 5 km →</button>}
          </div>
        ) : (
          <>
            {openShops.length > 0 && (
              <section>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Open Now ({openShops.length})</h3>
                <div className="grid grid-cols-2 gap-3">{openShops.map(s => <ShopCard key={s.id} shop={s} />)}</div>
              </section>
            )}
            {closedShops.length > 0 && (
              <section>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Closed ({closedShops.length})</h3>
                <div className="grid grid-cols-2 gap-3">{closedShops.map(s => <ShopCard key={s.id} shop={s} />)}</div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}
