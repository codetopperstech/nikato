'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, MapPin, Star, Briefcase, Phone, ChevronRight } from 'lucide-react';
import { Skeleton } from '@/components/ui';

const SERVICE_META: Record<string, { label: string; emoji: string; color: string; desc: string }> = {
  plumber:      { label: 'Plumber',      emoji: '🔧', color: '#3B82F6', desc: 'Fix leaks, pipes, taps & more' },
  electrician:  { label: 'Electrician',  emoji: '⚡', color: '#F59E0B', desc: 'Wiring, switches, fittings & repairs' },
  beautician:   { label: 'Beautician',   emoji: '💅', color: '#EC4899', desc: 'Hair, skin, makeup & grooming' },
  carpenter:    { label: 'Carpenter',    emoji: '🪚', color: '#8B5CF6', desc: 'Furniture, woodwork & repairs' },
  painter:      { label: 'Painter',      emoji: '🎨', color: '#7ED957', desc: 'Interior, exterior & texture painting' },
  'pest-control': { label: 'Pest Control', emoji: '🪲', color: '#EF4444', desc: 'Cockroach, termite, rodent & more' },
};

export default function ServiceProvidersPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.service as string;
  const meta = SERVICE_META[slug];

  const [providers, setProviders] = useState<any[]>([]);
  const [price, setPrice] = useState<number | null>(null);
  const [unit, setUnit] = useState('visit');
  const [city, setCity] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async (detectedCity = '') => {
      setLoading(true);
      const params_ = new URLSearchParams({ service: slug });
      if (detectedCity) params_.set('city', detectedCity);
      const res = await fetch(`/api/services/providers?${params_}`);
      const d = await res.json();
      setProviders(d.providers ?? []);
      setPrice(d.price);
      setUnit(d.unit ?? 'visit');
      setLoading(false);
    };

    if (navigator?.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async ({ coords }) => {
          try {
            const geo = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${coords.latitude}&lon=${coords.longitude}&format=json`).then(r => r.json()).catch(() => null);
            const detected = geo?.address?.city || geo?.address?.town || geo?.address?.suburb || '';
            setCity(detected);
            load(detected);
          } catch { load(); }
        },
        () => load(),
        { timeout: 4000 }
      );
    } else { load(); }
  }, [slug]);

  if (!meta) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#F9FBF8' }}>
      <div className="text-center"><div className="text-5xl mb-3">🔍</div><p className="font-bold text-gray-700">Service not found</p><Link href="/" className="text-sm mt-3 inline-block" style={{ color: '#5cb83a' }}>Go home</Link></div>
    </div>
  );

  return (
    <div className="min-h-screen pb-24" style={{ background: '#F9FBF8' }}>
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.back()} className="w-9 h-9 rounded-xl flex items-center justify-center border border-gray-200 bg-white active:scale-95 transition-transform">
          <ArrowLeft size={18} className="text-gray-600" />
        </button>
        <div className="flex items-center gap-2">
          <span className="text-xl">{meta.emoji}</span>
          <div>
            <h1 className="font-black text-gray-900 text-base leading-tight">{meta.label}</h1>
            <p className="text-[11px] text-gray-400">{meta.desc}</p>
          </div>
        </div>
      </div>

      {/* Hero banner */}
      <div className="px-4 pt-4">
        <div className="max-w-lg mx-auto rounded-2xl p-4 flex items-center gap-4 relative overflow-hidden"
          style={{ background: meta.color + '15', border: `1.5px solid ${meta.color}30` }}>
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0 bg-white shadow-sm">{meta.emoji}</div>
          <div className="flex-1">
            <p className="font-black text-gray-900">{meta.label} Services</p>
            <p className="text-xs text-gray-500 mt-0.5">{meta.desc}</p>
            {price !== null && (
              <p className="text-sm font-black mt-1.5" style={{ color: meta.color }}>
                Starting ₹{price} <span className="text-xs font-normal text-gray-400">/ {unit}</span>
              </p>
            )}
          </div>
          {city && (
            <div className="flex-shrink-0 flex items-center gap-1 text-[10px] font-semibold text-gray-500 bg-white px-2 py-1 rounded-full border border-gray-100">
              <MapPin size={9} /> {city}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-black text-gray-900">Available Professionals</h2>
          {city && <p className="text-xs text-gray-400 flex items-center gap-1"><MapPin size={10} />{city}</p>}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-2xl p-4 border border-gray-100">
                <div className="flex gap-3">
                  <Skeleton className="w-12 h-12 rounded-xl" />
                  <div className="flex-1 space-y-2"><Skeleton className="h-3 w-1/2" /><Skeleton className="h-3 w-1/3" /></div>
                </div>
              </div>
            ))}
          </div>
        ) : providers.length === 0 ? (
          <div className="text-center py-14 bg-white rounded-2xl border border-gray-100">
            <div className="text-5xl mb-3">{meta.emoji}</div>
            <p className="font-bold text-gray-700">No providers available{city ? ` in ${city}` : ''}</p>
            <p className="text-sm text-gray-400 mt-1 mb-5">We're adding more professionals. Book anyway and we'll arrange one for you.</p>
            <Link href={`/services/book?service=${slug}`}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-white text-sm"
              style={{ background: '#7ED957' }}>
              Book {meta.label} <ChevronRight size={14} />
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {providers.map(p => (
              <div key={p.id} className="bg-white rounded-2xl border border-gray-100 p-4">
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl flex-shrink-0 font-black text-white"
                    style={{ background: meta.color }}>
                    {p.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-black text-gray-900 truncate">{p.name}</p>
                      <span className="flex-shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{ background: '#7ED95720', color: '#3a7a1f' }}>
                        ✓ Available
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      <span className="flex items-center gap-0.5 text-xs text-gray-500">
                        <Star size={11} fill="#F59E0B" stroke="none" />{p.rating}
                      </span>
                      <span className="flex items-center gap-0.5 text-xs text-gray-500">
                        <Briefcase size={11} />{p.experience_years}yr exp
                      </span>
                      <span className="text-xs text-gray-500">{p.jobs_done} jobs done</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                      <MapPin size={10} />{p.city}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
                  {price !== null ? (
                    <p className="font-black text-base" style={{ color: meta.color }}>
                      ₹{price} <span className="text-xs font-normal text-gray-400">/ {unit}</span>
                    </p>
                  ) : <div />}
                  <div className="flex gap-2">
                    <a href={`tel:${p.phone}`}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 active:scale-95 transition-transform">
                      <Phone size={13} /> Call
                    </a>
                    <Link href={`/services/book?service=${slug}&provider_id=${p.id}&provider_name=${encodeURIComponent(p.name)}`}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white active:scale-95 transition-transform"
                      style={{ background: '#7ED957' }}>
                      Book Now <ChevronRight size={13} />
                    </Link>
                  </div>
                </div>
              </div>
            ))}

            {/* Book without specific provider */}
            <Link href={`/services/book?service=${slug}`}
              className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl border-[1.5px] border-dashed border-gray-300 text-sm font-bold text-gray-500 hover:border-[#7ED957] hover:text-[#5cb83a] transition-all">
              Book any available {meta.label}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
