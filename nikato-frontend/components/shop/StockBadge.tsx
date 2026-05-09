import { Badge } from '@/components/ui';

interface StockBadgeProps {
  stock: number;
  isAvailable: boolean;
}

export function StockBadge({ stock, isAvailable }: StockBadgeProps) {
  if (!isAvailable || stock === 0) {
    return <Badge variant="danger">Out of Stock</Badge>;
  }
  if (stock < 5) {
    return <Badge variant="warning">Low Stock ({stock})</Badge>;
  }
  return <Badge variant="success">In Stock ({stock})</Badge>;
}
