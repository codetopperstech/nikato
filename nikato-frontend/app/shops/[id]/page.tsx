'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';

export default function ShopPage() {
  const params = useParams(); const id = (Array.isArray(params.id) ? params.id[0] : params.id) ?? "";
  const router = useRouter();
  const [shop, setShop] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const [{ data: shopData }, { data: catData }, { data: prodData }] = await Promise.all([
        supabase.from('shops').select('*').eq('id', id).single(),
        supabase.from('categories').select('*').eq('shop_id', id).eq('is_active', true).order('sort_order'),
        supabase.from('products').select('*').eq('shop_id', id).order('sort_order'),
      ]);
      setShop(shopData);
      setCategories(catData ?? []);
      setProducts(prodData ?? []);
      setLoading(false);
    };
    if (id) fetchData();
  }, [id]);

  const addToCart = (productId: string) => setCart(c => ({ ...c, [productId]: (c[productId] ?? 0) + 1 }));
  const removeFromCart = (productId: string) => setCart(c => { const n = { ...c }; if (n[productId] > 1) n[productId]--; else delete n[productId]; return n; });
  const cartTotal = products.reduce((sum, p) => sum + (p.price * (cart[p.id] ?? 0)), 0);
  const cartCount = Object.values(cart).reduce((a, b) => a + b, 0);

  const getProductsByCategory = (catId: string) => products.filter(p => p.category_id === catId);
  const uncategorized = products.filter(p => !p.category_id);

  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="text-orange-500 text-xl">Loading...</div></div>;
  if (!shop) return <div className="flex items-center justify-center min-h-screen"><div className="text-gray-500">Shop not found</div></div>;

  return (
    <div className="bg-gray-50 min-h-screen pb-32">
      {/* Shop Header */}
      <div className="bg-white shadow-sm">
        <div className="bg-gradient-to-r from-orange-400 to-orange-500 h-32 flex items-end px-4 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-3xl shadow-md">
              {shop.logo_url ? <img src={shop.logo_url} className="w-full h-full object-cover rounded-2xl" alt={shop.name} /> : '🏪'}
            </div>
            <div className="text-white">
              <h1 className="text-xl font-bold">{shop.name}</h1>
              <p className="text-orange-100 text-sm">{shop.address_line}, {shop.city}</p>
            </div>
          </div>
        </div>
        <div className="px-4 py-3 flex items-center gap-4 text-sm">
          <span className={`px-2 py-1 rounded-full font-medium text-xs ${shop.is_open ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-500'}`}>
            {shop.is_open ? '● Open' : '● Closed'}
          </span>
          <span className="text-gray-400">~{shop.avg_delivery_minutes} mins</span>
          <span className="text-gray-400">Min ₹{shop.min_order_amount}</span>
          <span className="text-gray-400">📦 Free delivery</span>
        </div>
      </div>

      {/* Products */}
      <div className="px-4 py-4 max-w-3xl mx-auto">
        {products.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">📦</div>
            <p className="text-gray-500 font-medium">No products available yet</p>
            <p className="text-gray-400 text-sm mt-1">Check back soon!</p>
          </div>
        ) : (
          <>
            {/* Categories */}
            {categories.map(cat => {
              const catProducts = getProductsByCategory(cat.id);
              if (catProducts.length === 0) return null;
              return (
                <div key={cat.id} className="mb-6">
                  <h2 className="text-lg font-bold mb-3 text-gray-800">{cat.name}</h2>
                  <div className="space-y-3">
                    {catProducts.map(product => (
                      <ProductCard key={product.id} product={product} qty={cart[product.id] ?? 0} onAdd={() => addToCart(product.id)} onRemove={() => removeFromCart(product.id)} />
                    ))}
                  </div>
                </div>
              );
            })}
            {/* Uncategorized */}
            {uncategorized.length > 0 && (
              <div className="mb-6">
                <h2 className="text-lg font-bold mb-3 text-gray-800">Products</h2>
                <div className="space-y-3">
                  {uncategorized.map(product => (
                    <ProductCard key={product.id} product={product} qty={cart[product.id] ?? 0} onAdd={() => addToCart(product.id)} onRemove={() => removeFromCart(product.id)} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Cart Bar */}
      {cartCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t shadow-2xl">
          <button
            onClick={() => {
              localStorage.setItem('nikato_cart', JSON.stringify({ shopId: id, items: cart }));
              router.push('/cart');
            }}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white py-4 rounded-2xl font-bold text-lg flex items-center justify-between px-6 transition">
            <span className="bg-orange-400 px-2 py-0.5 rounded-lg text-sm">{cartCount} items</span>
            <span>View Cart</span>
            <span>₹{cartTotal.toFixed(0)}</span>
          </button>
        </div>
      )}
    </div>
  );
}

function ProductCard({ product, qty, onAdd, onRemove }: { product: any; qty: number; onAdd: () => void; onRemove: () => void }) {
  return (
    <div className="bg-white rounded-2xl p-4 flex items-center gap-4 shadow-sm border border-gray-100">
      <div className="w-16 h-16 bg-orange-50 rounded-xl flex items-center justify-center flex-shrink-0">
        {product.image_url ? (
          <img src={product.image_url} alt={product.name} className="w-full h-full object-cover rounded-xl" />
        ) : (
          <span className="text-2xl">🛒</span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1 mb-1">
          <span className={`w-3 h-3 rounded-sm border-2 flex-shrink-0 ${product.is_veg ? 'border-green-500' : 'border-red-500'}`}>
            <span className={`block w-1.5 h-1.5 rounded-full m-0.5 ${product.is_veg ? 'bg-green-500' : 'bg-red-500'}`}></span>
          </span>
          <h3 className="font-semibold text-sm text-gray-800 truncate">{product.name}</h3>
        </div>
        {product.description && <p className="text-xs text-gray-400 truncate">{product.description}</p>}
        <p className="text-xs text-gray-400">{product.unit}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className="font-bold text-gray-900">₹{product.price}</span>
          {product.mrp && product.mrp > product.price && (
            <span className="text-xs text-gray-400 line-through">₹{product.mrp}</span>
          )}
          {product.mrp && product.mrp > product.price && (
            <span className="text-xs text-green-600 font-medium">
              {Math.round((1 - product.price / product.mrp) * 100)}% off
            </span>
          )}
        </div>
      </div>
      <div className="flex-shrink-0">
        {!product.is_available || product.stock === 0 ? (
          <span className="text-xs text-red-400 bg-red-50 px-2 py-1 rounded-lg">Out of stock</span>
        ) : qty === 0 ? (
          <button onClick={onAdd}
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl text-sm font-bold transition">
            ADD
          </button>
        ) : (
          <div className="flex items-center gap-2 bg-orange-500 rounded-xl px-2 py-1">
            <button onClick={onRemove} className="text-white font-bold text-lg w-6 h-6 flex items-center justify-center">−</button>
            <span className="text-white font-bold text-sm w-4 text-center">{qty}</span>
            <button onClick={onAdd} className="text-white font-bold text-lg w-6 h-6 flex items-center justify-center">+</button>
          </div>
        )}
      </div>
    </div>
  );
}
