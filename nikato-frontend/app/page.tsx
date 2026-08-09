'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { MapPin, ArrowRight, Zap, Shield, ChevronRight, ShoppingBag, Bike, Star } from 'lucide-react';
import { ShopCard } from '@/components/shop/ShopCard';
import { Skeleton } from '@/components/ui';
import type { Shop } from '@/types';

const SERVICES = [
  { label: 'Plumber',      slug: 'plumber',      emoji: '🔧', color: '#3B82F6' },
  { label: 'Electrician',  slug: 'electrician',  emoji: '⚡', color: '#F59E0B' },
  { label: 'Beautician',   slug: 'beautician',   emoji: '💅', color: '#EC4899' },
  { label: 'Carpenter',    slug: 'carpenter',    emoji: '🪚', color: '#8B5CF6' },
  { label: 'Painter',      slug: 'painter',      emoji: '🎨', color: '#7ED957' },
  { label: 'Pest Control', slug: 'pest-control', emoji: '🪲', color: '#EF4444' },
];

const CATEGORIES = [
  { label: 'Grocery', emoji: '🛒', q: 'grocery' },
  { label: 'Hot Food', emoji: '🍱', q: 'food' },
  { label: 'Bakery', emoji: '🥐', q: 'bakery' },
  { label: 'Pharmacy', emoji: '💊', q: 'pharmacy' },
  { label: 'Beverages', emoji: '🧃', q: 'beverages' },
  { label: 'Dairy', emoji: '🥛', q: 'dairy' },
  { label: 'Snacks', emoji: '🍿', q: 'snacks' },
  { label: 'Stationery', emoji: '📦', q: 'stationery' },
];

const HOW_IT_WORKS = [
  { step: '01', icon: MapPin, title: 'Pick a nearby shop', desc: 'Browse shops open right now within your neighbourhood.', color: '#7ED957' },
  { step: '02', icon: ShoppingBag, title: 'Add items to cart', desc: 'Fresh groceries, hot meals — choose what you need.', color: '#7CCBFF' },
  { step: '03', icon: Bike, title: 'Track live delivery', desc: 'A local rider picks up and delivers in under 30 mins.', color: '#7ED957' },
];

