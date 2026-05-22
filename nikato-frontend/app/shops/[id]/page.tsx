'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useCartStore, CrossShopCartError } from '@/store/cart';
import type { Product } from '@/types';

export default function ShopPage() {
  const params = useParams();
  const id = (Array.isArray(params.id) ? params.id[0] : params.id) ?? '';
  const router = useRouter();
  const [shop, setShop] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [crossShopWarning, setCrossShopWarning] = useState(false);
  const { addItem, updateQty, getItemQty, itemCount, totalAmount, shopId: cartShopId, clearCart } = useCartStore();

  useEffect(() => {
    if (!id) return;
    fetch(`/api/shops/${id}/products`)
      .then(r => r.json())
      .then(d => { if (d.error) setError(d.error); else { setShop(d.shop); setCategories(d.categories); setProducts(d.products); } })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  const handleAdd = (product: Product) => { try { addItem(product, id, shop?.name ?? ''); } catch (e) { if (e instanceof CrossShopCartError) setCrossShopWarning(true); } };
  const handleRemove = (productId: string) => updateQty(productId, getItemQty(productId) - 1);
  const cartCount = itemCount();
  const cartTotal = totalAmount();
  const getByCategory = (catId: string) => products.filter(p => p.category_id === catId);
  const uncategorized = products.filter(p => !p.category_id);

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen" style={{ background: '#F9FBF8' }}>
      <div className="w-10 h-10 rounded-full border-3 border-brand border-t-transparent animate-spin" style={{ borderColor: '#7ED957', borderTopColor: 'transparent', borderWidth: 3 }} />
    </div>
  );
  if (error || !shop) return <div className="flex items-center justify-center min-h-screen text-gray-500">{error || 'Shop not found'}</div>;

  return (
    <div className="pb-32" style={{ background: '#F9FBF8' }}>
      {/* Cross-shop warning modal */}
      {crossShopWarning && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setCrossShopWarning(false)} />
          <div className="relative bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-slide-up">
            <div className="text-3xl text-center mb-3">🛒</div>
            <h3 className="font-black text-gray-900 text-center mb-1">Start fresh cart?</h3>
            <p className="text-sm text-gray-500 text-center mb-5">You have items from another shop. Clear your cart to add from this shop.</p>
            <div className="flex gap-3">
              <button onClick={() => setCrossShopWarning(false)} className="flex-1 py-3 rounded-xl border-[1.5px] border-gray-200 text-sm font-semibold text-gray-700 hover:bg-surface-2 transition-colors">Keep cart</button>
              <button onClick={() => { clearCart(); setCrossShopWarning(false); }} className="flex-1 py-3 rounded-xl text-sm font-bold text-white transition-all active:scale-95" style={{ background: '#7ED957' }}>Clear & add</button>
            </div>
          </div>
        </div>
      )}

      {/* Shop header */}
      <div className="bg-white border-b border-gray-100">
        <div className="h-32 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #7ED957 0%, #5cb83a 100%)' }}>
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
          <div className="absolute bottom-4 left-4 right-4 flex items-end gap-3">
            <div className="w-14 h-14 rounded-2xl bg-white shadow-md flex items-center justify-center text-2xl flex-shrink-0 border-2 border-white overflow-hidden">
              {shop.logo_url ? <img src={shop.logo_url} className="w-full h-full object-cover" alt={shop.name} /> : '🏪'}
            </div>
            <div className="text-white flex-1 min-w-0">
              <h1 className="font-black text-lg leading-tight">{shop.name}</h1>
              <p className="text-xs text-white/80 mt-0.5">{shop.address_line}, {shop.city}</p>
            </div>
          </div>
        </div>
        <div className="px-4 py-2.5 flex items-center gap-2 text-xs">
          <span className={`px-2.5 py-1 rounded-full font-semibold ${shop.is_open ? 'text-white' : 'bg-gray-100 text-gray-500'}`} style={shop.is_open ? { background: '#7ED957' } : {}}>
            {shop.is_open ? '● Open' : '● Closed'}
          </span>
          {shop.avg_delivery_minutes && <span className="text-gray-400">~{shop.avg_delivery_minutes} mins</span>}
          {shop.min_order_amount > 0 && <span className="text-gray-400">Min ₹{shop.min_order_amount}</span>}
        </div>
      </div>

      {/* Products */}
      <div className="px-4 py-4 max-w-2xl mx-auto">
        {products.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
            <div className="text-5xl mb-3">📦</div>
            <p className="font-bold text-gray-600">No products yet</p>
            <p className="text-sm text-gray-400 mt-1">Check back soon!</p>
          </div>
        ) : (
          <>
            {categories.map(cat => { const cp = getByCategory(cat.id); if (!cp.length) return null;
              return (
                <div key={cat.id} className="mb-6">
                  <h2 className="text-sm font-black text-gray-900 mb-3 flex items-center gap-2">
                    <span className="w-1 h-4 rounded-full inline-block" style={{ background: '#7ED957' }} />{cat.name}
                  </h2>
                  <div className="space-y-2">{cp.map(p => <ProductCard key={p.id} product={p} qty={getItemQty(p.id)} onAdd={() => handleAdd(p)} onRemove={() => handleRemove(p.id)} />)}</div>
                </div>
              );
            })}
            {uncategorized.length > 0 && (
              <div className="mb-6">
                {categories.length > 0 && <h2 className="text-sm font-black text-gray-900 mb-3 flex items-center gap-2"><span className="w-1 h-4 rounded-full inline-block" style={{ background: '#7ED957' }} />Others</h2>}
                <div className="space-y-2">{uncategorized.map(p => <ProductCard key={p.id} product={p} qty={getItemQty(p.id)} onAdd={() => handleAdd(p)} onRemove={() => handleRemove(p.id)} />)}</div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Cart bar */}
      {cartCount > 0 && cartShopId === id && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100" style={{ boxShadow: '0 -4px 16px rgba(0,0,0,0.08)' }}>
          <button onClick={() => router.push('/cart')} className="w-full py-4 rounded-2xl font-bold text-white text-sm flex items-center justify-between px-5 transition-all active:scale-[0.98]" style={{ background: '#7ED957', boxShadow: '0 4px 16px rgba(126,217,87,0.4)' }}>
            <span className="bg-white/25 px-2.5 py-1 rounded-xl text-xs font-bold">{cartCount} items</span>
            <span>View Cart</span>
            <span>₹{cartTotal.toFixed(0)}</span>
          </button>
        </div>
      )}
    </div>
  );
}

