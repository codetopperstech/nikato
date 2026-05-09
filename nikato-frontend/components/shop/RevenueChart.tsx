'use client';

import { formatPrice } from '@/lib/utils';

interface DayRevenue {
  date: string;
  revenue: number;
}

interface RevenueChartProps {
  data: DayRevenue[];
  height?: number;
}

export function RevenueChart({ data, height = 140 }: RevenueChartProps) {
  const max = Math.max(...data.map((d) => d.revenue), 1);

  return (
    <div className="w-full">
      <div className="flex items-end gap-1.5" style={{ height }}>
        {data.map((d, i) => {
          const pct = (d.revenue / max) * 100;
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
              {/* Tooltip */}
              <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-[10px] rounded px-1.5 py-0.5 whitespace-nowrap pointer-events-none">
                {formatPrice(d.revenue)}
              </div>
              {/* Bar */}
              <div
                className="w-full rounded-t-md bg-[#FF6B35] transition-all"
                style={{ height: `${Math.max(pct, 2)}%` }}
              />
            </div>
          );
        })}
      </div>
      {/* X-axis labels */}
      <div className="flex gap-1.5 mt-1">
        {data.map((d, i) => (
          <div key={i} className="flex-1 text-center text-[9px] text-gray-400 truncate">
            {new Date(d.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
          </div>
        ))}
      </div>
    </div>
  );
}
