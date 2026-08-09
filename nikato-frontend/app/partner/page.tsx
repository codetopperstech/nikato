'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle, Loader2, Store } from 'lucide-react';

const BUSINESS_TYPES = ['Grocery', 'Restaurant / Food', 'Bakery', 'Pharmacy', 'Dairy', 'Stationery', 'Beverages', 'Other'];

export default function PartnerPage() {
  const router = useRouter();
  const [form, setForm] = useState({ shop_name: '', owner_name: '', phone: '', city: '', business_type: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/partner/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Submission failed');
      setSuccess(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  if (success) return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center" style={{ background: '#F9FBF8' }}>
      <div className="w-20 h-20 rounded-full flex items-center justify-center mb-5" style={{ background: '#7ED95720' }}>
        <CheckCircle size={40} style={{ color: '#5cb83a' }} />
      </div>
      <h2 className="text-2xl font-black text-gray-900 mb-2">Request Submitted!</h2>
      <p className="text-sm text-gray-500 mb-1 max-w-xs">Our team has been notified and will reach out to you shortly.</p>
      <p className="text-xs text-gray-400 mb-8">Expect a call on <span className="font-bold text-gray-600">{form.phone}</span> within 24 hours.</p>
      <Link href="/" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white text-sm"
        style={{ background: '#7ED957', boxShadow: '0 4px 16px rgba(126,217,87,0.35)' }}>
        Back to Home
      </Link>
    </div>
  );

  const inputCls = "w-full px-4 py-3 rounded-xl border-[1.5px] border-gray-200 text-sm font-medium bg-white focus:outline-none focus:border-[#7ED957] transition-colors";
  const labelCls = "text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block";

  return (
    <div className="min-h-screen pb-24" style={{ background: '#F9FBF8' }}>
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.back()}
          className="w-9 h-9 rounded-xl flex items-center justify-center border border-gray-200 bg-white active:scale-95 transition-transform">
          <ArrowLeft size={18} className="text-gray-600" />
        </button>
        <div>
          <h1 className="font-black text-gray-900 text-base leading-tight">Partner with Nikato</h1>
          <p className="text-[11px] text-gray-400">List your shop and reach more customers</p>
        </div>
      </div>

      {/* Hero banner */}
      <div className="px-4 pt-5">
        <div className="max-w-lg mx-auto rounded-2xl p-5 relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #7ED957 0%, #5cb83a 100%)' }}>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-7xl opacity-10 select-none">🏪</div>
          <Store size={28} className="text-white mb-2" />
          <p className="text-white font-black text-lg leading-tight">Grow your business<br />with Nikato</p>
          <p className="text-white/70 text-xs mt-1.5">Join 500+ local shops already earning more with us.</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className={labelCls}>Shop / Business Name</label>
            <input required value={form.shop_name} onChange={set('shop_name')}
              placeholder="e.g. Sharma General Store" className={inputCls} />
          </div>

          <div>
            <label className={labelCls}>Owner Name</label>
            <input required value={form.owner_name} onChange={set('owner_name')}
              placeholder="Your full name" className={inputCls} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Phone Number</label>
              <input required type="tel" value={form.phone} onChange={set('phone')}
                placeholder="+91 9999999999" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>City</label>
              <input required value={form.city} onChange={set('city')}
                placeholder="Your city" className={inputCls} />
            </div>
          </div>

          <div>
            <label className={labelCls}>Business Type</label>
            <select required value={form.business_type} onChange={set('business_type')} className={inputCls}>
              <option value="">Select type…</option>
              {BUSINESS_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div>
            <label className={labelCls}>
              Tell us more <span className="text-gray-400 font-normal normal-case">(optional)</span>
            </label>
            <textarea value={form.message} onChange={set('message')}
              placeholder="Anything you'd like us to know about your shop..."
              rows={3} className={inputCls + ' resize-none'} />
          </div>

          {error && (
            <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-100">
              <p className="text-sm text-red-600 font-medium">{error}</p>
            </div>
          )}

          <button type="submit" disabled={loading}
            className="w-full py-4 rounded-xl font-bold text-white text-sm transition-all hover:opacity-90 active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2"
            style={{ background: '#7ED957', boxShadow: '0 4px 16px rgba(126,217,87,0.35)' }}>
            {loading ? <><Loader2 size={16} className="animate-spin" /> Submitting...</> : 'Submit Application'}
          </button>
        </form>

        {/* Benefits */}
        <div className="space-y-2.5">
          {[
            { emoji: '📦', text: 'We handle delivery — you just prepare orders' },
            { emoji: '💸', text: 'Get paid directly to your bank account' },
            { emoji: '📊', text: 'Real-time order & sales dashboard' },
          ].map(({ emoji, text }) => (
            <div key={text} className="flex items-center gap-3 bg-white rounded-xl p-3.5 border border-gray-100">
              <span className="text-xl">{emoji}</span>
              <p className="text-xs font-semibold text-gray-700">{text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
