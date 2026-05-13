'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';

export default function HomePage() {
  const [shops, setShops] = useState<any[]>([]);

  useEffect(() => {
    supabase.from('shops').select('*').eq('is_approved', true).eq('is_open', true).limit(6).then(({ data }) => {
      if (data) setShops(data);
    });
  }, []);

  return (
    <div>
      {/* Hero */}
      <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white px-6 py-16">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-4xl font-black leading-tight mb-4">
            Your neighbourhood,<br />delivered in minutes
          </h1>
          <p className="text-orange-100 mb-8 text-lg">
            Fresh groceries, hot food, and essentials from shops right around you.
          </p>
          <Link href="/shops"
            className="inline-block bg-white text-orange-500 px-8 py-3 rounded-full font-bold text-lg hover:bg-orange-50 transition shadow-lg">
            Browse nearby shops →
          </Link>
        </div>
      </div>

      {/* Features */}
      <div className="bg-white px-6 py-8">
        <div className="max-w-3xl mx-auto grid grid-cols-3 gap-4 text-center">
          {[
            { icon: '⚡', title: 'Fast delivery', desc: 'In 30 mins' },
            { icon: '📍', title: 'Live tracking', desc: 'Real-time' },
            { icon: '🔒', title: 'Safe & secure', desc: 'Trusted shops' },
          ].map(f => (
            <div key={f.title} className="p-4 rounded-2xl bg-orange-50">
              <div className="text-3xl mb-2">{f.icon}</div>
              <div className="font-semibold text-sm">{f.title}</div>
              <div className="text-xs text-gray-400">{f.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Nearby Shops */}
      <div className="px-6 py-8 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">Nearby Shops</h2>
            <Link href="/shops" className="text-orange-500 text-sm font-semibold">See all →</Link>
          </div>
          {shops.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <div className="text-4xl mb-3">🏪</div>
              <p>No shops available right now</p>
              <Link href="/shops" className="text-orange-500 text-sm mt-2 inline-block">Browse all shops</Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {shops.map(shop => (
                <Link key={shop.id} href={`/shops/${shop.id}`}
                  className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition border border-gray-100">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center text-2xl">
                      {shop.logo_url ? <img src={shop.logo_url} className="w-full h-full object-cover rounded-xl" /> : '🏪'}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm">{shop.name}</h3>
                      <p className="text-xs text-gray-400">{shop.city}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${shop.is_open ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-500'}`}>
                      {shop.is_open ? '● Open' : '● Closed'}
                    </span>
                    <span className="text-xs text-gray-400">~{shop.avg_delivery_minutes} mins</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
