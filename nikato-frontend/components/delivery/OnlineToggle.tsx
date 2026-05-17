'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/store/auth';
import { useDeliveryStore } from '@/store/delivery';
import { toast } from '@/store/ui';
import { cn } from '@/lib/utils';

export function OnlineToggle() {
  const { user } = useAuthStore();
  const { isOnline, setOnline } = useDeliveryStore();
  const [loading, setLoading] = useState(false);

  async function toggle() {
    if (!user) return;
    setLoading(true);
    const next = !isOnline;

    // ✅ upsert instead of update — creates row if missing
    const { error } = await supabase.from('delivery_locations').upsert(
      { delivery_partner_id: user.id, lat: 0, lng: 0, is_online: next, updated_at: new Date().toISOString() },
      { onConflict: 'delivery_partner_id' }
    );

    if (error) {
      toast.error('Failed to update status', error.message);
    } else {
      setOnline(next);
      toast.success(next ? '🟢 You are now Online' : '🔴 You are now Offline');

      // ✅ If going online, immediately get GPS location
      if (next && navigator?.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async ({ coords }) => {
            await supabase.from('delivery_locations').upsert(
              { delivery_partner_id: user.id, lat: coords.latitude, lng: coords.longitude, is_online: true, updated_at: new Date().toISOString() },
              { onConflict: 'delivery_partner_id' }
            );
          },
          () => {} // silent fail if denied
        );
      }
    }
    setLoading(false);
  }

  return (
    <button onClick={toggle} disabled={loading}
      className={cn(
        'flex items-center gap-3 w-full px-5 py-4 rounded-2xl font-bold text-base transition-all',
        isOnline ? 'bg-green-500 text-white shadow-lg shadow-green-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
        loading && 'opacity-60 pointer-events-none'
      )}>
      <span className={cn('relative w-12 h-6 rounded-full transition-colors', isOnline ? 'bg-white/30' : 'bg-gray-300')}>
        <span className={cn('absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform', isOnline ? 'translate-x-7' : 'translate-x-1')} />
      </span>
      {loading ? 'Updating…' : isOnline ? 'Online — accepting deliveries' : 'Go Online to start'}
    </button>
  );
}
