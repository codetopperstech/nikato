'use client';
import { useEffect, useState } from 'react';

type Partner = {
  id: string; full_name: string | null; phone: string | null;
  role: string; created_at: string;
  location: { is_online: boolean } | null;
  earnings: number;
};

export default function AdminDeliveryPartnersPage() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/admin/delivery-partners')
      .then(r => r.json())
      .then(d => { if (d.error) setError(d.error); else setPartners(d.partners ?? []); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Delivery Partners</h1>
          <p className="text-gray-400 text-sm">{partners.length} total partners</p>
        </div>
      </div>
      {error && <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl mb-4 text-sm">⚠️ {error}</div>}
      {loading ? (
        <div className="text-center py-16 text-orange-500 animate-pulse">Loading...</div>
      ) : partners.length === 0 ? (
        <div className="bg-white rounded-2xl border p-8 text-center text-gray-400">
          <div className="text-4xl mb-3">🛵</div>
          <p>No delivery partners yet</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
          <div className="divide-y">
            {partners.map(p => (
              <div key={p.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-lg font-bold text-green-600">
                    {p.full_name ? p.full_name[0].toUpperCase() : '?'}
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{p.full_name || 'No name'}</p>
                    <p className="text-xs text-gray-400">{p.phone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${p.location?.is_online ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {p.location?.is_online ? '● Online' : '● Offline'}
                  </span>
                  <span className="text-sm font-bold text-gray-700">₹{p.earnings.toFixed(0)} earned</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
