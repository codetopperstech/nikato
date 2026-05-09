'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useShopStore } from '@/store/shop';
import { toast } from '@/store/ui';
import { cn } from '@/lib/utils';

export function OpenCloseToggle() {
  const { shopData, isOpen, setIsOpen } = useShopStore();
  const [loading, setLoading] = useState(false);

  async function toggle() {
    if (!shopData) return;
    setLoading(true);
    const next = !isOpen;
    const { error } = await supabase
      .from('shops')
      .update({ is_open: next })
      .eq('id', shopData.id);
    if (error) {
      toast.error('Failed to update shop status');
    } else {
      setIsOpen(next);
      toast.success(next ? 'Shop is now Open' : 'Shop is now Closed');
    }
    setLoading(false);
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={cn(
        'flex items-center gap-3 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all',
        isOpen
          ? 'bg-green-100 text-green-700 hover:bg-green-200'
          : 'bg-red-100 text-red-600 hover:bg-red-200',
        loading && 'opacity-60 pointer-events-none'
      )}
    >
      {/* Toggle pill */}
      <span
        className={cn(
          'relative w-10 h-5 rounded-full transition-colors',
          isOpen ? 'bg-green-500' : 'bg-gray-300'
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform',
            isOpen ? 'translate-x-5' : 'translate-x-0.5'
          )}
        />
      </span>
      {isOpen ? 'Open — accepting orders' : 'Closed — not accepting orders'}
    </button>
  );
}
