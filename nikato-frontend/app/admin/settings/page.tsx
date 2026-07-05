'use client';
import { useEffect, useState } from 'react';
import { Settings, Save, Store, Users, ShoppingBag, DollarSign, Phone, Mail, AlertTriangle } from 'lucide-react';
import { toast } from '@/store/ui';

interface PlatformSettings {
  platform_name: string;
  delivery_fee: number;
  default_commission_rate: number;
  min_order_amount: number;
  max_delivery_radius_km: number;
  support_phone: string;
  support_email: string;
  maintenance_mode: boolean;
}

interface Stats { shopCount: number | null; userCount: number | null; orderCount: number | null; }

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [stats, setStats] = useState<Stats>({ shopCount: null, userCount: null, orderCount: null });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/admin/settings')
      .then(r => r.json())
      .then(d => { setSettings(d.settings); setStats(d.stats ?? {}); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    if (!settings) return;
    setSaving(true);
    const res = await fetch('/api/admin/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    const d = await res.json();
    if (!res.ok) toast.error('Save failed', d.error ?? '');
    else toast.success('Settings saved!');
    setSaving(false);
  };

  const set = <K extends keyof PlatformSettings>(k: K, v: PlatformSettings[K]) =>
    setSettings(s => s ? { ...s, [k]: v } : s);

  const inputCls = 'w-full border-[1.5px] border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#7ED957] focus:ring-2 focus:ring-[#7ED957]/15 transition-all bg-white';

  if (loading) return <div className="p-6 animate-pulse text-gray-400">Loading settings…</div>;

  return (
    <div className="p-4 lg:p-6 max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#edfbdc' }}>
          <Settings size={20} style={{ color: '#5cb83a' }} />
        </div>
        <div>
          <h1 className="text-2xl font-black text-gray-900">Platform Settings</h1>
          <p className="text-xs text-gray-400">Configure platform-wide defaults</p>
        </div>
      </div>

      {error && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle size={16} className="text-amber-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-800">Note</p>
            <p className="text-xs text-amber-700 mt-0.5">Settings require a <code className="bg-amber-100 px-1 rounded">platform_settings</code> table in Supabase. Showing defaults until created.</p>
          </div>
        </div>
      )}

      {/* Live platform stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Active Shops', value: stats.shopCount ?? '—', icon: Store, color: '#edfbdc', iconColor: '#5cb83a' },
          { label: 'Total Users', value: stats.userCount ?? '—', icon: Users, color: '#e8f6ff', iconColor: '#0284c7' },
          { label: 'Total Orders', value: stats.orderCount ?? '—', icon: ShoppingBag, color: '#fef3c7', iconColor: '#d97706' },
        ].map(({ label, value, icon: Icon, color, iconColor }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-card">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-2" style={{ background: color }}>
              <Icon size={15} style={{ color: iconColor }} />
            </div>
            <p className="text-xl font-black text-gray-900">{value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {settings && (
        <div className="space-y-5">
          {/* Branding */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-card space-y-4">
            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Branding</h2>
            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-1.5">Platform Name</label>
              <input value={settings.platform_name} onChange={e => set('platform_name', e.target.value)} className={inputCls} />
            </div>
          </div>

          {/* Fees & Rates */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-card space-y-4">
            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide flex items-center gap-2"><DollarSign size={14} /> Fees & Rates</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-1.5">Delivery Fee (₹)</label>
                <input type="number" min={0} value={settings.delivery_fee}
                  onChange={e => set('delivery_fee', parseFloat(e.target.value))} className={inputCls} />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-1.5">Min Order Amount (₹)</label>
                <input type="number" min={0} value={settings.min_order_amount}
                  onChange={e => set('min_order_amount', parseFloat(e.target.value))} className={inputCls} />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-1.5">
                  Default Commission Rate
                  <span className="text-gray-400 font-normal ml-1">(0–1, e.g. 0.10 = 10%)</span>
                </label>
                <input type="number" step="0.01" min={0} max={1} value={settings.default_commission_rate}
                  onChange={e => set('default_commission_rate', parseFloat(e.target.value))} className={inputCls} />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-1.5">Max Delivery Radius (km)</label>
                <input type="number" min={1} value={settings.max_delivery_radius_km}
                  onChange={e => set('max_delivery_radius_km', parseFloat(e.target.value))} className={inputCls} />
              </div>
            </div>
          </div>

          {/* Support */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-card space-y-4">
            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Support Contact</h2>
            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-1.5 flex items-center gap-1"><Phone size={11} /> Support Phone</label>
              <input type="tel" value={settings.support_phone} placeholder="+91 XXXXX XXXXX"
                onChange={e => set('support_phone', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-1.5 flex items-center gap-1"><Mail size={11} /> Support Email</label>
              <input type="email" value={settings.support_email} placeholder="support@nikato.in"
                onChange={e => set('support_email', e.target.value)} className={inputCls} />
            </div>
          </div>

          {/* Maintenance mode */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-card">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-gray-900">Maintenance Mode</h2>
                <p className="text-xs text-gray-400 mt-0.5">Temporarily disable the customer-facing app</p>
              </div>
              <button
                onClick={() => set('maintenance_mode', !settings.maintenance_mode)}
                className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${settings.maintenance_mode ? 'bg-red-500' : 'bg-gray-200'}`}>
                <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${settings.maintenance_mode ? 'translate-x-6' : 'translate-x-0.5'}`} />
              </button>
            </div>
            {settings.maintenance_mode && (
              <div className="mt-3 flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-xl text-xs font-medium">
                <AlertTriangle size={14} /> Maintenance mode is ON — customers cannot place orders
              </div>
            )}
          </div>

          {/* Environment (read-only) */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-card space-y-3">
            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Environment</h2>
            {[
              { label: 'Supabase URL', value: process.env.NEXT_PUBLIC_SUPABASE_URL ?? '—' },
              { label: 'App URL', value: process.env.NEXT_PUBLIC_APP_URL ?? '—' },
              { label: 'Razorpay Key', value: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ? '••••••' : 'Not set' },
              { label: 'Service Role Key', value: '••••••' },
            ].map(row => (
              <div key={row.label} className="flex justify-between text-sm">
                <span className="text-gray-400">{row.label}</span>
                <span className="font-mono text-xs text-gray-700 truncate max-w-xs">{row.value}</span>
              </div>
            ))}
          </div>

          <button onClick={save} disabled={saving}
            className="w-full py-3.5 rounded-2xl font-bold text-white text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-60"
            style={{ background: '#7ED957', boxShadow: '0 4px 16px rgba(126,217,87,0.3)' }}>
            {saving ? <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" /> : <><Save size={15} /> Save Settings</>}
          </button>
        </div>
      )}
    </div>
  );
}
