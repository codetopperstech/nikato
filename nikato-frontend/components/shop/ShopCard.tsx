'use client';
import Image from 'next/image';
import Link from 'next/link';
import { MapPin, Clock, Zap } from 'lucide-react';
import { formatDistance, formatPrice, formatETA } from '@/lib/utils';
import { cn } from '@/lib/utils';
import type { Shop } from '@/types';

interface ShopCardProps { shop: Shop; className?: string; }

export function ShopCard({ shop, className }: ShopCardProps) {
  return (
    <Link href={`/shops/${shop.id}`} className="block group">
      <div className={cn(
        'bg-white rounded-2xl border border-gray-100 overflow-hidden transition-all duration-200 group-hover:-translate-y-1',
        'shadow-card group-hover:shadow-card-hover',
        !shop.is_open && 'opacity-70',
        className
      )}>
        {/* Image */}
        <div className="relative h-36 bg-surface-2 overflow-hidden">
          {shop.logo_url ? (
            <Image src={shop.logo_url} alt={shop.name} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
          ) : (
            <div className="flex h-full items-center justify-center">
              <span className="text-5xl">🏪</span>
            </div>
          )}
          {/* Status pill */}
          <div className="absolute top-2.5 left-2.5">
            <span className={cn(
              'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold backdrop-blur-sm',
              shop.is_open ? 'bg-brand/90 text-white' : 'bg-gray-800/70 text-white'
            )}>
              <span className={cn('w-1.5 h-1.5 rounded-full', shop.is_open ? 'bg-white' : 'bg-gray-400')} />
              {shop.is_open ? 'Open' : 'Closed'}
            </span>
          </div>
          {/* ETA pill */}
          {shop.is_open && (
            <div className="absolute top-2.5 right-2.5">
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-white/90 text-gray-700 backdrop-blur-sm">
                <Zap size={10} className="text-brand-dark" />
                {formatETA(shop.avg_delivery_minutes)}
              </span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-3.5">
          <h3 className="font-bold text-gray-900 text-sm leading-tight truncate">{shop.name}</h3>
          {shop.description && <p className="text-xs text-gray-400 mt-0.5 truncate">{shop.description}</p>}
          <div className="flex items-center gap-2.5 mt-2.5 text-xs text-gray-400">
            {shop.distance_m != null && (
              <span className="flex items-center gap-1"><MapPin size={10} className="text-brand-dark" />{formatDistance(shop.distance_m)}</span>
            )}
            <span className="flex items-center gap-1"><Clock size={10} />{formatETA(shop.avg_delivery_minutes)}</span>
            {shop.min_order_amount > 0 && (
              <span className="ml-auto text-[11px] bg-surface-2 px-2 py-0.5 rounded-full">Min {formatPrice(shop.min_order_amount)}</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

// ShopBanner - keep structure, upgrade visuals
interface ShopBannerProps { shop: Shop; }
export function ShopBanner({ shop }: ShopBannerProps) {
  return (
    <div className="relative">
      <div className="h-44 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #7ED957 0%, #5cb83a 100%)' }}>
        {shop.logo_url && <Image src={shop.logo_url} alt={shop.name} fill className="object-cover opacity-15" />}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
      </div>
      <div className="px-4 pb-4 -mt-14 relative z-10">
        <div className="flex items-end gap-3">
          <div className="w-18 h-18 rounded-2xl bg-white shadow-lg overflow-hidden flex-shrink-0 border-2 border-white" style={{ width: 72, height: 72 }}>
            {shop.logo_url
              ? <Image src={shop.logo_url} alt={shop.name} width={72} height={72} className="object-cover w-full h-full" />
              : <div className="flex h-full items-center justify-center bg-surface-2 text-3xl">🏪</div>}
          </div>
          <div className="mb-1 text-white flex-1 min-w-0">
            <h1 className="text-lg font-black leading-tight drop-shadow-sm">{shop.name}</h1>
            {shop.description && <p className="text-sm opacity-80 mt-0.5 line-clamp-1">{shop.description}</p>}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 mt-3">
          <span className={cn('inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold', shop.is_open ? 'bg-brand text-white' : 'bg-gray-200 text-gray-600')}>
            <span className={cn('w-1.5 h-1.5 rounded-full', shop.is_open ? 'bg-white' : 'bg-gray-500')} />
            {shop.is_open ? 'Open Now' : 'Closed'}
          </span>
          <span className="text-xs text-gray-500 flex items-center gap-1 bg-white px-2.5 py-1 rounded-full shadow-sm">
            <Clock size={10} />{formatETA(shop.avg_delivery_minutes)} delivery
          </span>
          {shop.distance_m != null && (
            <span className="text-xs text-gray-500 flex items-center gap-1 bg-white px-2.5 py-1 rounded-full shadow-sm">
              <MapPin size={10} />{formatDistance(shop.distance_m)}
            </span>
          )}
          {shop.min_order_amount > 0 && (
            <span className="text-xs text-gray-500 bg-white px-2.5 py-1 rounded-full shadow-sm">Min {formatPrice(shop.min_order_amount)}</span>
          )}
        </div>
      </div>
    </div>
  );
}
