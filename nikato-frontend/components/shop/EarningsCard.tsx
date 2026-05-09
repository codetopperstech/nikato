import { TrendingUp } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { Card } from '@/components/ui';

interface EarningsCardProps {
  label: string;
  amount: number;
  subLabel?: string;
  trend?: 'up' | 'down' | 'neutral';
}

export function EarningsCard({ label, amount, subLabel, trend = 'neutral' }: EarningsCardProps) {
  return (
    <Card className="p-5">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">{label}</p>
      <div className="flex items-end gap-2">
        <p className="text-2xl font-black text-gray-900">{formatPrice(amount)}</p>
        {trend === 'up' && <TrendingUp size={16} className="text-green-500 mb-1" />}
      </div>
      {subLabel && <p className="text-xs text-gray-500 mt-1">{subLabel}</p>}
    </Card>
  );
}
