'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

const SERVICES = [
  { label: 'Plumber',      slug: 'plumber',      emoji: '🔧', color: '#3B82F6', desc: 'Leaks, pipes & taps' },
  { label: 'Electrician',  slug: 'electrician',  emoji: '⚡', color: '#F59E0B', desc: 'Wiring & fittings' },
  { label: 'Beautician',   slug: 'beautician',   emoji: '💅', color: '#EC4899', desc: 'Hair, skin & makeup' },
  { label: 'Carpenter',    slug: 'carpenter',    emoji: '🪚', color: '#8B5CF6', desc: 'Furniture & woodwork' },
  { label: 'Painter',      slug: 'painter',      emoji: '🎨', color: '#7ED957', desc: 'Interior & exterior' },
  { label: 'Pest Control', slug: 'pest-control', emoji: '🪲', color: '#EF4444', desc: 'Cockroach & more' },
];

export default function ServicesPage() {
  const router = useRouter();
  return (
    <div className="min-h-screen pb-20" style={{ background: '#F9FBF8' }}>
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.back()} className="w-9 h-9 rounded-xl flex items-center justify-center border border-gray-200 bg-white active:scale-95 transition-transform">
          <ArrowLeft size={18} className="text-gray-600" />
        </button>
        <div>
          <h1 className="font-black text-gray-900 text-base">Home Services</h1>
          <p className="text-[11px] text-gray-400">Book a professional at your doorstep</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6">
        <div className="grid grid-cols-2 gap-4">
          {SERVICES.map(({ label, slug, emoji, color, desc }) => (
            <Link key={slug} href={`/services/${slug}`}
              className="flex flex-col gap-3 p-5 rounded-2xl border border-gray-100 bg-white hover:shadow-md hover:border-opacity-50 transition-all active:scale-[0.98]"
              style={{ borderColor: color + '30' }}>
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl" style={{ background: color + '15' }}>
                {emoji}
              </div>
              <div>
                <p className="font-black text-gray-900">{label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
              </div>
              <span className="text-xs font-bold self-start px-2.5 py-1 rounded-full text-white" style={{ background: color }}>
                View providers →
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
