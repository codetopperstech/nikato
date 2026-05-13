'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function AdminShopsPage() {
  const [shops, setShops] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved'>('all');
  const [error, setError] = useState('');

  const fetchShops = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/shops');
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Failed to fetch shops');
      setShops(json.shops ?? []);
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  };

  useEffect(() => { fetchShops(); }, []);

  const toggleApprove = async (id: string, current: boolean) => {
    const res = await fetch('/api/admin/shops', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, is_approved: !current }),
    });
    if (res.ok) {
      setShops(s => s.map(x => x.id === id ? { ...x, is_approved: !current } : x));
    }
  };

  const toggleOpen = async (id: string, current: boolean) => {
    const res = await fetch('/api/admin/shops', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, is_open: !current }),
    });
    if (res.ok) {
      setShops(s => s.map(x => x.id === id ? { ...x, is_open: !current } : x));
    }
  };

  const filtered = shops.filter(s =>
    filter === 'all' ? true : filter === 'approved' ? s.is_approved : !s.is_approved
  );

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Shops</h1>
          <p className="text-gray-400 text-sm">{shops.length} total shops</p>
        </div>
        <Link href="/admin/create-shop"
          className="bg-orange-500 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-orange-600 transition">
          + Create Shop
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl mb-4 text-sm flex items-center justify-between">
          <span>⚠️ {error}</span>
          <button onClick={fetchShops} className="underline text-red-500 ml-4">Retry</button>
        </div>
      )}

      <div className="flex gap-2 mb-4">
        {(['all', 'pending', 'approved'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-full text-sm font-medium capitalize transition ${filter === f ? 'bg-orange-500 text-white' : 'bg-white border text-gray-600 hover:bg-gray-50'}`}>
            {f} {f === 'pending' ? `(${shops.filter(s => !s.is_approved).length})` : f === 'approved' ? `(${shops.filter(s => s.is_approved).length})` : `(${shops.length})`}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-16 text-orange-500 animate-pulse">Loading shops...</div>
      ) : (
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <div className="bg-white rounded-2xl border p-8 text-center text-gray-400">
              <div className="text-4xl mb-3">🏪</div>
              <p>No shops found</p>
            </div>
          ) : filtered.map(shop => (
            <div key={shop.id} className="bg-white rounded-2xl border shadow-sm p-4 flex items-center justify-between hover:shadow-md transition">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center text-2xl">🏪</div>
                <div>
                  <h3 className="font-bold text-sm">{shop.name}</h3>
                  <p className="text-xs text-gray-400">{shop.city} · {shop.phone}</p>
                  <p className="text-xs text-gray-300">Owner: {shop.profiles?.full_name || shop.profiles?.phone || 'Unknown'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => toggleOpen(shop.id, shop.is_open)}
                  className={`text-xs px-3 py-1.5 rounded-lg font-medium transition ${shop.is_open ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                  {shop.is_open ? '● Open' : '● Closed'}
                </button>
                <button onClick={() => toggleApprove(shop.id, shop.is_approved)}
                  className={`text-xs px-3 py-1.5 rounded-lg font-medium transition ${shop.is_approved ? 'bg-blue-100 text-blue-600 hover:bg-red-100 hover:text-red-600' : 'bg-orange-500 text-white hover:bg-orange-600'}`}>
                  {shop.is_approved ? 'Approved ✓' : 'Approve →'}
                </button>
                <Link href={`/admin/shops/${shop.id}`}
                  className="text-xs px-3 py-1.5 rounded-lg font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition">
                  Details
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
