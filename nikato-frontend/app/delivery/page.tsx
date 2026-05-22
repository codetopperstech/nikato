'use client';
import { useDeliveryStore } from '@/store/delivery';
import { OnlineToggle } from '@/components/delivery/OnlineToggle';
import { ActiveDelivery } from '@/components/delivery/ActiveDelivery';
import { EarningsSummary } from '@/components/delivery/EarningsSummary';
import { formatPrice } from '@/lib/utils';

export default function DeliveryDashboard() {
  const { isOnline, currentDelivery, earnings } = useDeliveryStore();

  return (
    <div className="p-4 max-w-lg mx-auto space-y-5 pb-24">
      <div className="pt-2">
        <h1 className="text-2xl font-black text-gray-900">Deliveries</h1>
        <p className="text-sm text-gray-400 mt-0.5">{isOnline ? '🟢 Looking for orders…' : '💤 You\'re offline'}</p>
      </div>

      <OnlineToggle />

      {currentDelivery ? (
        <ActiveDelivery />
      ) : isOnline ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center shadow-card">
          <div className="text-4xl mb-3 animate-pulse">🛵</div>
          <p className="font-bold text-gray-700">Looking for orders…</p>
          <p className="text-sm text-gray-400 mt-1">Stay online to receive delivery requests</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center shadow-card">
          <div className="text-4xl mb-3">💤</div>
          <p className="font-bold text-gray-700">You're offline</p>
          <p className="text-sm text-gray-400 mt-1">Go online to start earning</p>
        </div>
      )}

      {/* Earnings strip */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Today', amount: earnings.today },
          { label: 'This Week', amount: earnings.week },
          { label: 'This Month', amount: earnings.month },
        ].map(e => (
          <div key={e.label} className="bg-white rounded-2xl border border-gray-100 p-3.5 text-center shadow-card">
            <p className="text-base font-black text-gray-900">{formatPrice(e.amount)}</p>
            <p className="text-[10px] text-gray-400 mt-0.5 font-medium">{e.label}</p>
          </div>
        ))}
      </div>

      <EarningsSummary />
    </div>
  );
}
