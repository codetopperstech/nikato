'use client';
import { useEffect, useState } from 'react';
import { formatRelativeTime } from '@/lib/utils';

const STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  pending:   { bg: '#fff7ed', color: '#c2570a', label: 'Pending' },
  contacted: { bg: '#e8f6ff', color: '#0369a1', label: 'Contacted' },
  approved:  { bg: '#edfbdc', color: '#166534', label: 'Approved' },
  rejected:  { bg: '#fef2f2', color: '#dc2626', label: 'Rejected' },
};

const NEXT_STATUS: Record<string, { label: string; value: string }[]> = {
  pending:   [{ label: 'Mark Contacted', value: 'contacted' }, { label: 'Reject', value: 'rejected' }],
  contacted: [{ label: 'Approve', value: 'approved' }, { label: 'Reject', value: 'rejected' }],
  approved:  [{ label: 'Reject', value: 'rejected' }],
  rejected:  [{ label: 'Re-open', value: 'pending' }],
};

export default function AdminPartnersPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [error, setError] = useState('');

  const fetch_ = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/partners');
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      setRequests(d.requests ?? []);
    } catch (e: any) { setError(e.message); }
    setLoading(false);
  };

  useEffect(() => { fetch_(); }, []);

  const updateStatus = async (id: string, status: string) => {
    const res = await fetch('/api/admin/partners', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    });
    if (res.ok) setRequests(r => r.map(x => x.id === id ? { ...x, status } : x));
  };

  const filtered = filter === 'all' ? requests : requests.filter(r => r.status === filter);
  const pendingCount = requests.filter(r => r.status === 'pending').length;

  return (
    <div className="p-4 lg:p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            Partner Requests
            {pendingCount > 0 && (
              <span className="text-sm font-bold px-2 py-0.5 rounded-full text-white" style={{ background: '#7ED957' }}>
                {pendingCount} new
              </span>
            )}
          </h1>
          <p className="text-gray-400 text-sm">{requests.length} total applications</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {['all', 'pending', 'contacted', 'approved', 'rejected'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${filter === f ? 'text-white' : 'bg-white border border-gray-200 text-gray-600'}`}
            style={filter === f ? { background: '#7ED957' } : {}}>
            {f === 'all' ? `All (${requests.length})` : `${f} (${requests.filter(r => r.status === f).length})`}
          </button>
        ))}
      </div>

      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-2xl p-4 border border-gray-100 animate-pulse">
              <div className="h-4 bg-gray-100 rounded w-1/3 mb-2" />
              <div className="h-3 bg-gray-100 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <div className="text-5xl mb-3">🏪</div>
          <p className="font-bold text-gray-700">No partner requests yet</p>
          <p className="text-sm text-gray-400 mt-1">Applications submitted via the website will appear here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(r => {
            const st = STATUS_STYLE[r.status] ?? STATUS_STYLE.pending;
            return (
              <div key={r.id} className="bg-white rounded-2xl border border-gray-100 p-4">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <p className="font-black text-gray-900">{r.shop_name}</p>
                    <p className="text-sm text-gray-500">{r.owner_name} · {r.phone}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{r.city} · {r.business_type}</p>
                  </div>
                  <span className="flex-shrink-0 text-xs font-bold px-2.5 py-1 rounded-full"
                    style={{ background: st.bg, color: st.color }}>
                    {st.label}
                  </span>
                </div>

                {r.message && (
                  <p className="text-xs text-gray-500 bg-gray-50 rounded-xl px-3 py-2 mb-3 italic">"{r.message}"</p>
                )}

                <div className="flex items-center justify-between">
                  <p className="text-[11px] text-gray-400">{formatRelativeTime(r.created_at)}</p>
                  <div className="flex gap-2">
                    {(NEXT_STATUS[r.status] ?? []).map(({ label, value }) => (
                      <button key={value} onClick={() => updateStatus(r.id, value)}
                        className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all active:scale-95 ${
                          value === 'rejected'
                            ? 'bg-red-50 text-red-600 hover:bg-red-100'
                            : 'text-white hover:opacity-90'
                        }`}
                        style={value !== 'rejected' ? { background: '#7ED957' } : {}}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