function ProductCard({ product, qty, onAdd, onRemove }: { product: Product; qty: number; onAdd: () => void; onRemove: () => void }) {
  const outOfStock = product.stock === 0;
  return (
    <div className="bg-white rounded-2xl p-3.5 flex items-center gap-3 border border-gray-100 shadow-card">
      <div className="w-16 h-16 rounded-xl bg-surface-2 flex items-center justify-center flex-shrink-0 overflow-hidden">
        {product.image_url ? <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" /> : <span className="text-2xl">🛒</span>}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className={`w-3.5 h-3.5 rounded-sm border-[1.5px] flex-shrink-0 flex items-center justify-center ${product.is_veg ? 'border-green-500' : 'border-red-500'}`}>
            <span className={`w-2 h-2 rounded-full ${product.is_veg ? 'bg-green-500' : 'bg-red-500'}`} />
          </span>
          <h3 className="font-semibold text-sm text-gray-900 truncate">{product.name}</h3>
        </div>
        {product.description && <p className="text-xs text-gray-400 truncate">{product.description}</p>}
        {product.unit && <p className="text-xs text-gray-400">{product.unit}</p>}
        <div className="flex items-center gap-1.5 mt-1">
          <span className="font-black text-sm text-gray-900">₹{product.price}</span>
          {product.mrp && product.mrp > product.price && (
            <>
              <span className="text-xs text-gray-300 line-through">₹{product.mrp}</span>
              <span className="text-xs font-semibold px-1.5 py-0.5 rounded-full" style={{ background: '#edfbdc', color: '#3a8a1f' }}>{Math.round((1 - product.price / product.mrp) * 100)}% off</span>
            </>
          )}
        </div>
      </div>
      <div className="flex-shrink-0">
        {outOfStock ? (
          <span className="text-xs text-gray-400 bg-gray-100 px-2.5 py-1.5 rounded-xl font-medium">Out of stock</span>
        ) : qty === 0 ? (
          <button onClick={onAdd} className="px-4 py-2 rounded-xl text-sm font-bold text-white transition-all active:scale-95 border-[1.5px] border-brand-dark/20" style={{ background: '#7ED957' }}>ADD</button>
        ) : (
          <div className="flex items-center gap-2 rounded-xl px-2 py-1.5 border-[1.5px] border-brand/30" style={{ background: '#edfbdc' }}>
            <button onClick={onRemove} className="w-6 h-6 flex items-center justify-center font-black text-lg rounded-lg hover:bg-white/50 transition-colors" style={{ color: '#5cb83a' }}>−</button>
            <span className="font-black text-sm w-5 text-center" style={{ color: '#3a8a1f' }}>{qty}</span>
            <button onClick={onAdd} className="w-6 h-6 flex items-center justify-center font-black text-lg rounded-lg hover:bg-white/50 transition-colors" style={{ color: '#5cb83a' }}>+</button>
          </div>
        )}
      </div>
    </div>
  );
}
