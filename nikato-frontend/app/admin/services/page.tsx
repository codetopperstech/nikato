'use client';
import { useEffect, useState } from 'react';
import { Plus, Pencil, Check, X, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';

const SERVICE_LABELS: Record<string, string> = {
  plumber: '🔧 Plumber', electrician: '⚡ Electrician', beautician: '💅 Beautician',
  carpenter: '🪚 Carpenter', painter: '🎨 Painter', 'pest-control': '🪲 Pest Control',
};
const SERVICE_SLUGS = Object.keys(SERVICE_LABELS);

export default function AdminServicesPage() {
  const [tab, setTab] = useState<'prices' | 'providers'>('prices');

  // ── Prices ──────────────────────────────────────────────
  const [prices, setPrices] = useState<any[]>([]);
  const [editPrice, setEditPrice] = useState<{ service_type: string; base_price: string; unit: string } | null>(null);
  const [savingPrice, setSavingPrice] = useState(false);

  const fetchPrices = async () => {
    const d = await fetch('/api/admin/service-prices').then(r => r.json());
    setPrices(d.prices ?? []);
  };

  const savePrice = async () => {
    if (!editPrice) return;
    setSavingPrice(true);
    await fetch('/api/admin/service-prices', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ service_type: editPrice.service_type, base_price: parseFloat(editPrice.base_price), unit: editPrice.unit }),
    });
    await fetchPrices();
    setEditPrice(null);
    setSavingPrice(false);
  };

  // ── Providers ────────────────────────────────────────────
  const [providers, setProviders] = useState<any[]>([]);
  const [addForm, setAddForm] = useState({ name: '', phone: '', service_type: 'plumber', city: '', experience_years: '0' });
  const [adding, setAdding] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  const fetchProviders = async () => {
    const d = await fetch('/api/admin/service-providers').then(r => r.json());
    setProviders(d.providers ?? []);
  };

  const addProvider = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdding(true);
    await fetch('/api/admin/service-providers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...addForm, experience_years: parseInt(addForm.experience_years) }),
    });
    await fetchProviders();
    setAddForm({ name: '', phone: '', service_type: 'plumber', city: '', experience_years: '0' });
    setShowAddForm(false);
    setAdding(false);
  };

  const toggleAvailable = async (id: string, current: boolean) => {
    await fetch('/api/admin/service-providers', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, is_available: !current }),
    });
    setProviders(ps => ps.map(p => p.id === id ? { ...p, is_available: !current } : p));
  };

  const deleteProvider = async (id: string) => {
    if (!confirm('Delete this provider?')) return;
    await fetch('/api/admin/service-providers', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    setProviders(ps => ps.filter(p => p.id !== id));
  };

  useEffect(() => { fetchPrices(); fetchProviders(); }, []);

  const inputCls = "w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:border-[#7ED957] transition-colors";

  return (
    <div className="p-4 lg:p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Home Services</h1>
          <p className="text-gray-400 text-sm">Manage prices and professionals</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 p-1 bg-gray-100 rounded-xl w-fit">
        {(['prices', 'providers'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-bold capitalize transition-all ${tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>
            {t === 'prices' ? '💰 Prices' : '👷 Providers'}
          </button>
        ))}
      </div>

      {/* ── PRICES TAB ── */}
      {tab === 'prices' && (
        <div className="space-y-3">
          {SERVICE_SLUGS.map(slug => {
            const row = prices.find(p => p.service_type === slug);
            const isEditing = editPrice?.service_type === slug;
            return (
              <div key={slug} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-4">
                <p className="font-bold text-gray-900 w-36 flex-shrink-0">{SERVICE_LABELS[slug]}</p>
                {isEditing ? (
                  <div className="flex items-center gap-2 flex-1">
                    <span className="text-gray-500 font-bold">₹</span>
                    <input type="number" value={editPrice!.base_price} onChange={e => setEditPrice(ep => ep && { ...ep, base_price: e.target.value })}
                      className="w-24 px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-bold focus:outline-none focus:border-[#7ED957]" />
                    <span className="text-gray-400 text-sm">/</span>
                    <input value={editPrice!.unit} onChange={e => setEditPrice(ep => ep && { ...ep, unit: e.target.value })}
                      className="w-20 px-3 py-1.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[#7ED957]" />
                    <button onClick={savePrice} disabled={savingPrice}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-white text-xs font-bold disabled:opacity-60"
                      style={{ background: '#7ED957' }}>
                      <Check size={13} /> Save
                    </button>
                    <button onClick={() => setEditPrice(null)} className="p-1.5 rounded-lg border border-gray-200 text-gray-400">
                      <X size={13} />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between flex-1">
                    <p className="font-black text-gray-900">
                      {row ? `₹${row.base_price} / ${row.unit}` : <span className="text-gray-400 font-normal text-sm">Not set</span>}
                    </p>
                    <button onClick={() => setEditPrice({ service_type: slug, base_price: String(row?.base_price ?? 0), unit: row?.unit ?? 'visit' })}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-bold text-gray-600 hover:border-[#7ED957] transition-colors">
                      <Pencil size={12} /> Edit
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── PROVIDERS TAB ── */}
      {tab === 'providers' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-500">{providers.length} professionals added</p>
            <button onClick={() => setShowAddForm(v => !v)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-white"
              style={{ background: '#7ED957' }}>
              <Plus size={14} /> Add Professional
            </button>
          </div>

          {/* Add form */}
          {showAddForm && (
            <form onSubmit={addProvider} className="bg-white rounded-2xl border border-gray-100 p-4 mb-4 space-y-3">
              <p className="font-bold text-gray-900 text-sm mb-3">Add New Professional</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-500 mb-1 block">Name</label>
                  <input required value={addForm.name} onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))} placeholder="Full name" className={inputCls} />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 mb-1 block">Phone</label>
                  <input required type="tel" value={addForm.phone} onChange={e => setAddForm(f => ({ ...f, phone: e.target.value }))} placeholder="+91 9999999999" className={inputCls} />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 mb-1 block">Service Type</label>
                  <select value={addForm.service_type} onChange={e => setAddForm(f => ({ ...f, service_type: e.target.value }))} className={inputCls}>
                    {SERVICE_SLUGS.map(s => <option key={s} value={s}>{SERVICE_LABELS[s]}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 mb-1 block">City</label>
                  <input required value={addForm.city} onChange={e => setAddForm(f => ({ ...f, city: e.target.value }))} placeholder="City" className={inputCls} />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 mb-1 block">Experience (years)</label>
                  <input type="number" min="0" value={addForm.experience_years} onChange={e => setAddForm(f => ({ ...f, experience_years: e.target.value }))} className={inputCls} />
                </div>
              </div>
              <div className="flex gap-2 justify-end pt-1">
                <button type="button" onClick={() => setShowAddForm(false)} className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-bold text-gray-600">Cancel</button>
                <button type="submit" disabled={adding} className="px-4 py-2 rounded-xl text-sm font-bold text-white disabled:opacity-60" style={{ background: '#7ED957' }}>
                  {adding ? 'Adding…' : 'Add'}
                </button>
              </div>
            </form>
          )}

          {providers.length === 0 ? (
            <div className="text-center py-14 bg-white rounded-2xl border border-gray-100">
              <div className="text-5xl mb-3">👷</div>
              <p className="font-bold text-gray-700">No professionals yet</p>
              <p className="text-sm text-gray-400 mt-1">Add your first service professional above.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {providers.map(p => (
                <div key={p.id} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black flex-shrink-0" style={{ background: '#7ED957' }}>
                    {p.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 text-sm">{p.name}</p>
                    <p className="text-xs text-gray-500">{SERVICE_LABELS[p.service_type] ?? p.service_type} · {p.city} · {p.experience_years}yr</p>
                    <p className="text-xs text-gray-400">{p.phone}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${p.is_available ? 'text-green-800' : 'text-gray-500'}`}
                      style={{ background: p.is_available ? '#7ED95720' : '#f3f4f6' }}>
                      {p.is_available ? 'Available' : 'Busy'}
                    </span>
                    <button onClick={() => toggleAvailable(p.id, p.is_available)} title="Toggle availability"
                      className="text-gray-400 hover:text-gray-700 transition-colors">
                      {p.is_available ? <ToggleRight size={22} style={{ color: '#7ED957' }} /> : <ToggleLeft size={22} />}
                    </button>
                    <button onClick={() => deleteProvider(p.id)} className="text-red-400 hover:text-red-600 transition-colors">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
