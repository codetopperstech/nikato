import { useDeliveryStore } from '@/store/delivery';
import { formatPrice } from '@/lib/utils';

export function EarningsSummary() {
  const { earnings } = useDeliveryStore();

  const items = [
    { label: 'Today', amount: earnings.today },
    { label: 'This Week', amount: earnings.week },
    { label: 'This Month', amount: earnings.month },
  ];

  return (
    <div className="grid grid-cols-3 gap-3">
      {items.map((item) => (
        <div key={item.label} className="bg-white rounded-2xl border border-gray-100 p-4 text-center">
          <p className="text-xs text-gray-500 font-medium mb-1">{item.label}</p>
          <p className="text-lg font-black text-gray-900">{formatPrice(item.amount)}</p>
        </div>
      ))}
    </div>
  );
}
