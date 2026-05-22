import { TrendingUp, TrendingDown } from 'lucide-react';
import { formatPrice } from '@/lib/utils';

interface EarningsCardProps {
  label: string;
  amount: number;
  subLabel?: string;
  trend?: 'up' | 'down' | 'neutral';
}

export function EarningsCard({ label, amount, subLabel, trend = 'neutral' }: EarningsCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-card">
      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">{label}</p>
      <div className="flex items-end gap-1.5">
        <p className="text-xl font-black text-gray-900">{formatPrice(amount)}</p>
        {trend === 'up' && <TrendingUp size={14} className="mb-0.5 flex-shrink-0" style={{ color: '#5cb83a' }} />}
        {trend === 'down' && <TrendingDown size={14} className="mb-0.5 text-red-400 flex-shrink-0" />}
      </div>
      {subLabel && <p className="text-xs text-gray-400 mt-1">{subLabel}</p>}
    </div>
  );
}
