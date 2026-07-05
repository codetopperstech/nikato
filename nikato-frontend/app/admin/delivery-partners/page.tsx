'use client';
import { useEffect, useState } from 'react';
import { UserCheck, UserX, Bike, WifiOff, Wifi } from 'lucide-react';
import { toast } from '@/store/ui';

type Partner = {
  id: string;
  full_name: string | null;
  phone: string | null;
  role: string;
  is_active: boolean;
  created_at: string;
  location: { is_online: boolean } | null;
  earnings: number;
};

export default function AdminDeliveryPartnersPage() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toggling, setToggling] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/delivery-partners')
      .then(r => r.json())
      .then(d => { if (d.error) setError(d.error); else setPartners(d.partners ?? []); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const toggleActive = async (partner: Partner) => {
    setToggling(partner.id);
    const res = await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: partner.id, is_active: !partner.is_active }),
    });
    if (res.ok) {
      setPartners(ps => ps.map(p => p.id === partner.id ? { ...p, is_active: !p.is_active } : p));
      toast.success(partner.is_active ? 'Partner deactivated' : 'Partner activated');
    } else {
      toast.error('Failed to update partner');
    }
    setToggling(null);
  };

  const online = partners.filter(p => p.location?.is_online).length;
  const active = partners.filter(p => p.is_active).length;

  return (
    <div className="p-4 lg:p-6 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Delivery Partners</h1>
          <p className="text-xs text-gray-400 mt-1">{partners.length} total · {active} active · {online} online now</p>
        </div>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { label: 'Total Partners', value: partners.length, icon: Bike, bg: '#edfbdc', color: '#5cb83a' },
          { label: 'Active', value: active, icon: UserCheck, bg: '#e8f6ff', color: '#0284c7' },
          { label: 'Online Now', value: online, icon: Wifi, bg: '#dcfce7', color: '#16a34a' },
        ].map(({ label, value, icon: Icon, bg, color }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-card">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-2" style={{ background: bg }}>
              <Icon size={15} style={{ color }} />
            </div>
            <p className="text-xl font-black text-gray-900">{value}</p>
            <p className="text-xs text-gray-400">{label}</p>
          </div>
        ))}
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl mb-4 text-sm">⚠️ {error}</div>}

      {loading ? (
        <div className="text-center py-16 text-gray-400 animate-pulse">Loading partners…</div>
      ) : partners.length === 0 ? (
        <div className="bg-white rounded-2xl border p-10 text-center text-gray-400">
          <div className="text-4xl mb-3">🛵</div>
          <p className="font-semibold">No delivery partners yet</p>
          <p className="text-sm mt-1">Use "Add Delivery Partner" to onboard riders</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden">
          <div className="divide-y divide-gray-100">
            {partners.map(p => (
              <div key={p.id} className={`px-5 py-4 flex items-center justify-between gap-3 ${!p.is_active ? 'opacity-60 bg-gray-50' : ''}`}>
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative flex-shrink-0">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white" style={{ background: p.is_active ? '#7ED957' : '#9ca3af' }}>
                      {p.full_name ? p.full_name[0].toUpperCase() : '?'}
                    </div>
                    <span className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${p.location?.is_online ? 'bg-green-400' : 'bg-gray-300'}`} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm text-gray-900 truncate">{p.full_name || 'No name'}</p>
                    <p className="text-xs text-gray-400">{p.phone}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-bold text-gray-700">₹{p.earnings.toFixed(0)}</p>
                    <p className="text-xs text-gray-400">earned</p>
                  </div>

                  <span className={`text-xs px-2 py-1 rounded-full font-medium hidden sm:inline-flex items-center gap-1 ${p.location?.is_online ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {p.location?.is_online ? <Wifi size={10} /> : <WifiOff size={10} />}
                    {p.location?.is_online ? 'Online' : 'Offline'}
                  </span>

                  <button
                    onClick={() => toggleActive(p)}
                    disabled={toggling === p.id}
                    title={p.is_active ? 'Deactivate partner' : 'Activate partner'}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all disabled:opacity-50 ${p.is_active ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-700 hover:bg-green-100'}`}>
                    {toggling === p.id ? (
                      <span className="w-3.5 h-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />
                    ) : p.is_active ? (
                      <><UserX size={13} /> Deactivate</>
                    ) : (
                      <><UserCheck size={13} /> Activate</>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
