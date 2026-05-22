'use client';
import { useState } from 'react';
import { useShopStore } from '@/store/shop';
import { toast } from '@/store/ui';

export function OpenCloseToggle() {
  const { shopData, isOpen, setIsOpen } = useShopStore();
  const [loading, setLoading] = useState(false);

  async function toggle() {
    if (!shopData || loading) return;
    const next = !isOpen;
    setLoading(true);
    setIsOpen(next);
    try {
      const res = await fetch('/api/shop/toggle', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ is_open: next }) });
      const data = await res.json();
      if (!res.ok) { setIsOpen(!next); toast.error(data.error ?? 'Failed to update'); }
      else { setIsOpen(data.is_open); toast.success(data.is_open ? '✅ Shop is now Open' : '🔴 Shop is now Closed'); }
    } catch { setIsOpen(!next); toast.error('Network error. Retry.'); }
    setLoading(false);
  }

  return (
    <button onClick={toggle} disabled={loading}
      className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl transition-all border-[1.5px] ${isOpen ? 'border-brand/30' : 'border-gray-200 bg-white'} ${loading ? 'opacity-60 pointer-events-none' : ''}`}
      style={isOpen ? { background: 'linear-gradient(135deg, #edfbdc 0%, #d4f7b4 100%)' } : {}}>
      <div className="flex items-center gap-3">
        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${isOpen ? 'border-brand-dark' : 'border-gray-300'}`}>
          {isOpen && <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#7ED957' }} />}
        </div>
        <div className="text-left">
          <p className="text-sm font-bold text-gray-900">{loading ? 'Updating…' : isOpen ? 'Shop is Open' : 'Shop is Closed'}</p>
          <p className="text-xs text-gray-400">{isOpen ? 'Accepting orders' : 'Not accepting orders'}</p>
        </div>
      </div>
      <div className={`relative w-12 h-6 rounded-full transition-all ${isOpen ? '' : 'bg-gray-200'}`} style={isOpen ? { background: '#7ED957' } : {}}>
        <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${isOpen ? 'translate-x-6' : 'translate-x-0.5'}`} />
      </div>
    </button>
  );
}
