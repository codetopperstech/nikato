// ============================================================
// NIKATO — components/product/ProductCard.tsx
// Blueprint Section 07: Customer Portal Components
// ============================================================

'use client';

import Image from 'next/image';
import { Plus, Minus } from 'lucide-react';
import { Badge, Card } from '@/components/ui';
import { useCartStore, CrossShopCartError } from '@/store/cart';
import { useUIStore, toast } from '@/store/ui';
import { formatPrice, discountPercent, cn } from '@/lib/utils';
import type { Product } from '@/types';

// ── AddToCartButton ───────────────────────────────────────────

interface AddToCartButtonProps {
  product: Product;
  shopId: string;
  shopName: string;
}

export function AddToCartButton({ product, shopId, shopName }: AddToCartButtonProps) {
  const { addItem, removeItem, updateQty, getItemQty, shopId: cartShopId } = useCartStore();
  const { setCrossShopModal } = useUIStore();
  const qty = getItemQty(product.id);

  const handleAdd = () => {
    try {
      addItem(product, shopId, shopName);
      toast.success('Added to cart', product.name);
    } catch (err) {
      if (err instanceof CrossShopCartError) {
        setCrossShopModal(true, {
          productId: product.id,
          shopId,
          shopName,
        });
      }
    }
  };

  if (qty === 0) {
    return (
      <button
        onClick={handleAdd}
        disabled={!product.is_available}
        className={cn(
          'flex items-center gap-1 rounded-xl px-3 py-1.5 text-sm font-semibold transition-all',
          product.is_available
            ? 'bg-[#FF6B35] text-white hover:bg-[#e55a26] active:scale-95'
            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
        )}
      >
        <Plus size={14} />
        {product.is_available ? 'Add' : 'Sold Out'}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1 bg-[#FF6B35] rounded-xl overflow-hidden">
      <button
        onClick={() => updateQty(product.id, qty - 1)}
        className="p-1.5 text-white hover:bg-[#e55a26] transition-colors"
      >
        <Minus size={14} />
      </button>
      <span className="text-white text-sm font-bold px-1 min-w-[1.25rem] text-center">
        {qty}
      </span>
      <button
        onClick={handleAdd}
        className="p-1.5 text-white hover:bg-[#e55a26] transition-colors"
      >
        <Plus size={14} />
      </button>
    </div>
  );
}

// ── ProductCard ───────────────────────────────────────────────

interface ProductCardProps {
  product: Product;
  shopId: string;
  shopName: string;
}

export function ProductCard({ product, shopId, shopName }: ProductCardProps) {
  const discount = product.mrp ? discountPercent(product.price, product.mrp) : 0;

  return (
    <Card
      className={cn(
        'flex gap-3 p-3 hover:shadow-sm transition-shadow',
        !product.is_available && 'opacity-60'
      )}
    >
      {/* Veg/Non-veg indicator + name */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-1">
          <div
            className={cn(
              'w-4 h-4 rounded-sm border-2 flex items-center justify-center flex-shrink-0',
              product.is_veg ? 'border-green-600' : 'border-red-600'
            )}
          >
            <div
              className={cn(
                'w-2 h-2 rounded-full',
                product.is_veg ? 'bg-green-600' : 'bg-red-600'
              )}
            />
          </div>
          <span className="text-[10px] text-gray-400 uppercase tracking-wide">
            {product.unit}
          </span>
        </div>

        <h4 className="text-sm font-semibold text-gray-900 line-clamp-2 leading-tight">
          {product.name}
        </h4>

        {product.description && (
          <p className="text-xs text-gray-400 mt-1 line-clamp-2">{product.description}</p>
        )}

        <div className="flex items-center gap-2 mt-2">
          <span className="text-sm font-bold text-gray-900">
            {formatPrice(product.price)}
          </span>
          {product.mrp && product.mrp > product.price && (
            <>
              <span className="text-xs text-gray-400 line-through">
                {formatPrice(product.mrp)}
              </span>
              {discount > 0 && (
                <Badge variant="success">{discount}% off</Badge>
              )}
            </>
          )}
        </div>

        <div className="mt-2">
          <AddToCartButton product={product} shopId={shopId} shopName={shopName} />
        </div>
      </div>

      {/* Product image */}
      {product.image_url && (
        <div className="w-24 h-24 rounded-xl overflow-hidden flex-shrink-0 relative bg-gray-100">
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            className="object-cover"
            sizes="96px"
          />
          {!product.is_available && (
            <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
              <span className="text-xs font-bold text-gray-600">Sold Out</span>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

// ── ProductGrid ───────────────────────────────────────────────

interface ProductGridProps {
  products: Product[];
  shopId: string;
  shopName: string;
}

export function ProductGrid({ products, shopId, shopName }: ProductGridProps) {
  if (products.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          shopId={shopId}
          shopName={shopName}
        />
      ))}
    </div>
  );
}
