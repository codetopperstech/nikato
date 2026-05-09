// ============================================================
// NIKATO — components/shop/ShopCard.tsx + ShopBanner.tsx
// Blueprint Section 07: Customer Portal Components
// ============================================================

'use client';

import Image from 'next/image';
import Link from 'next/link';
import { MapPin, Clock, Star, ChevronRight } from 'lucide-react';
import { Badge, Card } from '@/components/ui';
import { formatDistance, formatPrice, formatETA } from '@/lib/utils';
import { cn } from '@/lib/utils';
import type { Shop } from '@/types';

// ── ShopCard ──────────────────────────────────────────────────

interface ShopCardProps {
  shop: Shop;
  className?: string;
}

export function ShopCard({ shop, className }: ShopCardProps) {
  return (
    <Link href={`/shops/${shop.id}`} className="block group">
      <Card
        className={cn(
          'hover:shadow-md transition-all duration-200 group-hover:-translate-y-0.5',
          !shop.is_open && 'opacity-75',
          className
        )}
      >
        {/* Shop image */}
        <div className="relative h-40 bg-gray-100 overflow-hidden">
          {shop.logo_url ? (
            <Image
              src={shop.logo_url}
              alt={shop.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-gradient-to-br from-orange-50 to-amber-50">
              <span className="text-5xl">🏪</span>
            </div>
          )}
          {/* Open/closed badge */}
          <div className="absolute top-2 right-2">
            <Badge variant={shop.is_open ? 'success' : 'default'}>
              <span
                className={cn(
                  'w-1.5 h-1.5 rounded-full',
                  shop.is_open ? 'bg-green-500' : 'bg-gray-500'
                )}
              />
              {shop.is_open ? 'Open' : 'Closed'}
            </Badge>
          </div>
        </div>

        {/* Info */}
        <div className="p-4">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-bold text-gray-900 text-base leading-tight line-clamp-1">
              {shop.name}
            </h3>
            <ChevronRight
              size={16}
              className="text-gray-400 mt-0.5 flex-shrink-0 group-hover:text-[#FF6B35] transition-colors"
            />
          </div>

          {shop.description && (
            <p className="text-xs text-gray-500 mt-1 line-clamp-1">
              {shop.description}
            </p>
          )}

          <div className="flex items-center gap-3 mt-3 text-xs text-gray-500">
            {shop.distance_m != null && (
              <span className="flex items-center gap-1">
                <MapPin size={11} />
                {formatDistance(shop.distance_m)}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Clock size={11} />
              {formatETA(shop.avg_delivery_minutes)}
            </span>
            {shop.min_order_amount > 0 && (
              <span className="ml-auto text-xs">
                Min {formatPrice(shop.min_order_amount)}
              </span>
            )}
          </div>
        </div>
      </Card>
    </Link>
  );
}

// ── ShopBanner ────────────────────────────────────────────────

interface ShopBannerProps {
  shop: Shop;
}

export function ShopBanner({ shop }: ShopBannerProps) {
  return (
    <div className="relative">
      {/* Cover */}
      <div className="h-52 bg-gradient-to-br from-amber-400 to-orange-500 relative overflow-hidden">
        {shop.logo_url && (
          <Image
            src={shop.logo_url}
            alt={shop.name}
            fill
            className="object-cover opacity-20"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      </div>

      {/* Shop info overlay */}
      <div className="px-4 pb-4 -mt-16 relative z-10">
        <div className="flex items-end gap-4">
          {/* Logo */}
          <div className="w-20 h-20 rounded-2xl bg-white shadow-lg overflow-hidden flex-shrink-0 border-4 border-white">
            {shop.logo_url ? (
              <Image
                src={shop.logo_url}
                alt={shop.name}
                width={80}
                height={80}
                className="object-cover w-full h-full"
              />
            ) : (
              <div className="flex h-full items-center justify-center bg-orange-50 text-3xl">
                🏪
              </div>
            )}
          </div>

          <div className="mb-1 text-white flex-1 min-w-0">
            <h1 className="text-xl font-black leading-tight drop-shadow">{shop.name}</h1>
            {shop.description && (
              <p className="text-sm opacity-80 mt-0.5 line-clamp-1">{shop.description}</p>
            )}
          </div>
        </div>

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-2 mt-3">
          <Badge variant={shop.is_open ? 'success' : 'default'}>
            {shop.is_open ? '● Open Now' : '● Closed'}
          </Badge>
          <span className="text-xs text-gray-500 flex items-center gap-1">
            <Clock size={11} />
            {formatETA(shop.avg_delivery_minutes)} delivery
          </span>
          {shop.min_order_amount > 0 && (
            <span className="text-xs text-gray-500">
              Min order {formatPrice(shop.min_order_amount)}
            </span>
          )}
          {shop.distance_m != null && (
            <span className="text-xs text-gray-500 flex items-center gap-1">
              <MapPin size={11} />
              {formatDistance(shop.distance_m)} away
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
