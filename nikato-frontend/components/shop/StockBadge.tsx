interface StockBadgeProps { stock: number; isAvailable: boolean; }

export function StockBadge({ stock, isAvailable }: StockBadgeProps) {
  if (!isAvailable || stock === 0)
    return <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-500">Out of stock</span>;
  if (stock < 5)
    return <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-600">Low ({stock})</span>;
  return <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: '#edfbdc', color: '#3a7a1f' }}>In stock ({stock})</span>;
}
