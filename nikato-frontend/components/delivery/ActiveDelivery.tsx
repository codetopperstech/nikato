'use client';

import Link from 'next/link';
import { MapPin, ChevronRight } from 'lucide-react';
import { useDeliveryStore } from '@/store/delivery';
import { Badge } from '@/components/ui';
import { formatPrice, getOrderStatusLabel } from '@/lib/utils';

export function ActiveDelivery() {
  const { currentDelivery } = useDeliveryStore();

  if (!currentDelivery) return null;

  const shop = (currentDelivery as { shop?: { name: string; address_line: string } }).shop;
  const address = (currentDelivery as { address?: { address_line: string; city: string } }).address;

  return (
    <Link
      href={`/delivery/orders/${currentDelivery.id}`}
      className="block bg-[#FF6B35] rounded-2xl p-4 text-white"
    >
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-xs font-bold text-white/80 uppercase tracking-wider">Active Delivery</p>
          <p className="text-lg font-black">#{currentDelivery.order_number}</p>
        </div>
        <Badge variant="warning">{getOrderStatusLabel(currentDelivery.status)}</Badge>
      </div>

      <div className="space-y-2">
        {shop && (
          <div className="flex items-start gap-2">
            <MapPin size={14} className="text-white/70 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs text-white/70">Pick up from</p>
              <p className="text-sm font-semibold">{shop.name}</p>
            </div>
          </div>
        )}
        {address && (
          <div className="flex items-start gap-2">
            <MapPin size={14} className="text-white/70 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs text-white/70">Deliver to</p>
              <p className="text-sm font-semibold">{address.address_line}, {address.city}</p>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/20">
        <p className="text-sm font-bold">{formatPrice(currentDelivery.delivery_earning)}</p>
        <span className="flex items-center gap-1 text-xs font-bold">
          View Details <ChevronRight size={14} />
        </span>
      </div>
    </Link>
  );
}
