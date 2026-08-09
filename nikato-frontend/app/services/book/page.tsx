'use client';
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, CheckCircle, Loader2, User, ChevronRight } from 'lucide-react';

const SERVICES = [
  { label: 'Plumber',      slug: 'plumber',      emoji: '🔧' },
  { label: 'Electrician',  slug: 'electrician',  emoji: '⚡' },
  { label: 'Beautician',   slug: 'beautician',   emoji: '💅' },
  { label: 'Carpenter',    slug: 'carpenter',    emoji: '🪚' },
  { label: 'Painter',      slug: 'painter',      emoji: '🎨' },
  { label: 'Pest Control', slug: 'pest-control', emoji: '🪲' },
];

function BookForm() {
  const params = useSearchParams();
  const router = useRouter();

  const [service,      setService]      = useState(params.get('service')       || 'plumber');
  const [providerId,   setProviderId]   = useState(params.get('provider_id')   || '');
  const [providerName, setProviderName] = useState(params.get('provider_name') || '');
  const [price,        setPrice]        = useState<number | null>(null);
  const [unit,         setUnit]         = useState('visit');
  const [name,         setName]         = useState('');
  const [phone,        setPhone]        = useState('');
  const [address,      setAddress]      = useState('');
  const [date,         setDate]         = useState('');
  const [time,         setTime]         = useState('');
  const [notes,        setNotes]        = useState('');
  const [loading,      setLoading]      = useState(false);
  const [success,      setSuccess]      = useState(false);
  const [error,        setError]        = useState('');

  const today = new Date().toISOString().split('T')[0];

  // Fetch price whenever service changes
  useEffect(() => {
    fetch(`/api/services/providers?service=${service}`)
      .then(r => r.json())
      .then(d => { setPrice(d.price); setUnit(d.unit ?? 'visit'); })
      .catch(() => {});
  }, [service]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/services/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, address, service_type: service, scheduled_date: date, scheduled_time: time, notes, provider_id: providerId || undefined }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Failed to book');
      setSuccess(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6" style={{ background: '#F9FBF8' }}>
      <div className="w-20 h-20 rounded-full flex items-center justify-center mb-5" style={{ background: '#7ED95720' }}>
        <CheckCircle size={40} style={{ color: '#5cb83a' }} />
      </div>
      <h2 className="text-2xl font-black text-gray-900 mb-2">Booking Confirmed!</h2>
      <p className="text-sm text-gray-500 text-center mb-2 max-w-xs">Our team will call you shortly to confirm your appointment.</p>
      <p className="text-xs text-gray-400 text-center mb-8">Please keep your phone reachable on <span className="font-bold text-gray-600">{phone}</span>.</p>
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
        <button onClick={() => router.back()} className="w-9 h-9 rounded-xl flex items-center justify-center border border-gray-200 bg-white active:scale-95 transition-transform">
          <ArrowLeft size={18} className="text-gray-600" />
        </button>
        <div>
          <h1 className="font-black text-gray-900 text-base leading-tight">Book a Home Service</h1>
          <p className="text-[11px] text-gray-400">Professional help at your doorstep</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-5">

        {/* Provider pill (if pre-selected) */}
        {providerName && (
          <div className="flex items-center gap-3 bg-white rounded-2xl p-3.5 border border-gray-100">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-black text-sm flex-shrink-0" style={{ background: '#7ED957' }}>
              {providerName.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <p className="text-xs text-gray-400">Selected professional</p>
              <p className="font-bold text-gray-900 text-sm">{providerName}</p>
            </div>
            <button onClick={() => { setProviderId(''); setProviderName(''); }} className="text-xs text-gray-400 hover:text-gray-600">Change</button>
          </div>
        )}

        {/* Service selector */}
        <div>
          <label className={labelCls}>Select Service</label>
          <div className="grid grid-cols-3 gap-2">
            {SERVICES.map(({ label, slug, emoji }) => (
              <button key={slug} type="button" onClick={() => setService(slug)}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-[1.5px] transition-all active:scale-95 ${service === slug ? 'border-[#7ED957] bg-[#7ED95712] shadow-sm' : 'border-gray-200 bg-white'}`}>
                <span className="text-2xl">{emoji}</span>
                <span className="text-[11px] font-semibold text-gray-700 leading-tight text-center">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Price display */}
        {price !== null && (
          <div className="flex items-center justify-between bg-white rounded-xl px-4 py-3 border border-gray-100">
            <p className="text-sm text-gray-500 font-medium">Service charge</p>
            <p className="font-black text-gray-900">₹{price} <span className="text-xs font-normal text-gray-400">/ {unit}</span></p>
          </div>
        )}

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className={labelCls}>Your Name</label>
            <input required value={name} onChange={e => setName(e.target.value)} placeholder="Full name" className={inputCls} />
          </div>

          <div>
            <label className={labelCls}>Phone Number</label>
            <input required type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 9999999999" className={inputCls} />
          </div>

          <div>
            <label className={labelCls}>Service Address</label>
            <textarea required value={address} onChange={e => setAddress(e.target.value)}
              placeholder="Full address where service is needed" rows={2} className={inputCls + ' resize-none'} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Date</label>
              <input required type="date" value={date} min={today} onChange={e => setDate(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Time</label>
              <input required type="time" value={time} onChange={e => setTime(e.target.value)} className={inputCls} />
            </div>
          </div>

          <div>
            <label className={labelCls}>Additional Notes <span className="text-gray-400 font-normal normal-case">(optional)</span></label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)}
              placeholder="Describe the issue or any special requirements..." rows={3} className={inputCls + ' resize-none'} />
          </div>

          {!providerName && (
            <Link href={`/services/${service}`}
              className="flex items-center justify-between w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-600 hover:border-[#7ED957] transition-colors">
              <span className="flex items-center gap-2"><User size={15} /> Browse & choose a professional</span>
              <ChevronRight size={15} />
            </Link>
          )}

          {error && (
            <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-100">
              <p className="text-sm text-red-600 font-medium">{error}</p>
            </div>
          )}

          <button type="submit" disabled={loading}
            className="w-full py-4 rounded-xl font-bold text-white text-sm transition-all hover:opacity-90 active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2"
            style={{ background: '#7ED957', boxShadow: '0 4px 16px rgba(126,217,87,0.35)' }}>
            {loading ? <><Loader2 size={16} className="animate-spin" /> Booking...</> : `Confirm Booking${price !== null ? ` · ₹${price}` : ''}`}
          </button>
        </form>

        <div className="flex items-center gap-3 bg-white rounded-2xl p-4 border border-gray-100">
          <div className="text-2xl">🛡️</div>
          <div>
            <p className="text-xs font-bold text-gray-800">Verified Professionals</p>
            <p className="text-[11px] text-gray-400 mt-0.5">All our service providers are background-checked and trained.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BookServicePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#F9FBF8' }}>
        <Loader2 size={28} className="animate-spin" style={{ color: '#7ED957' }} />
      </div>
    }>
      <BookForm />
    </Suspense>
  );
}
