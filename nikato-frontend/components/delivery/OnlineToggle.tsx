'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/store/auth';
import { useDeliveryStore } from '@/store/delivery';
import { toast } from '@/store/ui';

export function OnlineToggle() {
  const { user } = useAuthStore();
  const { isOnline, setOnline } = useDeliveryStore();
  const [loading, setLoading] = useState(false);

  async function toggle() {
    if (!user) return;
    setLoading(true);
    const next = !isOnline;
    const { error } = await supabase.from('delivery_locations').upsert(
      { delivery_partner_id: user.id, lat: 0, lng: 0, is_online: next, updated_at: new Date().toISOString() },
      { onConflict: 'delivery_partner_id' }
    );
    if (error) { toast.error('Failed to update status', error.message); }
    else {
      setOnline(next);
      toast.success(next ? '🟢 You are Online' : '🔴 You are Offline');
      if (next && navigator?.geolocation) {
        navigator.geolocation.getCurrentPosition(async ({ coords }) => {
          await supabase.from('delivery_locations').upsert({ delivery_partner_id: user.id, lat: coords.latitude, lng: coords.longitude, is_online: true, updated_at: new Date().toISOString() }, { onConflict: 'delivery_partner_id' });
        }, () => {});
      }
    }
    setLoading(false);
  }

  return (
    <button onClick={toggle} disabled={loading}
      className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl font-bold text-sm transition-all active:scale-[0.98] border-[1.5px] ${loading ? 'opacity-60 pointer-events-none' : ''}`}
      style={isOnline ? { background: 'linear-gradient(135deg, #edfbdc, #d4f7b4)', borderColor: '#7ED957' } : { background: '#fff', borderColor: '#e5e7eb' }}>
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center`} style={{ background: isOnline ? '#7ED957' : '#f3f4f6' }}>
          <span className="text-lg">{isOnline ? '🛵' : '💤'}</span>
        </div>
        <div className="text-left">
          <p className="font-black text-gray-900">{loading ? 'Updating…' : isOnline ? 'You\'re Online' : 'Go Online'}</p>
          <p className="text-xs font-normal text-gray-400">{isOnline ? 'Accepting deliveries' : 'Tap to start earning'}</p>
        </div>
      </div>
      <div className={`relative w-12 h-6 rounded-full transition-all ${isOnline ? '' : 'bg-gray-200'}`} style={isOnline ? { background: '#7ED957' } : {}}>
        <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${isOnline ? 'translate-x-6' : 'translate-x-0.5'}`} />
      </div>
    </button>
  );
}
