'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';

export default function AdminShopsPage() {
  const [shops, setShops] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchShops() {
      const { data, error } = await supabase
        .from('shops')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (data) setShops(data);
      setLoading(false);
    }
    fetchShops();
  }, []);

  const toggleApprove = async (id: string, current: boolean) => {
    await supabase.from('shops').update({ is_approved: !current }).eq('id', id);
    setShops(shops.map(s => s.id === id ? {...s, is_approved: !current} : s));
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">All Shops ({shops.length})</h1>
      <div className="space-y-4">
        {shops.map(shop => (
          <div key={shop.id} className="bg-white rounded-xl p-4 shadow flex justify-between items-center">
            <div>
              <h2 className="font-bold text-lg">{shop.name}</h2>
              <p className="text-gray-500 text-sm">{shop.city} · {shop.phone}</p>
              <p className="text-gray-400 text-xs">{shop.address_line}</p>
            </div>
            <div className="flex gap-2 items-center">
              <span className={`px-3 py-1 rounded-full text-sm ${shop.is_open ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                {shop.is_open ? 'Open' : 'Closed'}
              </span>
              <button
                onClick={() => toggleApprove(shop.id, shop.is_approved)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold ${shop.is_approved ? 'bg-red-100 text-red-600' : 'bg-green-500 text-white'}`}
              >
                {shop.is_approved ? 'Revoke' : 'Approve'}
              </button>
            </div>
          </div>
        ))}
        {shops.length === 0 && <p className="text-gray-400">No shops yet.</p>}
      </div>
    </div>
  );
}