export default function HomePage() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [city, setCity] = useState('');
  const howRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const load = async (lat: number, lng: number, radius = 5) => {
      try {
        if (lat !== 0) {
          const geo = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`).then(r => r.json()).catch(() => null);
          const suburb = geo?.address?.suburb || geo?.address?.neighbourhood || geo?.address?.city_district || '';
          const cityName = geo?.address?.city || geo?.address?.town || '';
          setCity(suburb || cityName);
        }
      } catch { /* silent */ }
      const res = await fetch('/api/shops/nearby', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ lat, lng, radius_km: radius }) });
      const d = await res.json();
      setShops((d.shops ?? []).slice(0, 6));
      setLoading(false);
    };
    if (navigator?.geolocation) {
      navigator.geolocation.getCurrentPosition(
        ({ coords }) => load(coords.latitude, coords.longitude),
        () => load(0, 0, 9999),
        { timeout: 5000 }
      );
    } else { load(0, 0, 9999); }
  }, []);

  return (
    <div className="min-h-screen pb-20" style={{ background: '#F9FBF8' }}>

      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="px-4 pt-10 pb-14 relative overflow-hidden" style={{ background: 'linear-gradient(160deg, #f0fce8 0%, #e8f6ff 100%)' }}>
        {/* Decorative blobs */}
        <div className="absolute -right-20 -top-20 w-72 h-72 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, #7ED95740 0%, transparent 65%)' }} />
        <div className="absolute -left-12 bottom-0 w-56 h-56 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, #7CCBFF30 0%, transparent 65%)' }} />

        <div className="max-w-lg mx-auto relative">
          {city ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold mb-5 bg-white border border-gray-200 text-gray-600 shadow-sm">
              <MapPin size={11} style={{ color: '#5cb83a' }} /> Delivering to: <span className="text-gray-900 font-bold">{city}</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold mb-5" style={{ background: '#7ED957', color: 'white' }}>
              <Zap size={12} /> Delivery in 30 mins
            </div>
          )}

          <h1 className="text-4xl font-black text-gray-900 leading-tight mb-3">
            Your neighbourhood,<br />
            <span style={{ color: '#5cb83a' }}>delivered fast</span>
          </h1>
          <p className="text-gray-500 text-sm mb-4 leading-relaxed">
            Fresh groceries, hot food, and daily essentials from shops right around you.
          </p>

          {/* Inline trust signals */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex items-center gap-1">
              {[1,2,3,4,5].map(i => <Star key={i} size={12} fill="#F59E0B" stroke="none" />)}
              <span className="text-xs font-bold text-gray-700 ml-1">4.8</span>
            </div>
            <div className="w-px h-3.5 bg-gray-300" />
            <span className="text-xs font-semibold text-gray-500">500+ happy customers</span>
            <div className="w-px h-3.5 bg-gray-300" />
            <span className="text-xs font-semibold text-gray-500">⚡ 30 min</span>
          </div>

          <div className="flex flex-wrap gap-3 mb-6">
            <Link href="/shops"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white text-sm transition-all hover:opacity-90 active:scale-95"
              style={{ background: '#7ED957', boxShadow: '0 4px 16px rgba(126,217,87,0.35)' }}>
              Browse shops near you <ArrowRight size={16} />
            </Link>
            <button
              onClick={() => howRef.current?.scrollIntoView({ behavior: 'smooth' })}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm border-[1.5px] border-gray-300 bg-white text-gray-700 hover:border-gray-400 transition-all active:scale-95">
              How it works
            </button>
          </div>

          {/* Floating live card */}
          <div className="inline-flex items-center gap-3 bg-white rounded-2xl px-4 py-3 shadow-md border border-gray-100">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xl flex-shrink-0" style={{ background: '#7ED95715' }}>🛵</div>
            <div>
              <p className="text-xs font-black text-gray-900 leading-tight">Riders ready near you</p>
              <p className="text-[10px] text-gray-400 mt-0.5">Fast delivery available right now</p>
            </div>
            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0 animate-pulse" style={{ background: '#7ED957' }} />
          </div>
        </div>
      </section>

      {/* ── Category chips ───────────────────────────────── */}
      <section className="py-4 bg-white border-b border-gray-100">
        <div className="flex gap-2 px-4 overflow-x-auto no-scrollbar">
          {CATEGORIES.map(({ label, emoji, q }) => (
            <Link key={label} href={`/shops?q=${q}`}
              className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full border-[1.5px] border-gray-200 bg-white text-sm font-semibold text-gray-700 hover:border-[#7ED957] hover:text-[#5cb83a] transition-all whitespace-nowrap">
              <span>{emoji}</span> {label}
            </Link>
          ))}
        </div>
      </section>

      {/* ── Home Services ────────────────────────────────── */}
      <section className="px-4 py-6 bg-white border-b border-gray-100">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-black text-gray-900">Home Services</h2>
              <p className="text-xs text-gray-400 mt-0.5">Book a professional, at your doorstep</p>
            </div>
            <Link href="/services/book" className="text-sm font-semibold flex items-center gap-1" style={{ color: '#5cb83a' }}>
              Book now <ArrowRight size={14} />
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {SERVICES.map(({ label, slug, emoji, color }) => (
              <Link key={slug} href={`/services/book?service=${slug}`}
                className="flex flex-col items-center gap-2 p-4 rounded-2xl border border-gray-100 bg-white hover:border-[#7ED957] hover:shadow-sm transition-all active:scale-95">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl" style={{ background: color + '15' }}>
                  {emoji}
                </div>
                <span className="text-xs font-semibold text-gray-700 text-center leading-tight">{label}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Promo banner ─────────────────────────────────── */}
      <section className="px-4 pt-5">
        <div className="max-w-lg mx-auto">
          <div className="relative rounded-2xl overflow-hidden p-5"
            style={{ background: 'linear-gradient(135deg, #7ED957 0%, #5cb83a 100%)' }}>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-6xl opacity-20 select-none">🛵</div>
            <p className="text-xs font-bold text-white/80 uppercase tracking-wider mb-1">Limited time</p>
            <p className="text-xl font-black text-white leading-tight">Free delivery on<br />your first order</p>
            <Link href="/shops"
              className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white text-sm font-bold transition-all hover:opacity-90 active:scale-95"
              style={{ color: '#5cb83a' }}>
              Order now <ChevronRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Features strip ───────────────────────────────── */}
      <section className="px-4 py-4 mt-5 bg-white border-y border-gray-100">
        <div className="max-w-lg mx-auto grid grid-cols-3 gap-3">
          {[
            { icon: Zap, label: '30 min delivery', color: '#7ED957' },
            { icon: MapPin, label: 'Live tracking', color: '#7CCBFF' },
            { icon: Shield, label: 'Safe & trusted', color: '#7ED957' },
          ].map(({ icon: Icon, label, color }) => (
            <div key={label} className="flex flex-col items-center gap-1.5 py-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: color + '20' }}>
                <Icon size={18} style={{ color }} />
              </div>
              <span className="text-xs font-semibold text-gray-600 text-center leading-tight">{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Nearby shops ─────────────────────────────────── */}
      <section className="px-4 py-6">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-black text-gray-900">Shops Near You</h2>
              <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1"><MapPin size={10} />Within 5 km</p>
            </div>
            <Link href="/shops" className="text-sm font-semibold flex items-center gap-1" style={{ color: '#5cb83a' }}>
              See all <ArrowRight size={14} />
            </Link>
          </div>
          {loading ? (
            <div className="grid grid-cols-2 gap-3">
              {[1,2,3,4].map(i => (
                <div key={i} className="bg-white rounded-2xl overflow-hidden border border-gray-100">
                  <Skeleton className="h-36 w-full rounded-none" />
                  <div className="p-3 space-y-2"><Skeleton className="h-3 w-3/4" /><Skeleton className="h-3 w-1/2" /></div>
                </div>
              ))}
            </div>
          ) : shops.length === 0 ? (
            <div className="text-center py-14 bg-white rounded-2xl border border-gray-100">
              <div className="text-5xl mb-3">🏪</div>
              <p className="text-gray-700 font-bold text-base">No shops nearby yet</p>
              <p className="text-sm text-gray-400 mt-1 mb-5 max-w-xs mx-auto">We're growing fast! New shops are being added in your area.</p>
              <Link href="/shops"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-white text-sm"
                style={{ background: '#7ED957' }}>
                Browse all shops <ArrowRight size={14} />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {shops.map(shop => <ShopCard key={shop.id} shop={shop} />)}
            </div>
          )}
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────── */}
      <section ref={howRef} className="px-4 py-8" style={{ background: 'linear-gradient(160deg, #f0fce8 0%, #e8f6ff 100%)' }}>
        <div className="max-w-lg mx-auto">
          <h2 className="text-xl font-black text-gray-900 mb-1">How it works</h2>
          <p className="text-sm text-gray-500 mb-6">Order in 3 easy steps</p>
          <div className="space-y-4">
            {HOW_IT_WORKS.map(({ step, icon: Icon, title, desc, color }) => (
              <div key={step} className="flex gap-4 bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: color + '20' }}>
                  <Icon size={20} style={{ color }} />
                </div>
                <div>
                  <span className="text-[10px] font-black text-gray-300 tracking-widest">{step}</span>
                  <p className="font-bold text-gray-900 text-sm">{title}</p>
                  <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Trust strip ──────────────────────────────────── */}
      <section className="px-4 py-6 bg-white border-t border-gray-100">
        <div className="max-w-lg mx-auto grid grid-cols-3 gap-4 text-center">
          {[
            { value: '500+', label: 'Happy customers', icon: '😊' },
            { value: '4.8★', label: 'Average rating', icon: '⭐' },
            { value: '30 min', label: 'Avg delivery time', icon: '⚡' },
          ].map(({ value, label, icon }) => (
            <div key={label}>
              <div className="text-2xl mb-1">{icon}</div>
              <p className="text-lg font-black text-gray-900">{value}</p>
              <p className="text-xs text-gray-400">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Partner CTA strip ────────────────────────────── */}
      <section className="px-4 py-5 bg-gray-900">
        <div className="max-w-lg mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="font-bold text-white text-sm">Own a local shop?</p>
            <p className="text-xs text-gray-400 mt-0.5">Join nikato and reach customers near you</p>
          </div>
          <Link href="/login"
            className="flex-shrink-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all hover:opacity-90"
            style={{ background: '#7ED957', color: 'white' }}>
            Partner with us <ArrowRight size={14} />
          </Link>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────── */}
      <footer className="px-4 py-8 bg-gray-950">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: '#7ED957' }}>
              <span className="text-white text-sm font-black">N</span>
            </div>
            <span className="text-white font-black text-lg">nikato</span>
          </div>
          <p className="text-gray-400 text-xs mb-6 leading-relaxed">
            Your neighbourhood, delivered fast. Fresh groceries, hot food, and daily essentials from local shops.
          </p>
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-3">Company</p>
              <div className="space-y-2">
                {['About us', 'Careers', 'Blog'].map(l => (
                  <Link key={l} href="#" className="block text-gray-400 text-sm hover:text-white transition-colors">{l}</Link>
                ))}
              </div>
            </div>
            <div>
              <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-3">Partner</p>
              <div className="space-y-2">
                {['Sell on nikato', 'Deliver with us', 'Advertise'].map(l => (
                  <Link key={l} href="#" className="block text-gray-400 text-sm hover:text-white transition-colors">{l}</Link>
                ))}
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-4 flex flex-wrap gap-4 justify-between items-center">
            <p className="text-gray-600 text-xs">© 2025 Nikato. All rights reserved.</p>
            <div className="flex gap-4">
              {['Privacy Policy', 'Terms of Use'].map(l => (
                <Link key={l} href="#" className="text-gray-600 text-xs hover:text-gray-400 transition-colors">{l}</Link>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
